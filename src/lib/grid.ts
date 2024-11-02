import { ColorSource, Container, Point } from "pixi.js";
import { viewUpdateJob, x, y } from "../globals";
import { Circle, CircleOptions } from "./circle";
import { assert } from "./utils";
import { AStarFinder } from "astar-typescript";

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
  static HORIZONTAL_CELL_COUNT = 9 * 5;
  static VERTICAL_CELL_COUNT = 16 * 5;

  private astarInstance?: AStarFinder;

  public readonly dotRadius: number;
  public world: Array<Array<Cell>>;
  // things that add or remove objects on the grid can utilise this to refresh the astar grid
  public needsUpdate = false;

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

    viewUpdateJob.push({ job: "add", child: this, obstruct: false });

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

  setupAStar() {
    this.astarInstance = new AStarFinder({
      grid: {
        matrix: this.world.map((arr) => {
          return arr.map((c) => (c.obstructed ? 1 : 0));
        }),
      },
      heuristic: "Manhatten",
    });
  }

  private createCell(x: number, y: number) {
    const dot = new Cell(x, y, this.dotRadius, { color: "blue" });
    this.addChild(dot);
    return dot;
  }

  // get the closest unobstructed cell from the obj
  getClosestUnobstractedCell(obj: Point) {
    const hp = 100 / Grid.HORIZONTAL_CELL_COUNT;
    const vp = 100 / Grid.VERTICAL_CELL_COUNT;

    const cxtp = (obj.x * 100) / x(100);
    const cytp = (obj.y * 100) / y(100);

    const lbx = Math.floor(cxtp / hp);
    const hbx = Math.ceil(cxtp / hp);
    const lby = Math.floor(cytp / vp);
    const hby = Math.ceil(cytp / vp);

    for (let x = lbx - 1; x <= hbx + 1; x++) {
      for (let y = lby - 1; y <= hby + 1; y++) {
        const fx = Math.min(Math.max(x, 0), Grid.HORIZONTAL_CELL_COUNT - 1);
        const fy = Math.min(Math.max(y, 0), Grid.VERTICAL_CELL_COUNT - 1);
        const cell = this.world[fx][fy];
        if (!cell.obstructed) {
          return cell;
        }
      }
    }

    assert(false, "No unobstructed cells found nearby");
  }

  obstructions(obj: Container, add = true) {
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
        const fx = Math.min(Math.max(x, 0), Grid.HORIZONTAL_CELL_COUNT - 1);
        const fy = Math.min(Math.max(y, 0), Grid.VERTICAL_CELL_COUNT - 1);
        this.world[fx][fy].markObstructed(add);
      }
    }
  }

  findPath(start: Point, end: Point) {
    if (!this.astarInstance || this.needsUpdate) this.setupAStar();

    assert(!!this.astarInstance, "AStar must be initiated");
    // astar library axis is flipped
    const path = this.astarInstance!.findPath(
      new Point(start.y, start.x),
      new Point(end.y, end.x),
    );
    assert(path.length !== 0, "No path found");
    path.forEach(([y, x]) => this.world[x][y].toggleHighlight());
  }
}
