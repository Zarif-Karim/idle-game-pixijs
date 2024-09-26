import { Point } from "pixi.js";
import { DockPoint, Station, StationOptions } from "./stations";

type BackStationSlotOptions = StationOptions & {
  dockSide: DockPoint;
}

export class BackStationSlot extends Station {
  private isFree = true;
  private dockSide: DockPoint;

  constructor(x: number, y: number, { color, dockSide }: BackStationSlotOptions) {
    super(x, y, { color });
    this.view.alpha = 0.5;
    this.dockSide = dockSide;
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
