import { FederatedPointerEvent, Point, type Application } from "pixi.js";

import { Queue } from "./lib/queue";
import { Worker } from "./lib/worker";
import { getRandomInt, randomPositionMiddle } from "./lib/utils";
import { Status } from "./lib/status";
import { Station } from "./lib/stations";

// the rate at which the objects move in the screen
// always multiply this with the deltaTIme
const SPEED = 4;
// right and bottom are dynamically set by app.screen
const EDGES = { top: 0, left: 0, right: -1, bottom: -1 };

const status = new Status("Initialising");

// const consumers: Graphics[] = [];
const jobs: Queue<number> = new Queue();
const workers: Queue<Worker> = new Queue();
const backStations: Station[] = [];

const deliveryLocations: Station[] = [];
const waitingArea: Station[] = [];


export default async (app: Application) => {
  EDGES.right = app.screen.width;
  EDGES.bottom = app.screen.height;

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
    app.stage.addChild(...wa.map(w => w.view));
  }

  [
    new Point(30, 85),
    new Point(280, 170),
    new Point(120, 275)
  ].forEach(adder);
}

function createBackStations(app: Application) {
  backStations.push(...[
    new Station(EDGES.right * 0.0795, EDGES.bottom * 0.559, "blue"),
    new Station(EDGES.right * 0.0795, EDGES.bottom * 0.805, "green"),
    new Station(EDGES.right * 0.356, EDGES.bottom * 0.927, "orange"),
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
    while (!workers.isEmpty) {
      // if not jobs wait for it
      if (jobs.isEmpty) {
        break;
      }

      const w = workers.pop();
      const j = jobs.pop();

      doWork(w!, j!, app);
    }
  });
};

function doWork(w: Worker, jn: number, app: Application) {
  const context = { w, jn, st: Date.now() };
  const st = backStations[jn];
  const { workDuration: wd } = st;

  let state = "station";
  let workStartTime = -1;
  let dt = 0;
  let dl: Station;

  const work = (
    { deltaTime }: { deltaTime: number },
  ) => {
    const speed = SPEED * deltaTime;
    switch (state) {
      case "station":
        // go to the right station
        w.moveTo(st, speed);
        if (w.isAt(st)) {
          // console.log("reached station");
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
          // console.log("work done -> delivering");
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

          // TODO: these products should be deliverd by FE workers
          app.stage.addChild(p);
          setTimeout(() => {
            app.stage.removeChild(p);
          }, 3000);
          // console.log("deliver done");
          state = "done";
        }
        break;
      case "done":
        // console.log("work finished");
        // work done
        app.ticker.remove(work, context);
        // join back into queue
        workers.push(w);
        break;
      default:
        console.log("should never reach default");
        throw new Error("Work fell in default case!");
    }
  };

  app.ticker.add(work, context);
}

const addWorkers = (app: Application) => {
  // populate a consumer randomly on the edges
  const amount = 5;
  for (let i = 0; i < amount; i++) {
    addNewWorker(app);
  }
};

function addNewWorker(app: Application) {
  const { x, y } = randomPositionMiddle(EDGES);
  const w = new Worker(x, y, 30);

  // add to queue
  workers.push(w);

  // add to screen
  app.stage.addChild(w);
}

const jobAdderInterval = (duration: number, maxLength = 15) => {
  setInterval(() => {
    if (jobs.length < maxLength) {
      const randomJob = getRandomInt(0, backStations.length - 1);
      jobs.push(randomJob);
    }
  }, duration);
};
