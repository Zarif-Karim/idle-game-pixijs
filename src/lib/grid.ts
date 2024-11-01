import { Container } from "pixi.js";
import { viewUpdateJob, x, y } from "../globals";
import { Circle } from "./circle";

export class Grid extends Container {
  public readonly dotRadius: number;
  public world: Array<Array<Circle>>;

  constructor(radius = x(1)) {
    super({
      x: 0,
      y: 0,
      width: x(100),
      height: y(100),
      tint: "lightgreen",
      zIndex: 1,
    });
    this.eventMode = "none";
    // this.visible = false;

    this.dotRadius = radius;

    viewUpdateJob.push({ job: "add", child: this });

    const hc = 40;
    const vc = 80;
    const pih = 100 / hc;
    const piv = 100 / vc;

    this.world = new Array(hc);
    for (let i = 0; i <= hc; i++) {
      this.world[i] = new Array(vc);
      for (let j = 0; j <= vc; j++) {
        this.world[i][j] = this.createDot(x(pih * i), y(piv * j));
      }
    }
  }

  private createDot(x: number, y: number) {
    const dot = new Circle(x, y, this.dotRadius, { color: "blue" });
    this.addChild(dot);
    return dot;
  }

  toggleHighlight(row: number, column: number) {
    const dot = this.world[row][column];
    const color = dot.color === "blue" ? "yellow" : "blue";
    dot.color = color;
  }
}
