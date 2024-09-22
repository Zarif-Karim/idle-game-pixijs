import { Color, Container, Graphics } from "pixi.js";

type CircleOptions = {
  color?: Color | string,
}

export class Circle extends Container {
  public view: Graphics;
  public radius: number;

  constructor(x: number, y: number, radius: number, options?: CircleOptions) {
    super();
    this.view = new Graphics().circle(0,0, radius).fill({ color: options?.color || 'pink' });
    this.addChild(this.view);

    this.position.set(x, y);
    this.setSize(radius, radius);

    this.radius = radius;
  }
}
