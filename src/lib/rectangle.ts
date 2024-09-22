import { Color, Graphics } from "pixi.js";

type RectangleOptions = {
  color?: Color | string;
};

export class Rectangle {
  public view: Graphics;

  constructor(
    x: number,
    y: number,
    w: number,
    h: number,
    options?: RectangleOptions,
  ) {
    this.view = new Graphics().rect(0, 0, w, h).fill({
      color: options?.color || "orange",
    });
    this.view.position.x = x;
    this.view.position.y = y;
    this.view.width = w;
    this.view.height = h;

    this.view.eventMode = "static";

    this.view.on("pointerover", () => {
      this.view.tint = "grey";
    });
    this.view.on("pointerout", () => {
      this.view.tint = "white";
    });

    this.view.on("pointerdown", () => {
      this.view.tint = "grey";
    });
    this.view.on("pointerup", () => {
      this.view.tint = "white";
    });
  }

  get x() {
    return this.view.x;
  }

  get y() {
    return this.view.y;
  }

  get position() {
    return this.view.position;
  }

  get width() {
    return this.view.width;
  }

  get height() {
    return this.view.height;
  }

  getView() {
    return [this.view];
  }
}
