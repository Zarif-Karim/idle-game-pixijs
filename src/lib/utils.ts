import { Graphics, Point } from "pixi.js";

interface Edges {
  top: number;
  height: number;
  width: number;
  left: number;
}

export enum ICONS {
  MONEYSACK = "💰",
};

// generation random hex avoiding too much black
export function generateRandomColorHex(): string {
  const components = ["r", "g", "b"];
  const colorHex = "#" + components.map(() => {
    return (Math.floor(Math.random() * 256 - 10) + 10).toString(16).padStart(2, "0");
  }).join("");

  return colorHex;
}

export const makeTarget = (
  { x, y }: Point | { x: number; y: number },
  radius?: number,
): Graphics => {
  const target = new Graphics().circle(0, 0, radius || 20).fill({
    color: generateRandomColorHex(),
  }).stroke({ color: 0x111111, alpha: 0.87, width: 1 });
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
  if(!condition) throw new Error(msg);
};
