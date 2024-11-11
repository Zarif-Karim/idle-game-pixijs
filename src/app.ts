import { type Application, FederatedPointerEvent, Point, Text } from "pixi.js";
import {
  backStations,
  customers,
  deliveryLocations,
  EDGES,
  fpsText,
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
import { Grid } from "./lib/grid";
import { TopBoarder } from "./lib/overlay-menu/top";
import { addFullScreenButton } from "./screen-resize";

export const upgradeModerator: UpgradeModerator = new UpgradeModerator();
export const grid: Grid = new Grid();

let startTime = performance.now();
let frameCounter = 0;
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
  loadGame(app);

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
  status.text.zIndex = 20;
  app.stage.addChild(status.text);
  status.update(`${ICONS.MONEYSACK} ${StateData.bcoins}`);

  // start the game loop
  startTime = performance.now();
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
  const saveIntervalId = setInterval(() => saveGame(), 1000);
  localStorage.setItem("saveIntervalId", saveIntervalId.toString());
};

function loadGame(app: Application) {
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
          const parsedStationData = JSON.parse(data);
          for (let i = 0; i < backStations.length; i++) {
            for (let l = 0; l < parsedStationData[i]; l++) {
              backStations[i].upgrade(true);
            }
          }
          break;
        case "upgrades":
          const parsedUpgradesData = JSON.parse(data);
          StateData.upgrades = parsedUpgradesData;
          upgradeModerator.onLoad(parsedUpgradesData, app);
          break;
        default:
          throw new Error(`unrecognised keyword in StateData: ${key}`);
      }
    }
  }
}

// TODO: save speed and upgrade state
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
      case "upgrades":
        localStorage.setItem(key, JSON.stringify(StateData[key]));
        break;
      default:
        throw new Error(`unrecognised keyword in StateData: ${key}`);
    }
  }
  localStorage.setItem("lastUpdated", Date().toString());
}

function addUpgrades(app: Application) {
  app.stage.addChild(upgradeModerator);
  const upgrageFn = () => upgradeModerator.show();
  const ub = createButton(
    x(90),
    y(8),
    "brown",
    { txt: "⬆", color: "yellow", size: x(5) },
    upgrageFn,
    app,
    true,
    5,
  );

  upgradeModerator.setup(
    ub,
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
  interactive = true,
  zIndex = 0,
) {
  const btn = new Rectangle(_x, _y, x(8), y(5), {
    color: bgColor,
    interactive,
  });
  btn.view.on("pointertap", fn);
  btn.view.zIndex = zIndex;

  const txt = new Text({
    text: text.txt,
    anchor: 0.5,
    style: { fontWeight: "bold", fontSize: text.size, fill: text.color },
  });
  txt.position = btn.centre;
  txt.eventMode = "none";
  txt.zIndex = zIndex;

  app.stage.addChild(btn.view, txt);
  return btn;
}

function addScreenBorder(app: Application) {
  const opt = { color: "#1a4761", interactive: false, zIndex: 20 };

  // full screen button factory
  const fsbf = async (x?: number, y?: number) => {
    return await addFullScreenButton(app, x, y);
  };
  const top = new TopBoarder(0, 0, EDGES.width, y(5), fsbf, opt);
  const bottom = new Rectangle(0, EDGES.height - 2, EDGES.width, 2, opt);
  const left = new Rectangle(0, 0, 2, EDGES.height, opt);
  const right = new Rectangle(EDGES.width - 2, 0, 2, EDGES.height, opt);

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
    grid.obstructions(loc);
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
      grid.obstructions(s);
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
      [x(7.95), y(55.9), 12, 7, 3_600],
      ["cyan", "bottom"],
    ],
    [
      [x(7.95), y(78.5), 700, 3_540, 7_200],
      ["hotpink", "bottom"],
    ],
    [
      [x(35.6), y(92.7), 35_400, 177_000, 21_500],
      ["red", "right"],
    ],
    [
      [x(35.6), y(70.4), 1_774_000, 8_870_000, 45_500],
      ["pink", "right"],
    ],
    [
      [x(92.04) - BackStation.SIZE, y(55.9), 88_700_000, 441_875_000, 60_800],
      ["yellow", "bottom"],
    ],
    [
      [
        x(92.04) - BackStation.SIZE,
        y(78.5),
        4_418_750_000,
        22_093_750_000,
        90_000,
      ],
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
        const bs = new BackStation(x, y, {
          category,
          color,
          productPrice,
          upgradePrice,
          workDuration,
          slotGrowDirection,
        });
        grid.obstructions(bs);
        return bs;
      },
    ),
  );
  backStations.map((r) => app.stage.addChild(...r.getView()));
}

const gameLoop = (app: Application) => {
  app.ticker.add(() => {
    // print fps
    ++frameCounter;
    const now = performance.now();
    const diff = now - startTime;
    if (diff >= 1000) {
      const fps = (frameCounter * 1000) / diff;
      fpsText.update(fps.toFixed(2));

      frameCounter = 0;
      startTime = now;
    }

    // the upgradable loop
    // check all the objects to see if they are upgradable and mark them
    // for now only checking back stations
    backStations.forEach((bs) => {
      const ca = bs.canUpgrade(StateData.bcoins);
      bs.setUpgradable(ca);
    });

    upgradeModerator.setAvailableUpgradesMarker(false);
    upgradeModerator.list.items.every((v) => {
      const isUpgradable = (v as UpgradeRow<any>).refreshUpgradableStatus(
        StateData.bcoins,
      );
      isUpgradable && upgradeModerator.setAvailableUpgradesMarker(true);
      return isUpgradable;
    });

    while (!viewUpdateJob.isEmpty) {
      const { job, child, obstruct } = viewUpdateJob.pop();

      // add to stage
      if (job === "add") {
        app.stage.addChild(child);
        if (obstruct) grid.obstructions(child, true);
      } else if (job === "remove") {
        app.stage.removeChild(child);
        if (obstruct) grid.obstructions(child, false);
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
