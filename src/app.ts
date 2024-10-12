import { type Application, FederatedPointerEvent, Point, Text } from "pixi.js";
import {
  backStations,
  customers,
  deliveryLocations,
  EDGES,
  jobsBack,
  jobsFrontDelivery,
  jobsFrontTakeOrder,
  StateData,
  StateInfo,
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
import { getRandomInt, ICONS, randomPositionMiddle } from "./lib/utils";
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

  // load the game state
  loadGame();

  // add workers
  addWorkers({
    back: StateData.backWorkers,
    front: StateData.frontWorkers,
    customer: StateData.customerWorkers,
  }, app);

  // add the status last so its always visible
  app.stage.addChild(status.text);
  status.update(`${ICONS.MONEYSACK} ${StateData.coins}`);

  // start the game loop
  gameLoop(app);

  // close the station details view with clicked outside the station boundary
  app.stage.on("pointertap", (event: FederatedPointerEvent) => {
    backStations.forEach((bs) => {
      if (!bs.contains(event.global)) {
        bs.infoPopup.visible = false;
      }
    });
  });

  // save game every 1s
  setInterval(() => saveGame(), 1000);
};

function loadGame() {
  for (let key in StateData) {
    const data = localStorage.getItem(key);
    if (data) {
      switch (key) {
        case "stage":
          StateData[key] = data;
          break;
        case "coins":
        case "backWorkers":
        case "frontWorkers":
        case "customerWorkers":
          StateData[key] = Number(data);
          break;
        case "stations":
          const parsedData = JSON.parse(data);
          for(let i = 0; i < backStations.length; i++) {
            for(let l = 0; l < parsedData[i]; l++) {
              backStations[i].upgrade(true);
            }
          }
          break;
        default:
          console.log("unrecognised keyword in StateData");
          throw new Error("unrecognised keyword in StateData");
      }
    }
  }
  // console.log("Game loaded");
}

function saveGame() {
  for (let key in StateData) {
    switch (key) {
      case "stage":
        // stage is hard coaded for now
        localStorage.setItem(key, "1-1");
        break;
      case "coins":
      case "backWorkers":
      case "frontWorkers":
      case "customerWorkers":
        localStorage.setItem(key, StateData[key].toString());
        break;
      case "stations":
        localStorage.setItem(key, JSON.stringify(backStations.map((bs) => bs.LEVEL)));
        break;
      default:
        console.log("unrecognised keyword in StateData");
        throw new Error("unrecognised keyword in StateData");
    }
  }
  localStorage.setItem('lastUpdated', Date().toString());
  // console.log("Game saved");
}

function addWorkerIncreaseButtons(app: Application) {
  createButton(x(90), y(5), "white", "black", { customer: 1 }, app);
  createButton(x(90), y(11), "blue", "white", { front: 1 }, app);
  createButton(x(90), y(17), "green", "white", { back: 1 }, app);
}

function createButton(
  _x: number,
  _y: number,
  bgColor: string,
  txtColor: string,
  worker: any,
  app: Application,
) {
  const btn = new Rectangle(_x, _y, x(8), y(5), { color: bgColor });
  btn.view.on("pointertap", () => addWorkers(worker, app, true));

  const text = new Text({
    text: "+",
    anchor: 0.5,
    style: { fontWeight: "bold", fontSize: "50em", fill: txtColor },
  });
  text.position = btn.centre;
  text.eventMode = "none";

  app.stage.addChild(btn.view, text);
}

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
    [[x(7.95), y(55.9), 5, 7, 2_000], ["cyan", "bottom"]],
    [[x(7.95), y(78.5), 700, 1500, 3_000], ["hotpink", "bottom"]],
    [[x(35.6), y(92.7), 50_000, 170_000, 5_000], ["red", "right"]],
    [[x(35.6), y(70.4), 250_000, 1_200_000, 7_000], ["pink", "right"]],
    [[x(92.04) - BackStation.SIZE, y(55.9), 1_000_000, 50_000_000, 9_000], [
      "yellow",
      "bottom",
    ]],
    [[x(92.04) - BackStation.SIZE, y(78.5), 50_000_000, 1000_000_000, 13_000], [
      "purple",
      "bottom",
    ]],
  ];

  backStations.push(
    ...stationsParams.map(
      (
        [
          [x, y, productPrice, upgradePrice, workDuration],
          [color, slotGrowDirection],
        ],
        category,
      ) => {
        return new BackStation(x, y, {
          category,
          color,
          productPrice,
          upgradePrice,
          workDuration,
          slotGrowDirection,
        });
      },
    ),
  );
  backStations.map((r) => app.stage.addChild(...r.getView()));
}

const gameLoop = (app: Application) => {
  app.ticker.add(() => {
    // the upgradable loop
    // check all the objects to see if they are upgradable and mark them
    // for now only checking back stations
    backStations.forEach((bs) =>
      bs.setUpgradable(bs.canUpgrade(StateData.coins))
    );

    while (!viewUpdateJob.isEmpty) {
      const { job, child } = viewUpdateJob.pop();

      // add to stage
      if (job === "add") {
        app.stage.addChild(child);
      } else if (job === "remove") {
        app.stage.removeChild(child);
      }
    }

    if (!workersBack.isEmpty && !jobsBack.isEmpty) {
      const w = workersBack.pop();
      const j = jobsBack.pop();
      if (!w.doWork(j!, app)) {
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
  { back = 0, front = 0, customer = 0 }: {
    back?: number;
    front?: number;
    customer?: number;
  },
  app: Application,
  incrementMaxCounter = false,
) => {
  // TODO: populate a consumer randomly on the edges and move to waiting waitingArea

  // back workers
  for (let i = 0; i < back; i++) {
    addNewWorker(app, workersBack, "green", incrementMaxCounter);
  }

  // front workers
  for (let i = 0; i < front; i++) {
    addNewWorker(app, workersFront, "blue", incrementMaxCounter);
  }

  for (let i = 0; i < customer; i++) {
    createCustomer(app, incrementMaxCounter);
  }
};

function addNewWorker(app: Application, group: Queue<Worker>, color: string, incrementMaxCounter = false) {
  const { x, y } = randomPositionMiddle(EDGES);
  let w: FrontWorker | BackWorker;
  if (color === "blue") {
    w = new FrontWorker(x, y, { color });
    if(incrementMaxCounter) StateData.frontWorkers += 1;
  } else {
    w = new BackWorker(x, y, { color });
    if(incrementMaxCounter) StateData.backWorkers += 1;
  }

  // add to queue
  group.push(w);

  // add to screen
  app.stage.addChild(w);
}

function createCustomer(app: Application, incrementMaxCounter = false) {
  const generationPoints: Point[] = [
    new Point(-100, 20),
    new Point(EDGES.width / 2, -100),
    new Point(EDGES.width + 100, 100),
  ];

  const gp = generationPoints[getRandomInt(0, generationPoints.length - 1)];

  const { x, y } = gp;
  const w = new CustomerWorker(x, y, { color: "beige" });

  // add to screen
  app.stage.addChild(w);
  // add to queue
  customers.push(w);
  // update StateData
  if(incrementMaxCounter) StateData.customerWorkers += 1;
}
