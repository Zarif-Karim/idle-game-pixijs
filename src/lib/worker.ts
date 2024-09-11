import { Circle } from "./circle";
import { Station } from "./stations";
import { generateRandomColorHex } from "./utils";

export class Worker extends Circle {
  static identifier = 0;
  static defaultSize = 30;
  public readonly id: number;

  constructor(x: number, y: number, size?: number, color?: string) {
    super(x, y, size || Worker.defaultSize, {
      color: color || generateRandomColorHex(),
    });
    Worker.identifier += 1;
    this.id = Worker.identifier;
  }

  moveTo(station: Station, speed: number) {
    // Calculate the distance between the object and the target
    const dx = station.view.x - this.view.x;
    const dy = station.view.y - this.view.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    // Calculate the normalized direction vector
    const directionX = dx / distance;
    const directionY = dy / distance;

    // Calculate the movement amount for this frame
    const moveX = directionX * speed;
    const moveY = directionY * speed;

    // Update the object's position
    this.view.x += moveX;
    this.view.y += moveY;
  }
}
