import { Graphics } from "pixi.js";

type RectangleOptions = {
  color?: string,
}

export class Rectangle {
  public view: Graphics;

  constructor(x: number, y: number, w: number, h: number, options?: RectangleOptions) {
    this.view = new Graphics().rect(x,y,w,h).fill({ color: options?.color || 'orange' });
  }
}
