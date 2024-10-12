import { Graphics } from "pixi.js";
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
    this.background.roundRect(0,0, this.localWidth, this.localHeight, this.outerRadius).fill("white");
    this.progressFill.roundRect(0, 0, this.localWidth * 0.8, this.localHeight * 0.6).fill("#a8c3ed");

    this.addChild(...[
      this.background,
      this.progressFill,
    ]);
  }

  update(percentage: number) {
    console.log(percentage)
  }
}
