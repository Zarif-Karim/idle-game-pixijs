import { Point } from "pixi.js";
import { DockPoint, Station, StationOptions } from "./stations";

type BackStationSlotOptions = StationOptions & {
  dockSide: DockPoint;
  toggleStationDetails: () => void;
};

export class BackStationSlot extends Station {
  private isFree = true;
  private dockSide: DockPoint;

  constructor(
    x: number,
    y: number,
    { color, dockSide, toggleStationDetails }: BackStationSlotOptions,
  ) {
    super(x, y, { color });
    this.view.alpha = 0.5;
    this.dockSide = dockSide;
    this.view.zIndex = -1;

    this.view.on("pointertap", toggleStationDetails);
  }

  occupy() {
    this.isFree = false;
  }

  vacate() {
    this.isFree = true;
  }

  available() {
    return this.isFree;
  }

  getDock(): Point {
    return this.getDockingPoint(this.dockSide);
  }
}
