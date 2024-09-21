import { type Application, FederatedPointerEvent, Graphics, Point } from "pixi.js";
import {
  backStations,
  // CUSTOMERS,
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

  addWorkers({
    back: 5,
    front: 3,
    customer: 6,
  }, app);
  // addCustomers(app);
  assignJobs(app);

  // add the status last so its always visible
  app.stage.addChild(status.text);

  app.stage.on("pointerdown", (e: FederatedPointerEvent) => {
    const { x, y } = e.global;
    status.update(`${x}, ${y}`);
  });

  status.update(`Coins: ${StageData.coins}`);
  loadingBar(300, 250, 25, app);
};

function loadingBar(x: number, y: number, size: number, app: Application) {
  const circleBg = new Graphics().circle(x, y, size).fill({ color: 'white' }).stroke({ width: 2, color: 'lightgrey' });
  app.stage.addChild(circleBg);


  const circleFill = new Graphics().arc(0, 0, 0.9 * size, 0, 2).fill({ color: 'lightblue' });
  const radius = 0.9 * size;
  const startAngle = -Math.PI/2;
  const lbp = (percentage: number) => {
    circleFill.clear();
    const endAngle = startAngle + (percentage * 2 * Math.PI);
    circleFill.arc(0, 0, radius, startAngle, endAngle).fill({ color: 'lightblue' });
  }
  circleFill.position.set(x, y);
  app.stage.addChild(circleFill);
  circleFill.arcTo

  const mask = new Graphics().circle(0,0, 0.8 * size).fill({ color: 'white' });
  mask.position.set(x,y);
  app.stage.addChild(mask)

  let percentage = 0;
  const rate = 0.001;

  app.ticker.add(() => {
    percentage += rate;
    lbp(percentage);
  });
}

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
    const loc = new Station(offset + h * i, middlePoint - h / 2, 50, "grey");
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
      new Station(x, y, 90, color),
      new Station(x + Station.SIZE + stsg, y, 90, color),
      new Station(x + (Station.SIZE + stsg) * 2, y, 90, color),
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
    new Station(x(7.95), y(55.9), 0, "cyan", 1),
    new Station(x(7.95), y(80.5), 1, "hotpink", 15),
    new Station(x(35.6), y(92.7), 2, "red", 110),
    new Station(x(35.6), y(70.4), 3, "pink", 890),
    new Station(x(92.04) - Station.SIZE, y(55.9), 4, "yellow", 5250),
    new Station(x(92.04) - Station.SIZE, y(80.5), 5, "purple", 70_505),
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

// function addCustomers(app: Application) {
//   for (let i = customers.length; i < CUSTOMERS.maxCount; i++) {
//     createCustomer(app);
//   }
// }

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
