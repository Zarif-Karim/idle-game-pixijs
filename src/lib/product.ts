import { Circle } from "./circle";

export class Product extends Circle {
  constructor(color: string) {
    super(0, 0, 15, { color });
  }

  setPos(x: number, y: number) {
    this.x = x;
    // this.view.x = x;
    
    this.y = y;
    // this.view.y = y;

  }
}
