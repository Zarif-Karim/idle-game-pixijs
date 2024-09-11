import { Point } from "pixi.js";
import { Rectangle } from "./rectangle";
import { Product } from "./product";

const ONE_MS = 1_000; // 1000 ms aka 1 s

export class Station extends Rectangle {
  public static readonly SIZE = 40;
  public workDuration = ONE_MS * 1.5;
  public color: string;

  constructor(x: number, y: number, color: string) {
    super(x, y, Station.SIZE, Station.SIZE, { color });
    this.color = color;
  }

  get centre() {
    return new Point(
      this.view.x + this.view.width / 2,
      this.view.y + this.view.height / 2,
    );
  }

  get width() {
    return this.view.width;
  }

  createProduct() {
    return new Product(this.color);
  }
}
