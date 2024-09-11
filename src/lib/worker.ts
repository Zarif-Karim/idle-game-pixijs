import { Circle } from "./circle";
import { generateRandomColorHex } from "./utils";

export class Worker extends Circle {
  static identifier = 0;
  static defaultSize = 15;
  public readonly id: number;

  constructor(x: number, y: number, size?: number, color?: string) {
    super(x, y, size || Worker.defaultSize, { color: color || generateRandomColorHex()})
    Worker.identifier += 1;
    this.id = Worker.identifier;
  }
}

