import { Color, Graphics, Point } from "pixi.js";
import { x, y } from "../globals";

type RectangleOptions = {
  color?: Color | string;
  nx?: number;
  ny?: number;
  nw?: number;
  nh?: number;
};

export class Rectangle extends Graphics {
  // public view: Graphics;

  private width_: number;
  private height_: number;
  private color: string | Color;

  private nx?: number;
  private ny?: number;
  private nw?: number;
  private nh?: number;

  constructor(
    x: number,
    y: number,
    w: number,
    h: number,
    options?: RectangleOptions,
  ) {
    super();

    this.color = options?.color || "orange";
    this.rect(0, 0, w, h).fill({
      color: this.color,
    });

    this.position.x = x;
    this.position.y = y;
    this.width_ = w;
    this.height_ = h;

    // this.view = new Graphics();
    // this.view.width = w;
    // this.view.height = h;

    this.nx = options?.nx;
    this.ny = options?.ny;
    this.nw = options?.nw;
    this.nh = options?.nh;

    this.eventMode = "static";
    this.cursor = "pointer";

    this.on("pointerover", () => {
      this.tint = "lightgrey";
    });
    this.on("pointerout", () => {
      this.tint = "white";
    });

    this.on("pointerdown", () => {
      this.tint = "grey";
    });
    this.on("pointerup", () => {
      this.tint = "lightgrey";
    });
  }

  // get x() {
  //   return this.x;
  // }
  //
  // get y() {
  //   return this.view.y;
  // }
  //
  // get position() {
  //   return this.view.position;
  // }

  get width() {
    return this.width_;
  }

  get height() {
    return this.height_;
  }

  get centre() {
    return new Point(
      this.x + this.width / 2,
      this.y + this.height / 2,
    );
  }

  resize() {
    if (
      typeof this.nx === "undefined" || typeof this.ny === "undefined" ||
      typeof this.nw === "undefined" || typeof this.nh === "undefined"
    ) return;
    console.log("resizing rectangle", this.nx, this.nw);

    const _x = x(this.nx!);
    const _y = y(this.ny!);
    const _w = x(this.nw);
    const _h = y(this.nh);

    this.position.x = _x;
    this.position.y = _y;
    this.width_ = _w;
    this.height_ = _h;

    this.clear();
    this.rect(0, 0, _w, _h).fill({
      color: this.color,
    });
  }

  getView() {
    return [this];
  }
}
