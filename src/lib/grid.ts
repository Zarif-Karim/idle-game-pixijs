import { ColorSource, Container } from "pixi.js";
import { viewUpdateJob, x, y } from "../globals";
import { Circle, CircleOptions } from "./circle";
import { assert } from "./utils";

type CellOptions = CircleOptions & {
  obstructed?: boolean;
  neighbours?: Array<Cell>;
};

class Cell extends Circle {
  static NORMAL_COLOR: ColorSource = "blue";
  static HIGHLIGHT_COLOR: ColorSource = "yellow";

  public obstructed: boolean;
  public neighbours: Array<Cell>;
  public highlighted: boolean;

  constructor(x: number, y: number, radius: number, options: CellOptions) {
    super(x, y, radius, { color: options.color });
    this.obstructed = options?.obstructed || false;
    this.neighbours = options?.neighbours || [];
    this.highlighted = false;
  }

  toggleHighlight() {
    assert(
      this.color !== "red",
      "Attempting to toggle highlight when cell is obstructed",
    );
    this.highlighted = !this.highlighted;
    this.color = this.highlighted ? Cell.HIGHLIGHT_COLOR : Cell.NORMAL_COLOR;
  }

  markObstructed(value: boolean) {
    this.obstructed = value;
    if (value === true) {
      // TODO: toggleHighlight will not work with this anymore
      this.color = "red";
    } else {
      this.color = this.highlighted ? Cell.HIGHLIGHT_COLOR : Cell.NORMAL_COLOR;
    }
  }
}

export class Grid extends Container {
  static HORIZONTAL_CELL_COUNT = 40;
  static VERTICAL_CELL_COUNT = 80;

  public readonly dotRadius: number;
  public world: Array<Array<Cell>>;

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

    const pih = 100 / Grid.HORIZONTAL_CELL_COUNT;
    const piv = 100 / Grid.VERTICAL_CELL_COUNT;

    this.world = new Array(Grid.HORIZONTAL_CELL_COUNT);

    for (let i = 0; i <= Grid.HORIZONTAL_CELL_COUNT; i++) {
      this.world[i] = new Array(Grid.VERTICAL_CELL_COUNT);

      for (let j = 0; j <= Grid.VERTICAL_CELL_COUNT; j++) {
        this.world[i][j] = this.createCell(x(pih * i), y(piv * j));
      }
    }
  }

  private createCell(x: number, y: number) {
    const dot = new Cell(x, y, this.dotRadius, { color: "blue" });
    this.addChild(dot);
    return dot;
  }

  addObstructions(obj: Container) {
    const hp = 100 / Grid.HORIZONTAL_CELL_COUNT;
    const vp = 100 / Grid.VERTICAL_CELL_COUNT;

    const cxtp = (obj.x * 100) / x(100);
    const cytp = (obj.y * 100) / y(100);
    const cwtp = ((obj.x + obj.width) * 100) / x(100);
    const chtp = ((obj.y + obj.height) * 100) / y(100);

    const lbx = Math.floor(cxtp / hp);
    const hbx = Math.ceil(cwtp / hp);
    const lby = Math.floor(cytp / vp);
    const hby = Math.ceil(chtp / vp);

    for (let x = lbx; x <= hbx; x++) {
      for (let y = lby; y <= hby; y++) {
        this.world[x][y].toggleHighlight();
      }
    }
  }
}
