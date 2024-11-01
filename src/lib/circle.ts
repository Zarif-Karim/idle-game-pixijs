import { ColorSource, Container, Graphics } from "pixi.js";

export type CircleOptions = {
  color?: ColorSource;
};

export class Circle extends Container {
  public view: Graphics;
  public _radius: number;
  public _color: ColorSource;

  constructor(x: number, y: number, radius: number, options?: CircleOptions) {
    super();
    this._color = options?.color || "pink";
    this._radius = radius;

    this.view = new Graphics();
    this.drawCircle();
    this.addChild(this.view);

    // settin size and pos of the container
    this.position.set(x, y);
    this.setSize(radius, radius);
  }

  private drawCircle() {
    this.view.clear().circle(0, 0, this._radius).fill({ color: this._color });
  }

  get color() {
    return this._color;
  }

  set color(newColor: ColorSource) {
    this._color = newColor;
    this.drawCircle();
  }

  get radius() {
    return this._radius;
  }

  set radius(radius: number) {
    this._radius = radius;
    this.drawCircle();
  }
}
