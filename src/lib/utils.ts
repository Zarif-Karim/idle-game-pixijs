import { Graphics, Point } from "pixi.js";

export function generateRandomColorHex(): string {
  const components = ["r", "g", "b"];
  const colorHex = "#" + components.map(() => {
    return Math.floor(Math.random() * 256).toString(16).padStart(2, "0");
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
