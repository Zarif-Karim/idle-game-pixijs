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
  status,
  viewUpdateJob,
  waitingArea,
  workersBack,
  workersFront,
  x,
  y,
} from "./globals";

import { BackWorker, FrontWorker } from "./lib/workers";
import { addNewWorker, createCustomer, ICONS } from "./lib/utils";
import { BackStation, FrontStation } from "./lib/stations";
import { Rectangle } from "./lib/rectangle";
import { CustomerWorker } from "./lib/workers/customer-worker";
import { BigNumber } from "./lib/idle-bignum";
import { Upgrade, UpgradeModerator, UpgradeRow } from "./lib/upgrades";

export const upgradeModerator: UpgradeModerator = new UpgradeModerator();

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
  addUpgrades(app);

  // load the game state
  loadGame();

  // add workers
  addWorkers(
    {
      back: StateData.backWorkers,
      front: StateData.frontWorkers,
      customer: StateData.customerWorkers,
    },
    app,
  );

  // add the status last so its always visible
  app.stage.addChild(status.text);
  status.update(`${ICONS.MONEYSACK} ${StateData.bcoins}`);

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
        case "bcoins":
          const { value, exp, negative } = JSON.parse(data);
          StateData[key] = new BigNumber(value, exp, negative);
          break;
        case "backWorkers":
        case "frontWorkers":
        case "customerWorkers":
          StateData[key] = Number(data);
          break;
        case "stations":
          const parsedData = JSON.parse(data);
          for (let i = 0; i < backStations.length; i++) {
            for (let l = 0; l < parsedData[i]; l++) {
              backStations[i].upgrade(true);
            }
          }
          break;
        default:
          throw new Error("unrecognised keyword in StateData");
      }
    }
  }
}

function saveGame() {
  for (let key in StateData) {
    switch (key) {
      case "stage":
        // stage is hard coaded for now
        localStorage.setItem(key, "1-1");
        break;
      case "bcoins":
        localStorage.setItem(key, StateData[key].serialize());
        break;
      case "backWorkers":
      case "frontWorkers":
      case "customerWorkers":
        localStorage.setItem(key, StateData[key].toString());
        break;
      case "stations":
        localStorage.setItem(
          key,
          JSON.stringify(backStations.map((bs) => bs.LEVEL)),
        );
        break;
      default:
        throw new Error("unrecognised keyword in StateData");
    }
  }
  localStorage.setItem("lastUpdated", Date().toString());
}

function addUpgrades(app: Application) {
  app.stage.addChild(upgradeModerator.list);
  const upgrageFn = () => upgradeModerator.show();
  createButton(
    x(90),
    y(5),
    "brown",
    { txt: "⬆", color: "yellow", size: x(5) },
    upgrageFn,
    app,
  );

  upgradeModerator.load(
    [
      new Upgrade(
        new CustomerWorker(0, 0, { color: "white" }),
        BigNumber.from(190),
        1,
        "customer",
      ),
      new Upgrade(
        new BackWorker(0, 0, { color: "green" }),
        BigNumber.from(850),
        1,
        "worker-back",
      ),
      new Upgrade(
        new CustomerWorker(0, 0, { color: "white" }),
        new BigNumber(5.67, 3),
        1,
        "customer",
      ),
      new Upgrade(backStations[0], new BigNumber(14.2, 3), 2, "speed"),
      new Upgrade(
        new FrontWorker(0, 0, { color: "blue" }),
        new BigNumber(21.3, 3),
        1,
        "worker-front",
      ),
      new Upgrade(
        new CustomerWorker(0, 0, { color: "white" }),
        new BigNumber(42.5, 3),
        1,
        "customer",
      ),
      new Upgrade(
        new CustomerWorker(0, 0, { color: "white" }),
        new BigNumber(142, 3),
        1,
        "customer",
      ),
      new Upgrade(
        new BackWorker(0, 0, { color: "green" }),
        new BigNumber(170, 3),
        1,
        "worker-back",
      ),
      new Upgrade(backStations[0], new BigNumber(425, 3), 3, "price"),
      new Upgrade(backStations[1], new BigNumber(709, 3), 2, "speed"),
      new Upgrade(
        new CustomerWorker(0, 0, { color: "white" }),
        new BigNumber(1.14, 6),
        1,
        "customer",
      ),
      // walk faster 2.84million
      new Upgrade(
        new BackWorker(0, 0, { color: "green" }),
        new BigNumber(2.84, 6),
        1.2,
        "worker-speed",
      ),
      new Upgrade(backStations[0], new BigNumber(11.4, 6), 2, "speed"),
      new Upgrade(
        new CustomerWorker(0, 0, { color: "white" }),
        new BigNumber(12.8, 6),
        1,
        "customer",
      ),
      new Upgrade(
        new BackWorker(0, 0, { color: "green" }),
        new BigNumber(14.2, 6),
        1,
        "worker-back",
      ),
      new Upgrade(backStations[1], new BigNumber(21.3, 6), 3, "price"),
      new Upgrade(backStations[2], new BigNumber(35.5, 6), 2, "speed"),
      new Upgrade(
        new CustomerWorker(0, 0, { color: "white" }),
        new BigNumber(120, 6),
        2,
        "customer",
      ),
      new Upgrade(backStations[0], new BigNumber(128, 6), 5, "price"),
      new Upgrade(backStations[1], new BigNumber(567, 6), 2, "speed"),
      new Upgrade(
        new CustomerWorker(0, 0, { color: "white" }),
        new BigNumber(850, 6),
        2,
        "customer",
      ),
    ],
    app,
  );
}

function createButton(
  _x: number,
  _y: number,
  bgColor: string,
  text: { txt: string; color: string; size: number },
  fn: () => void,
  app: Application,
) {
  const btn = new Rectangle(_x, _y, x(8), y(5), { color: bgColor });
  btn.view.on("pointertap", fn);

  const txt = new Text({
    text: text.txt,
    anchor: 0.5,
    style: { fontWeight: "bold", fontSize: text.size, fill: text.color },
  });
  txt.position = btn.centre;
  txt.eventMode = "none";

  app.stage.addChild(btn.view, txt);
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
  const offset = (EDGES.width - count * h) / 2;
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
    [
      [x(7.95), y(55.9), 5, 7, 2_000],
      ["cyan", "bottom"],
    ],
    [
      [x(7.95), y(78.5), 700, 1500, 3_000],
      ["hotpink", "bottom"],
    ],
    [
      [x(35.6), y(92.7), 50_000, 170_000, 5_000],
      ["red", "right"],
    ],
    [
      [x(35.6), y(70.4), 250_000, 1_200_000, 7_000],
      ["pink", "right"],
    ],
    [
      [x(92.04) - BackStation.SIZE, y(55.9), 1_000_000, 50_000_000, 9_000],
      ["yellow", "bottom"],
    ],
    [
      [x(92.04) - BackStation.SIZE, y(78.5), 50_000_000, 1000_000_000, 13_000],
      ["purple", "bottom"],
    ],
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
    backStations.forEach((bs) => {
      const ca = bs.canUpgrade(StateData.bcoins);
      bs.setUpgradable(ca);
    });

    upgradeModerator.list.items.every((v) =>
      (v as UpgradeRow<any>).refreshUpgradableStatus(StateData.bcoins),
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
        // observer log below to see concern
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

      const wa = waitingArea.reduce((p, c) => {
        if (p.occupants.size < c.occupants.size) return p;
        else return c;
      }, waitingArea[0]);

      c.doWork(wa!, createCustomer, app);
    }
  });
};

const addWorkers = (
  {
    back = 0,
    front = 0,
    customer = 0,
  }: {
    back?: number;
    front?: number;
    customer?: number;
  },
  app: Application,
  incrementMaxCounter = false,
) => {
  // back workers
  for (let i = 0; i < back; i++) {
    addNewWorker(app, "back", incrementMaxCounter);
  }

  // front workers
  for (let i = 0; i < front; i++) {
    addNewWorker(app, "front", incrementMaxCounter);
  }

  for (let i = 0; i < customer; i++) {
    createCustomer(app, incrementMaxCounter);
  }
};
