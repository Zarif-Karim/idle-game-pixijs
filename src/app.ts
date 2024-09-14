import { type Application, FederatedPointerEvent, Point } from "pixi.js";

import { Queue } from "./lib/queue";
import { Worker } from "./lib/worker";
import { getRandomInt, randomPositionMiddle } from "./lib/utils";
import { Status } from "./lib/status";
import { Station } from "./lib/stations";
import { Product } from "./lib/product";
import { isMobile } from "./screen-resize";

// the rate at which the objects move in the screen
// always multiply this with the deltaTIme
const SPEED = 4;
// right and bottom are dynamically set by app.screen
const EDGES = { top: 0, left: 0, right: -1, bottom: -1 };

let status: Status;

// const consumers: Graphics[] = [];
const jobsBack: Queue<number> = new Queue();
const workersBack: Queue<Worker> = new Queue();
const backStations: Station[] = [];

const deliveryLocations: Station[] = [];

const jobsFront: Queue<Product> = new Queue();
const workersFront: Queue<Worker> = new Queue();
const waitingArea: Station[] = [];

export default async (app: Application) => {
  status = new Status("Initialising", app);
  EDGES.right = app.screen.width;
  EDGES.bottom = app.screen.height;

  const { agent } = isMobile();
  status.update(JSON.stringify(agent));

  // make whole screen interactable
  app.stage.eventMode = "static";
  app.stage.hitArea = app.screen;

  //app.stage.on("pointermove", (e: FederatedPointerEvent) => {
  //  const { x, y } = e.global;
  //  console.log({x,y});
  //});

  // create delivery destinations
  createMiddlePointHorizontalDeliveryTable(app);

  // create customer waiting waitingArea
  createCustomerWaitingArea(app);

  // add stations
  createBackStations(app);

  jobAdderInterval(1500, 15);
  addWorkers(app);
  assignJobs(app);

  // add the status last so its always visible
  app.stage.addChild(status.text);

  app.stage.on("pointerdown", (e: FederatedPointerEvent) => {
    const { x, y } = e.global;
    status.update(`${x}, ${y}`);
  });
};

function createMiddlePointHorizontalDeliveryTable(app: Application) {
  const h = Station.SIZE;
  const count = EDGES.right / h;
  const middlePoint = EDGES.bottom / 2;
  for (let i = 0; i < count; i++) {
    const loc = new Station(h * i, middlePoint - h / 2, "grey");
    deliveryLocations.push(loc);
    app.stage.addChild(loc.view);
  }
}

function createCustomerWaitingArea(app: Application) {
  const color = "orange";
  const adder = ({ x, y }: Point) => {
    const wa = [
      new Station(x, y, color),
      new Station(x + 42, y, color),
      new Station(x + 84, y, color),
    ];
    waitingArea.push(...wa);
    app.stage.addChild(...wa.map((w) => w.view));
  };

  [
    new Point(30, 85),
    new Point(280, 170),
    new Point(120, 275),
  ].forEach(adder);
}

function createBackStations(app: Application) {
  backStations.push(...[
    new Station(EDGES.right * 0.0795, EDGES.bottom * 0.559, "blue"),
    new Station(EDGES.right * 0.0795, EDGES.bottom * 0.805, "green"),
    new Station(EDGES.right * 0.356, EDGES.bottom * 0.927, "red"),
    new Station(EDGES.right * 0.356, EDGES.bottom * 0.704, "pink"),
    new Station(
      EDGES.right - Station.SIZE - 40,
      EDGES.bottom * 0.559,
      "yellow",
    ),
    new Station(
      EDGES.right - Station.SIZE - 40,
      EDGES.bottom * 0.805,
      "purple",
    ),
  ]);
  app.stage.addChild(...backStations.map((r) => r.view));
}

const assignJobs = (app: Application) => {
  app.ticker.add(() => {
    while (!workersBack.isEmpty) {
      // if not jobs wait for it
      if (jobsBack.isEmpty) {
        break;
      }

      const w = workersBack.pop();
      const j = jobsBack.pop();

      doBackWork(w!, j!, app);
    }
  });

  app.ticker.add(() => {
    while (!workersFront.isEmpty) {
      // if not jobs wait for it
      if (jobsFront.isEmpty) {
        break;
      }

      const w = workersFront.pop();
      const j = jobsFront.pop();

      doFrontWork(w!, j!, app);
    }
  });
};

function doFrontWork(w: Worker, p: Product, app: Application) {
  const context = { w, p, st: Date.now() };
  let state = 'pick';
  // pick a random station to deliver to for now
  // TODO: do delivery to right customer
  const st = waitingArea[getRandomInt(0, waitingArea.length - 1)];

  const work = ({ deltaTime }: { deltaTime: number }) => {
    const speed = SPEED * deltaTime;
    switch(state) {
      case 'pick':
        w.moveTo(p, speed);
        if(w.isAt(p)) {
          // pick product
          app.stage.removeChild(p);
          w.takeProduct(p);
          state = 'deliver';
        }
        break;
      case 'deliver':
        w.moveTo(st, speed);
        if(w.isAt(st)) {
          const _p  = w.leaveProduct(st);
          app.stage.addChild(_p);
          console.log(_p);
          state = 'done';

          // TODO: customer take the product and leave
          // just a timeout for now
          setTimeout(() => {
            app.stage.removeChild(_p);
          }, 5_000);
        }
        break;
      case "done":
        // work done
        app.ticker.remove(work, context);
        // join back into queue
        workersFront.push(w);
        break;
      default:
        console.log("should never reach default");
        throw new Error("Work fell in default case!");
    }
  };

  app.ticker.add(work, context);
}

function doBackWork(w: Worker, jn: number, app: Application) {
  const context = { w, jn, st: Date.now() };
  const st = backStations[jn];
  const { workDuration: wd } = st;

  let state = "station";
  let workStartTime = -1;
  let dt = 0;
  let dl: Station;

  const work = ({ deltaTime }: { deltaTime: number }) => {
    const speed = SPEED * deltaTime;
    switch (state) {
      case "station":
        // go to the right station
        w.moveTo(st, speed);
        if (w.isAt(st)) {
          state = "work";
          workStartTime = Date.now();
        }
        break;

      case "work":
        dt = Date.now() - workStartTime;
        // wait for the required time
        if (dt >= wd) {
          state = "deliver";
          // product pickup
          const product = w.makeProduct(st);
          w.takeProduct(product);

          // choose the delivery location
          dl = deliveryLocations[getRandomInt(0, deliveryLocations.length - 1)];
        } // else {
        // update wait loading bar
        // eg. loadbar(dt/wd);
        // }
        break;

      case "deliver":
        // deliver product
        w.moveTo(dl, speed);
        if (w.isAt(dl)) {
          // move product from hand to table
          const p = w.leaveProduct(dl);
          app.stage.addChild(p);

          // these products should be deliverd by FE workers
          jobsFront.push(p);
          state = "done";
        }
        break;
      case "done":
        // work done
        app.ticker.remove(work, context);
        // join back into queue
        workersBack.push(w);
        break;
      default:
        console.log("should never reach default");
        throw new Error("Work fell in default case!");
    }
  };

  app.ticker.add(work, context);
}

const addWorkers = (app: Application) => {
  // TODO: populate a consumer randomly on the edges and move to waiting waitingArea

  // back workers
  const amountBack = 5;
  for (let i = 0; i < amountBack; i++) {
    addNewWorker(app, workersBack);
  }

  // front workers
  const amountFront = 2;
  for (let i = 0; i < amountFront; i++) {
    addNewWorker(app, workersFront);
  }
};

function addNewWorker(app: Application, group: Queue<Worker>) {
  const { x, y } = randomPositionMiddle(EDGES);
  const w = new Worker(x, y, 30);

  // add to queue
  group.push(w);

  // add to screen
  app.stage.addChild(w);
}

const jobAdderInterval = (duration: number, maxLength = 15) => {
  setInterval(() => {
    if (jobsBack.length < maxLength) {
      const randomJob = getRandomInt(0, backStations.length - 1);
      jobsBack.push(randomJob);
    }
  }, duration);
};
