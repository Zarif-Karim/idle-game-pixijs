import { ColorSource, Container, Graphics } from "pixi.js";

export type CircleOptions = {
  color?: ColorSource;
};

export class Circle extends Container {
  public view: Graphics;
  public radius: number;
  public color: ColorSource;

  constructor(x: number, y: number, radius: number, options?: CircleOptions) {
    super();
    this.color = options?.color || "pink";
    this.view = new Graphics()
      .circle(0, 0, radius)
      .fill({ color: options?.color || "pink" });
    this.addChild(this.view);

    this.position.set(x, y);
    this.setSize(radius, radius);

    this.radius = radius;
  }
}
