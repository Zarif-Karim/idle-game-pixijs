import { type Application, FederatedPointerEvent, Point } from "pixi.js";
import {
  backStations,
  CUSTOMERS,
  customers,
  deliveryLocations,
  EDGES,
  jobsBack,
  jobsFrontDelivery,
  status,
  waitingArea,
  workersBack,
  workersFront,
  x,
  y,
} from "./globals";

import { Queue } from "./lib/queue";
import { doBackWork, doCustomerWork, doFrontWork, Worker } from "./lib/worker";
import { getRandomInt, randomPositionMiddle } from "./lib/utils";
import { Station } from "./lib/stations";
import { Rectangle } from "./lib/rectangle";

export default async (app: Application) => {
  // add a screen border for debugging
  addScreenBorder(app);

  // make whole screen interactable
  app.stage.eventMode = "static";
  app.stage.hitArea = app.screen;

  // create delivery destinations
  createMiddlePointHorizontalDeliveryTable(app);

  // create customer waiting waitingArea
  createCustomerWaitingArea(app);

  // add stations
  createBackStations(app);

  jobAdderInterval(1500, 15);
  addWorkers(app);
  addCustomers(app);
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
    [
      new Station(x, y, color),
      new Station(x + Station.SIZE + stsg, y, color),
      new Station(x + (Station.SIZE + stsg) * 2, y, color),
    ].forEach((s) => {
      waitingArea.push(s);
      app.stage.addChild(s.view);
    });
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
    // console.log(app.ticker.count);
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
      if (jobsFrontDelivery.isEmpty) {
        break;
      }

      const w = workersFront.pop();
      const j = jobsFrontDelivery.pop();

      doFrontWork(w!, j!, app);
    }
  });

  app.ticker.add(() => {
    while (!customers.isEmpty) {
      const c = customers.pop();

      const wa = waitingArea.pop();
      waitingArea.push(wa);

      doCustomerWork(c!, wa!, createCustomer, app);
    }
  });
};

const addWorkers = (app: Application) => {
  // TODO: populate a consumer randomly on the edges and move to waiting waitingArea

  // back workers
  const amountBack = 5;
  for (let i = 0; i < amountBack; i++) {
    addNewWorker(app, workersBack, "green");
  }

  // front workers
  const amountFront = 2;
  for (let i = 0; i < amountFront; i++) {
    addNewWorker(app, workersFront, "blue");
  }
};

function addNewWorker(app: Application, group: Queue<Worker>, color: string) {
  const { x, y } = randomPositionMiddle(EDGES);
  const w = new Worker(x, y, { color });

  // add to queue
  group.push(w);

  // add to screen
  app.stage.addChild(w);
}

function addCustomers(app: Application) {
  for (let i = customers.length; i < CUSTOMERS.maxCount; i++) {
    createCustomer(app);
  }
}

function createCustomer(app: Application /*, _group: Queue<Worker> */) {
  const generationPoints: Point[] = [
    new Point(-100, 20),
    new Point(EDGES.width / 2, -100),
    new Point(EDGES.width + 100, 100),
  ];

  const gp = generationPoints[getRandomInt(0, generationPoints.length - 1)];

  const { x, y } = gp;
  const w = new Worker(x, y, { color: "white" });

  // add to screen
  app.stage.addChild(w);
  // add to queue
  customers.push(w);
}

const jobAdderInterval = (duration: number, maxLength = 15) => {
  setInterval(() => {
    if (jobsBack.length < maxLength) {
      const randomJob = getRandomInt(0, backStations.length - 1);
      jobsBack.push(randomJob);
    }
  }, duration);
};
