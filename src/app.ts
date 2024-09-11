import { type Application, Point } from "pixi.js";

import { Queue } from "./lib/queue";
import { Worker } from "./lib/worker";
import { getRandomInt, randomPositionMiddle } from "./lib/utils";
import { Status } from "./lib/status";
import { Rectangle } from "./lib/rectangle";
import { Station } from "./lib/stations";
import { Product } from "./lib/product";

// the rate at which the objects move in the screen
// always multiply this with the deltaTIme
const SPEED = 4;
// right and bottom are dynamically set by app.screen
const EDGES = { top: 0, left: 0, right: -1, bottom: -1 };

// const consumers: Graphics[] = [];
const jobs: Queue<number> = new Queue();
const workers: Queue<Worker> = new Queue();
const status = new Status("Initialising");
const stations: Station[] = [];
const deliveryLocations: Station[] = [];

export default async (app: Application) => {
  EDGES.right = app.screen.width;
  EDGES.bottom = app.screen.height;

  // make whole screen interactable
  app.stage.eventMode = "static";
  app.stage.hitArea = app.screen;

  // app.stage.on("pointermove", (e: FederatedPointerEvent) => {
  //   console.log(e.global);
  // });

  // create delivery destinations
  createMiddlePointHorizontalDeliveryTable(app);

  // add stations
  createStations(app);

  jobAdderInterval(1500);
  addWorkers(app);
  assignJobs(app);

  // bottom of the screen for debug purposes
  const rect = new Rectangle(
    EDGES.left,
    EDGES.bottom - 1,
    EDGES.right,
    1,
  );

  app.stage.addChild(rect.view);

  // add the status last so its always visible
  app.stage.addChild(status.text);
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

function createStations(app: Application) {
  stations.push(...[
    new Station(EDGES.left + 40, 500, "blue"),
    new Station(EDGES.left + 40, 720, "green"),
    new Station(180, 830, "orange"),
    new Station(180, 630, "pink"),
    new Station(EDGES.right - Station.SIZE - 40, 500, "yellow"),
    new Station(EDGES.right - Station.SIZE - 40, 720, "purple"),
  ]);
  app.stage.addChild(...stations.map((r) => r.view));
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
  const st = stations[jn];
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
          // TODO: move product from hand to table
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
  const amount = 1;
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

const jobAdderInterval = (duration: number) => {
  setInterval(() => {
    if (jobs.length < 10) {
      const randomJob = getRandomInt(0, stations.length - 1);
      jobs.push(randomJob);
    } 
  }, duration);
};
