import { Point } from "pixi.js";
import { x } from "../../globals";
import { Circle, CircleOptions } from "../circle";
import { Product } from "../product";
import { FrontStation, Station } from "../stations";
import { generateRandomColorHex } from "../utils";
import { RoundProgressBar } from "../progress-bar";
import { grid } from "../../app";

export type WorkerOptions = CircleOptions & {
  size?: number;
};

export class Worker extends Circle {
  static SPEED = x(0.6);
  static identifier = 0;
  static defaultSize = x(8);
  public readonly id: number;

  public hold: Product | null = null;
  public progressBar: RoundProgressBar;

  private travelPath: number[][] = [];
  private pathProgression = 0;

  constructor(x: number, y: number, options?: WorkerOptions) {
    const size = options?.size || Worker.defaultSize;
    const color = options?.color || generateRandomColorHex();

    super(x, y, size, { color });

    Worker.identifier += 1;
    this.id = Worker.identifier;

    this.progressBar = new RoundProgressBar(size, -size, size / 2);
    this.progressBar.reset();
    this.addChild(this.progressBar);
  }

  moveTo({ x, y }: Station | Product | Point, speed: number, state: string) {
    if (state === "start") {
      const { x: sx, y: sy } = grid.getClosestUnobstractedCell(
        new Point(this.x, this.y),
      )!;
      const { x: ex, y: ey } = grid.getClosestUnobstractedCell(
        new Point(x, y),
      )!;
      this.travelPath = grid.findPath(new Point(sx, sy), new Point(ex, ey));
      this.travelPath.push([x, y]);
      // intentionally skipping a few step to prevent the workers to move
      // in a jittery manner
      this.pathProgression = Math.min(3, this.travelPath.length - 1);
    }

    const [fx, fy] = this.travelPath[this.pathProgression];
    if (this._moveTo(new Point(fx, fy), speed)) {
      if (this.pathProgression === this.travelPath.length - 1) {
        return "done";
      }
      this.pathProgression = Math.min(
        this.pathProgression + 3,
        this.travelPath.length - 1,
      );
    }

    return "continue";
  }

  /**
   * Move to obj per tick at the given speed
   * @param obj the object to move towards
   * @param speed the speed at which to move per tick
   * @returns true if already reached object, false othewise
   */
  private _moveTo({ x, y }: Point, speed: number) {
    // Calculate the distance between the object and the target
    const dx = x - this.x;
    const dy = y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return true;

    // Calculate the normalized direction vector
    const directionX = dx / dist;
    const directionY = dy / dist;

    // Calculate the movement amount for this frame
    let moveX = directionX * speed;
    let moveY = directionY * speed;

    // Update the object's position
    if (Math.abs(moveX) > Math.abs(dx)) {
      this.x = x;
    } else {
      this.x += moveX;
    }
    if (Math.abs(moveY) > Math.abs(dy)) {
      this.y = y;
    } else {
      this.y += moveY;
    }

    if (Math.abs(x - this.x) === 0 && Math.abs(y - this.y) === 0) {
      return true;
    }
    return false;
  }

  takeProduct(p: Product) {
    this.hold = p;
    p.setPos(0, -this.radius);
    this.addChild(this.hold);
    this.hold.scale = 1;
  }

  leaveProduct(s: FrontStation) {
    if (!this.hold) throw new Error("Leave Product called but no product held");

    this.hold.scale = 0.5;
    this.removeChild(this.hold!);
    const p = this.hold;
    this.hold = null;

    s.putProduct(p);

    return p;
  }
}
