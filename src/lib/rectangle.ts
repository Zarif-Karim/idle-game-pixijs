import { Graphics } from "pixi.js";

type RectangleOptions = {
  color?: string,
}

export class Rectangle {
  public view: Graphics;

  constructor(x: number, y: number, w: number, h: number, options?: RectangleOptions) {
    this.view = new Graphics().rect(0,0,w,h).fill({ color: options?.color || 'orange' });
    this.view.position.x = x;
    this.view.position.y = y;
    this.view.width = w;
    this.view.height = h;
  }
}
