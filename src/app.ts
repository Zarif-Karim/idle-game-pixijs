import { type Application, Point } from "pixi.js";
import {
  backStations,
  customers,
  deliveryLocations,
  EDGES,
  jobsBack,
  jobsFrontDelivery,
  jobsFrontTakeOrder,
  StageData,
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
import { BackStation, FrontStation } from "./lib/stations";
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

  addWorkers({
    back: 5,
    front: 3,
    customer: 6,
  }, app);
  // addCustomers(app);
  assignJobs(app);

  // add the status last so its always visible
  app.stage.addChild(status.text);

  status.update(`Coins: ${StageData.coins}`);
};

function addScreenBorder(app: Application) {
  const top = new Rectangle(0, 0, EDGES.width, 2);
  const bottom = new Rectangle(0, EDGES.height - 2, EDGES.width, 2);
  const left = new Rectangle(0, 0, 2, EDGES.height);
  const right = new Rectangle(EDGES.width - 2, 0, 2, EDGES.height);

  app.stage.addChild(...[top, bottom, left, right].map((r) => r.view));
}

function createMiddlePointHorizontalDeliveryTable(app: Application) {
  const h = FrontStation.SIZE;
  const count = Math.floor(EDGES.width / h);
  const middlePoint = EDGES.height / 2;
  const offset = (EDGES.width - (count * h)) / 2;
  for (let i = 0; i < count; i++) {
    const loc = new FrontStation(offset + h * i, middlePoint - h / 2, {
      color: "grey",
    });
    deliveryLocations.push(loc);
    app.stage.addChild(loc.view);
  }
}

function createCustomerWaitingArea(app: Application) {
  const options = { color: "orange" };
  // station size with gap
  const stsg = FrontStation.SIZE * 0.1;
  const adder = ({ x, y }: Point) => {
    [
      new FrontStation(x, y, options),
      new FrontStation(x + FrontStation.SIZE + stsg, y, options),
      new FrontStation(x + (FrontStation.SIZE + stsg) * 2, y, options),
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
  const stationsParams: Array<[Array<number>, Array<string>]> = [
    [[x(7.95), y(55.9), 0, 1, 2_000], ["cyan", "bottom"]],
    [[x(7.95), y(78.5), 1, 15, 3_000], ["hotpink", "bottom"]],
    [[x(35.6), y(92.7), 2, 110, 5_000], ["red", "right"]],
    [[x(35.6), y(70.4), 3, 890, 6_000], ["pink", "right"]],
    [[x(92.04) - BackStation.SIZE, y(55.9), 4, 5250, 9_000], ["yellow", "bottom"]],
    [[x(92.04) - BackStation.SIZE, y(78.5), 5, 70_505, 13_000], ["purple", "bottom"]],
  ];

  backStations.push(
    ...stationsParams.map(([[x, y, category, price, workDuration], [color, slotGrowDirection]]) => {
      return new BackStation(x, y, { category, color, price, workDuration, slotGrowDirection });
    }),
  );
  backStations.map((r) => app.stage.addChild(...r.getView()));
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
      if (!jobsFrontTakeOrder.isEmpty) {
        const w = workersFront.pop();
        const j = jobsFrontTakeOrder.pop();

        doFrontWork(w!, j!, app);
      } else if (!jobsFrontDelivery.isEmpty) {
        const w = workersFront.pop();
        const j = jobsFrontDelivery.pop();

        doFrontWork(w!, j!, app);
      } else {
        // if no jobs, wait for it
        break;
      }
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

const addWorkers = (
  options: { back: number; front: number; customer: number },
  app: Application,
) => {
  // TODO: populate a consumer randomly on the edges and move to waiting waitingArea

  // back workers
  const amountBack = options.back;
  for (let i = 0; i < amountBack; i++) {
    addNewWorker(app, workersBack, "green");
  }

  // front workers
  const amountFront = options.front;
  for (let i = 0; i < amountFront; i++) {
    addNewWorker(app, workersFront, "blue");
  }

  const amountCustomer = options.customer;
  for (let i = 0; i < amountCustomer; i++) {
    createCustomer(app);
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
