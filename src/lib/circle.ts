import { Graphics } from "pixi.js";

type CircleOptions = {
  color?: string,
}

export class Circle {
  public view: Graphics;
  public radius: number;

  constructor(x: number, y: number, radius: number, options?: CircleOptions) {
    this.view = new Graphics().circle(0,0, radius).fill({ color: options?.color || 'pink' });
    this.view.position.x = x;
    this.view.position.y = y;
    this.view.width = radius;
    this.view.height = radius;

    this.radius = radius;
  }
}
