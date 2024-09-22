import { Color, Point } from "pixi.js";
import { Rectangle } from "./rectangle";
import { Product } from "./product";
import { x } from "../globals";

const ONE_MS = 1_000; // 1000 ms aka 1 s

// NOTE: can extend later to add corners etc
export enum DockPoint {
  TOP = 0,
  BOTTOM = 1,
  LEFT = 2,
  RIGHT = 3,
}

export type StationOptions = {
  // identifier
  category: number;
  // starting price of produced product
  price?: number;
  // starting time in milliseconds for work to complete
  workDuration?: number;
  color: Color | string;
}

export class Station extends Rectangle {
  public static readonly SIZE = x(8);
  public workDuration = ONE_MS * 1.5;
  public color: Color | string;
  public category: number;
  public price: number;

  private dockingPoints: Point[] = [];

  constructor(x: number, y: number, { color, price = 0, workDuration = 0, category }: StationOptions) {
    super(x, y, Station.SIZE, Station.SIZE, { color });
    this.color = color;
    this.category = category;
    this.price = price;
    this.workDuration = workDuration;

    const hs = Station.SIZE / 2;

    // docking points: mid point of each side
    const dpTop = new Point(x + hs, y);
    const dpBottom = new Point(x + hs, y + Station.SIZE);
    const dpLeft = new Point(x, y + hs);
    const dpRight = new Point(x + Station.SIZE, y + hs);

    this.dockingPoints = [dpTop, dpBottom, dpLeft, dpRight];
  }

  get centre() {
    return new Point(
      this.view.x + this.view.width / 2,
      this.view.y + this.view.height / 2,
    );
  }

  get size() {
    return this.view.width;
  }

  createProduct() {
    return new Product(this.category, this.color, this.price);
  }

  getDockingPoint(side: DockPoint) {
    return this.dockingPoints[side];
  }
}
