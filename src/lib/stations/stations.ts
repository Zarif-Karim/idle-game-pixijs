import { Color, Point } from "pixi.js";
import { Rectangle } from "../rectangle";
import { x } from "../../globals";

// NOTE: can extend later to add corners etc
export enum DockPoint {
  TOP = 0,
  BOTTOM = 1,
  LEFT = 2,
  RIGHT = 3,
}

export type StationOptions = {
  color: Color | string;
  interactive?: boolean;
};

export class Station extends Rectangle {
  public static readonly SIZE = x(8);
  public color: Color | string;
  private dockingPoints: Point[] = [];

  constructor(
    x: number,
    y: number,
    { color, interactive = false }: StationOptions,
  ) {
    super(x, y, Station.SIZE, Station.SIZE, { color, interactive });
    this.color = color;

    const hs = Station.SIZE / 2;

    // docking points: mid point of each side
    const dpTop = new Point(x + hs, y);
    const dpBottom = new Point(x + hs, y + Station.SIZE);
    const dpLeft = new Point(x, y + hs);
    const dpRight = new Point(x + Station.SIZE, y + hs);

    this.dockingPoints = [dpTop, dpBottom, dpLeft, dpRight];
  }

  get size() {
    return this.view.width;
  }

  getDockingPoint(side: DockPoint): Point {
    return this.dockingPoints[side];
  }
}
