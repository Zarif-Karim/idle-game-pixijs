import { Circle } from "./circle";
import { Product } from "./product";
import { Station } from "./stations";
import { generateRandomColorHex } from "./utils";

export class Worker extends Circle {
  static identifier = 0;
  static defaultSize = 30;
  public readonly id: number;

  public hold: Product | null = null;

  constructor(x: number, y: number, size?: number, color?: string) {
    super(x, y, size || Worker.defaultSize, {
      color: color || generateRandomColorHex(),
    });
    Worker.identifier += 1;
    this.id = Worker.identifier;
  }

  moveTo(station: Station | Product, speed: number) {
    // Calculate the distance between the object and the target
    const dx = station.view.x - this.x;
    const dy = station.view.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // if(distance < 0.05*this.radius) return;
    // Calculate the normalized direction vector
    const directionX = dx / distance;
    const directionY = dy / distance;

    // Calculate the movement amount for this frame
    const moveX = directionX * speed;
    const moveY = directionY * speed;

    // Update the object's position
    this.x += moveX;
    this.y += moveY;
  }

  takeProduct(p: Product) {
    this.hold = p;
    this.addChild(this.hold);
  }

  leaveProduct(s: Station) {
    if (!this.hold) throw new Error("Leave Product called but no product held");

    this.removeChild(this.hold!);
    const c = s.centre;
    const p = this.hold;
    this.hold = null;

    p.setPos(c.x, c.y);

    return p;
  }

  makeProduct(s: Station) {
    return s.createProduct();
  }

  isAt(station: Station) {
    const stCentre = station.centre;

    // Calculate the distance between the objects
    const dx = this.x - stCentre.x;
    const dy = this.y - stCentre.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const radius = this.radius;
    const halfWidth = station.size / 2;

    // Check if the distance is less than or equal to the sum of the radii
    // Minus 10 as we want to have some overlap
    return distance <= radius + halfWidth - 10;
  }
}
