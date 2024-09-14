import { Point } from "pixi.js";
import { Circle } from "./circle";

export class Product extends Circle {
  constructor(color: string) {
    super(0, 0, 15, { color });
  }

  setPos(x: number, y: number) {
    this.x = x;
    
    this.y = y;
  }

  get centre() {
    return new Point(this.x, this.y);
  }

  get size() {
    return this.radius * 2;
  }
}