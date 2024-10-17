import { Graphics } from "pixi.js";
import { ProgressBar } from "./base";

export class RoundProgressBar extends ProgressBar {
  private background = new Graphics();
  private progressFill = new Graphics();
  private foregroundCover = new Graphics();

  private outerRadius: number;
  private fillRadius: number;
  private startAngle = -Math.PI / 2;

  constructor(x: number, y: number, radius: number) {
    super(x, y);
    this.outerRadius = radius;
    this.fillRadius = 0.8 * radius;
    this.createView();
  }

  createView(): void {
    // setting progressFill as white to start off as empty progress
    this.background.circle(0, 0, this.outerRadius).fill("white");
    this.progressFill.circle(0, 0, this.outerRadius * 0.8).fill("white");
    this.foregroundCover.circle(0, 0, this.outerRadius * 0.4).fill("white");

    this.addChild(
      ...[this.background, this.progressFill, this.foregroundCover],
    );
  }

  update(percentage: number) {
    const endAngle = this.startAngle + percentage * 2 * Math.PI;

    this.progressFill.clear();
    this.progressFill
      .arc(0, 0, this.fillRadius, this.startAngle, endAngle, false)
      .lineTo(0, 0)
      .fill("#a8c3ed");

    if (percentage === 0) this.visible = false;
    else this.visible = true;
  }
}
