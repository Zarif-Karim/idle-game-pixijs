import { type Application, FederatedPointerEvent, Point } from "pixi.js";
import {
  backStations,
  deliveryLocations,
  EDGES,
  jobsBack,
  jobsFront,
  SPEED,
  status,
  waitingArea,
  workersBack,
  workersFront,
  x,
  y,
} from "./globals";

import { Queue } from "./lib/queue";
import { Worker } from "./lib/worker";
import { getRandomInt, randomPositionMiddle } from "./lib/utils";
import { Station } from "./lib/stations";
import { Product } from "./lib/product";
import { Rectangle } from "./lib/rectangle";

export default async (app: Application) => {
  // add a screen border for debugging
  addScreenBorder(app);

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

function addScreenBorder(app: Application) {
  const top = new Rectangle(0, 0, EDGES.width, 2);
  const bottom = new Rectangle(0, EDGES.height - 2, EDGES.width, 2);
  const left = new Rectangle(0, 0, 2, EDGES.height);
  const right = new Rectangle(EDGES.width - 2, 0, 2, EDGES.height);

  app.stage.addChild(...[top, bottom, left, right].map((r) => r.view));
}

function createMiddlePointHorizontalDeliveryTable(app: Application) {
  const h = Station.SIZE;
  const count = Math.floor(EDGES.width / h);
  const middlePoint = EDGES.height / 2;
  const offset = (EDGES.width - (count * h)) / 2;
  for (let i = 0; i < count; i++) {
    const loc = new Station(offset + h * i, middlePoint - h / 2, "grey");
    deliveryLocations.push(loc);
    app.stage.addChild(loc.view);
  }
}

function createCustomerWaitingArea(app: Application) {
  const color = "orange";
  // station size with gap
  const stsg = Station.SIZE * 0.1;
  const adder = ({ x, y }: Point) => {
    const wa = [
      new Station(x, y, color),
      new Station(x + Station.SIZE + stsg, y, color),
      new Station(x + (Station.SIZE + stsg) * 2, y, color),
    ];
    waitingArea.push(...wa);
    app.stage.addChild(...wa.map((w) => w.view));
  };

  [
    new Point(x(6), y(9.5)),
    new Point(x(56), y(19)),
    new Point(x(24), y(31)),
  ].forEach(adder);
}

function createBackStations(app: Application) {
  backStations.push(...[
    new Station(x(7.95), y(55.9), "blue"),
    new Station(x(7.95), y(80.5), "green"),
    new Station(x(35.6), y(92.7), "red"),
    new Station(x(35.6), y(70.4), "pink"),
    new Station(x(92.04) - Station.SIZE, y(55.9), "yellow"),
    new Station(x(92.04) - Station.SIZE, y(80.5), "purple"),
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
  let state = "pick";
  // pick a random station to deliver to for now
  // TODO: do delivery to right customer
  const st = waitingArea[getRandomInt(0, waitingArea.length - 1)];

  const work = ({ deltaTime }: { deltaTime: number }) => {
    const speed = SPEED * deltaTime;
    switch (state) {
      case "pick":
        w.moveTo(p, speed);
        if (w.isAt(p)) {
          // pick product
          app.stage.removeChild(p);
          w.takeProduct(p);
          state = "deliver";
        }
        break;
      case "deliver":
        w.moveTo(st, speed);
        if (w.isAt(st)) {
          const _p = w.leaveProduct(st);
          app.stage.addChild(_p);
          state = "done";

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
        // TODO: use moveTo as the if condition
        w.moveTo(st, speed)
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
  const w = new Worker(x, y);

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
