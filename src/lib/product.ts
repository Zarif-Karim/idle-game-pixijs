import { Color, Point } from "pixi.js";
import { Circle } from "./circle";
import { x } from "../globals";

export class Product extends Circle {
  public category: number;
  public readonly price: number;

  constructor(category: number, color: Color | string, price: number) {
    super(0, 0, x(3), { color });
    this.category = category;
    this.price = price;
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
