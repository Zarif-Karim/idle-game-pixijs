import { ColorSource, Container, Point } from "pixi.js";
import { viewUpdateJob, x, y } from "../globals";
import { Circle, CircleOptions } from "./circle";
import { assert } from "./utils";
import { AStarFinder } from "astar-typescript";
import { Queue } from "./queue";

type CellOptions = CircleOptions & {
  obstructed?: boolean;
  neighbours?: Array<Cell>;
};

class Cell extends Circle {
  static NORMAL_COLOR: ColorSource = "blue";
  static HIGHLIGHT_COLOR: ColorSource = "yellow";

  public obstructed: boolean;
  public highlighted: boolean;

  private world_x: number;
  private world_y: number;

  constructor(
    x: number,
    y: number,
    radius: number,
    wx: number,
    wy: number,
    options: CellOptions,
  ) {
    super(x, y, radius, { color: options.color });
    this.world_x = wx;
    this.world_y = wy;
    this.obstructed = options?.obstructed || false;
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

  get wx() {
    return this.world_x;
  }

  get wy() {
    return this.world_y;
  }
}

const DOTS = 10;
export class Grid extends Container {
  static HORIZONTAL_CELL_COUNT = 9 * DOTS;
  static VERTICAL_CELL_COUNT = 16 * DOTS;
  private debug: boolean;

  private astarInstance?: AStarFinder;

  public readonly dotRadius: number;
  public world: Array<Array<Cell>>;
  // things that add or remove objects on the grid can utilise this to refresh the astar grid
  public needsUpdate = false;

  constructor(radius = x(0.5), debug = false) {
    super({
      x: 0,
      y: 0,
      width: x(100),
      height: y(100),
      tint: "lightgreen",
      zIndex: 1,
    });
    this.eventMode = "none";
    // only enable for debugging
    // this is a very resource intensive class when displayed
    // meant to only be desplayed for debugging
    this.debug = debug;
    this.visible = this.debug;

    this.dotRadius = radius;

    viewUpdateJob.push({ job: "add", child: this, obstruct: false });

    const pih = 100 / Grid.HORIZONTAL_CELL_COUNT;
    const piv = 100 / Grid.VERTICAL_CELL_COUNT;

    this.world = new Array(Grid.HORIZONTAL_CELL_COUNT);

    for (let i = 0; i <= Grid.HORIZONTAL_CELL_COUNT; i++) {
      this.world[i] = new Array(Grid.VERTICAL_CELL_COUNT);

      for (let j = 0; j <= Grid.VERTICAL_CELL_COUNT; j++) {
        this.world[i][j] = this.createCell(x(pih * i), y(piv * j), i, j);
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

  private createCell(x: number, y: number, wx: number, wy: number) {
    const dot = new Cell(x, y, this.dotRadius, wx, wy, { color: "blue" });
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
    const lby = Math.floor(cytp / vp);

    const fx = Math.min(Math.max(lbx, 0), Grid.HORIZONTAL_CELL_COUNT - 1);
    const fy = Math.min(Math.max(lby, 0), Grid.VERTICAL_CELL_COUNT - 1);

    const closest = this.bfs(this.world[fx][fy]);
    if (this.debug) closest?.toggleHighlight();
    return new Point(closest?.wx, closest?.wy);
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
        this.world[x][y].markObstructed(add);
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
    return path.map(([y, x]) => {
      const cell = this.world[x][y];
      return [cell.x, cell.y];
    });
  }

  private getAdjacentNodes(node: Cell) {
    const x = node.wx;
    const y = node.wy;

    const neighbours: Cell[] = [];
    for (let i = -1; i <= 1; ++i) {
      for (let j = -1; j <= 1; ++j) {
        const dx = x + i;
        const dy = y + j;

        if (
          dx > 0 &&
          dx < this.world.length - 1 &&
          dy > 0 &&
          dy < this.world[0].length - 1 &&
          !(j === 0 && i === j)
        ) {
          neighbours.push(this.world[dx][dy]);
        }
      }
    }

    return neighbours;
  }

  /**
   * breadth-first search traversal of a node
   * @returns void
   */

  private bfs(startNode: Cell) {
    if (!startNode) {
      return;
    }
    const visited: Set<Cell> = new Set();
    const queue: Queue<Cell> = new Queue();
    let current: Cell | undefined = undefined;

    queue.push(startNode);

    while (!queue.isEmpty) {
      current = queue.pop();
      if (!current) {
        break;
      }
      if (!current.obstructed) return current;

      visited.add(current);
      this.getAdjacentNodes(current).forEach((node) => {
        // if the node has not been visited
        if (!visited.has(node)) {
          visited.add(node);
          queue.push(node);
        }
      });
    }
    assert(false, "No unobstructed cells found nearby");
  }
}
