import { Circle } from "./circle";

export class Product extends Circle {
  constructor(color: string) {
    super(0, 0, 15, { color });
  }
}
