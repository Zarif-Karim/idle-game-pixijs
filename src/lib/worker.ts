import { makeTarget } from "./utils";
import { Graphics } from "pixi.js";

export class Worker {
  static identifier = 0;
  static defaultSize = 15;
  public view: Graphics;
  public readonly id: number;

  constructor(position: { x: number, y: number }, size?: number) {
    this.view = makeTarget(position, size || Worker.defaultSize);
    Worker.identifier += 1;
    this.id = Worker.identifier;
  }
}

