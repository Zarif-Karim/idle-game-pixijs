import { Container, Graphics } from "pixi.js";

type CircleOptions = {
  color?: string,
}

export class Circle extends Container {
  public view: Graphics;
  public radius: number;

  constructor(x: number, y: number, radius: number, options?: CircleOptions) {
    super();
    this.view = new Graphics().circle(0,0, radius).fill({ color: options?.color || 'pink' });
    this.addChild(this.view);

    this.position.x = x;
    this.position.y = y;
    this.setSize(radius, radius);

    this.radius = radius;
  }
}
