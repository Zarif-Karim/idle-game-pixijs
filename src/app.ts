import { type Application, Point, Text } from "pixi.js";
import {
    addToView,
  backStations,
  customers,
  deliveryLocations,
  EDGES,
  jobsBack,
  jobsFrontDelivery,
  jobsFrontTakeOrder,
  removeFromView,
  StageData,
  status,
  viewUpdateJob,
  waitingArea,
  workersBack,
  workersFront,
  x,
  y,
} from "./globals";

import { Queue } from "./lib/queue";
import { BackWorker, FrontWorker, Worker } from "./lib/workers";
import { getRandomInt, randomPositionMiddle } from "./lib/utils";
import { BackStation, FrontStation } from "./lib/stations";
import { Rectangle } from "./lib/rectangle";
import { CustomerWorker } from "./lib/workers/customer-worker";

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
  // add workers count upgrade buttons
  addWorkerIncreaseButtons(app);
  // add workers
  addWorkers({
    back: 3,
    front: 1,
    customer: 3,
  }, app);

  // add the status last so its always visible
  addToView(app, status.text);
  status.update(`Coins: ${StageData.coins}`);

  // start the game loop
  gameLoop(app);
};

function addWorkerIncreaseButtons(app: Application) {
  createButton(x(90), y(5), 'white', 'black', { customer: 1 }, app);
  createButton(x(90), y(11), 'blue', 'white', { front: 1 }, app);
  createButton(x(90), y(17), 'green', 'white', { back: 1 }, app);
}

function createButton(_x: number, _y: number, bgColor: string, txtColor: string, worker: any, app: Application) {
  const btn = new Rectangle(_x, _y, x(8), y(5), { color: bgColor });
  btn.on('pointertap', () => addWorkers(worker, app));

  const text = new Text({ text: '+', anchor: 0.5, style: { fontWeight: 'bold', fontSize: '50em', fill: txtColor }});
  text.position = btn.centre;
  text.eventMode = 'none';
  (text as any).resize = () => {};

  addToView(app, btn, text);
}

function addScreenBorder(app: Application) {
  const top = new Rectangle(0, 0, EDGES.width, 2, { nx: 0, ny: 0, nw: 100, nh: 0.5 });
  const bottom = new Rectangle(0, EDGES.height - 2, EDGES.width, 2);
  const left = new Rectangle(0, 0, 2, EDGES.height);
  const right = new Rectangle(EDGES.width - 2, 0, 2, EDGES.height);

  addToView(app, ...[top, bottom, left, right]);
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
    addToView(app, loc);
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
      addToView(app, s);
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
    [[x(7.95), y(55.9), 1, 2_000], ["cyan", "bottom"]],
    [[x(7.95), y(78.5), 15, 3_000], ["hotpink", "bottom"]],
    [[x(35.6), y(92.7), 110, 5_000], ["red", "right"]],
    [[x(35.6), y(70.4), 890, 6_000], ["pink", "right"]],
    [[x(92.04) - BackStation.SIZE, y(55.9), 5250, 9_000], ["yellow", "bottom"]],
    [[x(92.04) - BackStation.SIZE, y(78.5), 70_505, 13_000], ["purple", "bottom"]],
  ];

  backStations.push(
    ...stationsParams.map(([[x, y, price, workDuration], [color, slotGrowDirection]], category) => {
      return new BackStation(x, y, { category, color, price, workDuration, slotGrowDirection });
    }),
  );
  backStations.map((r) => addToView(app, ...r.getView()));
  // make the first station unlocked automatically for now!
  backStations[0].upgrade();
}

const gameLoop = (app: Application) => {
  app.ticker.add(() => {
    while(!viewUpdateJob.isEmpty) {
      const { job, child } = viewUpdateJob.pop();
      
      // add to stage
      if(job === 'add') {
        child.zIndex = -1;
        addToView(app, child);
      } else if (job === 'remove') {
        removeFromView(app, child);
      }
    }

    if (!workersBack.isEmpty && !jobsBack.isEmpty) {
      const w = workersBack.pop();
      const j = jobsBack.pop();
      if(!w.doWork(j!, app)) {
        // TODO: look for a better way to do this
        // observer console.log to see concern
        // if not done, push back for now
        workersBack.push(w!);
        jobsBack.push(j!);
        // console.log("Jobs back", jobsBack.length);
      }
    }

    if (!workersFront.isEmpty) {
      if (!jobsFrontTakeOrder.isEmpty) {
        const w = workersFront.pop();
        const j = jobsFrontTakeOrder.pop();

        w.doWork(j!, app);
      } else if (!jobsFrontDelivery.isEmpty) {
        const w = workersFront.pop();
        const j = jobsFrontDelivery.pop();

        w.doWork(j!, app);
      }
      // if no jobs, wait for it
     }

    if (!customers.isEmpty) {
      const c = customers.pop();

      // TODO: debug why customers going to 
      // occupied table when there are free ones
      const wa = waitingArea.pop();
      waitingArea.push(wa);

      c.doWork(wa!, createCustomer, app);
    }
  });
};

const addWorkers = (
  { back = 0, front = 0, customer = 0 }: { back?: number; front?: number; customer?: number },
  app: Application,
) => {
  // TODO: populate a consumer randomly on the edges and move to waiting waitingArea

  // back workers
  for (let i = 0; i < back; i++) {
    addNewWorker(app, workersBack, "green");
  }

  // front workers
  for (let i = 0; i < front; i++) {
    addNewWorker(app, workersFront, "blue");
  }

  for (let i = 0; i < customer; i++) {
    createCustomer(app);
  }
};

function addNewWorker(app: Application, group: Queue<Worker>, color: string) {
  const { x, y } = randomPositionMiddle(EDGES);
  const WorkerClass = color === "blue" ? FrontWorker : BackWorker;
  const w = new WorkerClass(x, y, { color });

  // add to queue
  group.push(w);

  // add to screen
  addToView(app, w);
}

function createCustomer(app: Application /*, _group: Queue<Worker> */) {
  const generationPoints: Point[] = [
    new Point(-100, 20),
    new Point(EDGES.width / 2, -100),
    new Point(EDGES.width + 100, 100),
  ];

  const gp = generationPoints[getRandomInt(0, generationPoints.length - 1)];

  const { x, y } = gp;
  const w = new CustomerWorker(x, y, { color: "white" });

  // add to screen
  addToView(app, w);
  // add to queue
  customers.push(w);
}
