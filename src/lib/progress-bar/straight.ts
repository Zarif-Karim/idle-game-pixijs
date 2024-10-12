import { Graphics, Text } from "pixi.js";
import { ProgressBar } from "./base";

export class StraightProgressBar extends ProgressBar {
  private background = new Graphics();
  private progressFill = new Graphics();
  private localWidth: number;
  private localHeight: number;

  private outerRadius: number;

  constructor(x: number, y: number, w: number, h: number, radius: number = 1) {
    super(x, y);
    this.outerRadius = radius;

    // this dont work!!! width remains zero in createView function
    // added class specific local width and height var
    this.width = w;
    this.height = h;
    this.localWidth = w;
    this.localHeight = h;

    this.createView();
  }

  createView(): void {
    this.background.roundRect(
      0,
      0,
      this.localWidth,
      this.localHeight,
      this.outerRadius,
    ).fill("white");

    const pw = this.localWidth * 0.8;
    const ph = this.localHeight * 0.5;
    const px = this.localWidth / 2 - pw / 2;
    const py = this.localHeight / 2 - ph / 2;
    this.progressFill.roundRect(px, py, pw, ph).fill("#a8c3ed");

    this.addChild(...[
      this.background,
      this.progressFill,
    ]);
  }

  update(percentage: number) {
    console.log(percentage);
  }
}
