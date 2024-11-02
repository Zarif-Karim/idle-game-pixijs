import { Application, Graphics, Point } from "pixi.js";
import {
  customers,
  EDGES,
  StateData,
  workersBack,
  workersFront,
} from "../globals";
import { BackWorker, FrontWorker, CustomerWorker } from "./workers";

interface Edges {
  top: number;
  height: number;
  width: number;
  left: number;
}

export enum ICONS {
  MONEYSACK = "💰",
  CLOCK = "🕒",
}

// generation random hex avoiding too much black
export function generateRandomColorHex(): string {
  const components = ["r", "g", "b"];
  const colorHex =
    "#" +
    components
      .map(() => {
        return (Math.floor(Math.random() * 256 - 10) + 10)
          .toString(16)
          .padStart(2, "0");
      })
      .join("");

  return colorHex;
}

export const makeTarget = (
  { x, y }: Point | { x: number; y: number },
  radius?: number,
): Graphics => {
  const target = new Graphics()
    .circle(0, 0, radius || 20)
    .fill({
      color: generateRandomColorHex(),
    })
    .stroke({ color: 0x111111, alpha: 0.87, width: 1 });
  target.position.set(x, y);
  return target;
};

export function getRandomInt(min: number, max: number) {
  min = Math.floor(min);
  max = Math.ceil(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const randomPositionMiddle = (edges: Edges) => {
  const { top, width, left, height } = edges;
  const middle = (height - top) / 2;
  const midLeft = new Point(left, middle);
  const midRight = new Point(width, middle);
  return randomPoint(midLeft, midRight);
};

export const randomPoint = (a: Point, b: Point) => {
  const [minX, maxX] = [Math.min(a.x, b.x), Math.max(a.x, b.x)];
  const dx = maxX - minX;

  const [minY, maxY] = [Math.min(a.y, b.y), Math.max(a.y, b.y)];
  const dy = maxY - minY;

  const randomFraction = Math.random();
  return new Point(minX + dx * randomFraction, minY + dy * randomFraction);
};

/**
 * @description throws an error with the given msg if condition not met
 * @param condition the condition that must be true otherwise error is thrown
 * @param msg the message to be displayed if error is thrown
 */
export function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(msg);
}

export function addNewWorker(
  app: Application,
  type: string,
  incrementMaxCounter = false,
) {
  const { x, y } = randomPositionMiddle(EDGES);
  let w: FrontWorker | BackWorker;
  if (type === "front") {
    w = new FrontWorker(x, y - 30, { color: "blue" });
    workersFront.push(w);
    if (incrementMaxCounter) StateData.frontWorkers += 1;
  } else if (type === "back") {
    w = new BackWorker(x, y + 30, { color: "green" });
    workersBack.push(w);
    if (incrementMaxCounter) StateData.backWorkers += 1;
  } else {
    throw new Error("Wrong type");
  }

  // add to screen
  app.stage.addChild(w);
}

export function createCustomer(app: Application, incrementMaxCounter = false) {
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
  if (incrementMaxCounter) StateData.customerWorkers += 1;
}
