import { Application, Point } from "pixi.js";
import {
  backStations,
  deliveryLocations,
  jobsFront,
  SPEED,
  waitingArea,
  workersBack,
  workersFront,
  x,
} from "../globals";
import { Circle } from "./circle";
import { Product } from "./product";
import { DockPoint, Station } from "./stations";
import { generateRandomColorHex, getRandomInt } from "./utils";

export class Worker extends Circle {
  static identifier = 0;
  static defaultSize = x(6);
  public readonly id: number;

  public hold: Product | null = null;

  constructor(x: number, y: number, size?: number, color?: string) {
    super(x, y, size || Worker.defaultSize, {
      color: color || generateRandomColorHex(),
    });
    Worker.identifier += 1;
    this.id = Worker.identifier;
  }

  /**
   * Move to obj per tick at the given speed
   * @param obj the object to move towards
   * @param speed the speed at which to move per tick
   * @returns true if already reached object, false othewise
   */
  moveTo({ x, y }: Station | Product | Point, speed: number) {
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
    p.setPos(0, 0);
    this.addChild(this.hold);
  }

  leaveProduct(s: Station) {
    if (!this.hold) throw new Error("Leave Product called but no product held");

    this.removeChild(this.hold!);
    const c = s.centre;
    const p = this.hold;
    this.hold = null;

    p.setPos(c.x, c.y);

    return p;
  }

  makeProduct(s: Station) {
    return s.createProduct();
  }

  /**
   * @deprecated use Worker.moveTo(...) instead
   */
  isAt(object: Station | Product) {
    const stCentre = object.centre;

    // Calculate the distance between the objects
    const dx = this.x - stCentre.x;
    const dy = this.y - stCentre.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const radius = this.radius;
    const halfWidth = object.size / 2;

    // Check if the distance is less than or equal to the sum of the radii
    // Minus 10 as we want to have some overlap
    return distance <= radius + halfWidth - 10;
  }
}

export function doFrontWork(w: Worker, p: Product, app: Application) {
  const context = { w, p, st: Date.now() };
  let state = "pick";
  // pick a random station to deliver to for now
  // TODO: do delivery to right customer
  const st = waitingArea[getRandomInt(0, waitingArea.length - 1)];

  const work = ({ deltaTime }: { deltaTime: number }) => {
    const speed = SPEED * deltaTime;
    switch (state) {
      case "pick":
        if (w.moveTo(p, speed)) {
          // pick product
          app.stage.removeChild(p);
          w.takeProduct(p);
          state = "deliver";
        }
        break;
      case "deliver":
        if (w.moveTo(st.getDockingPoint(DockPoint.BOTTOM), speed)) {
          const _p = w.leaveProduct(st);
          app.stage.addChild(_p);
          state = "done";

          // TODO: customer take the product and leave
          // just a timeout for now
          setTimeout(() => {
            app.stage.removeChild(_p);
          }, 5_000);
        }
        break;
      case "done":
        // work done
        app.ticker.remove(work, context);
        // join back into queue
        workersFront.push(w);
        break;
      default:
        console.log("should never reach default");
        throw new Error("Work fell in default case!");
    }
  };

  app.ticker.add(work, context);
}

export function doBackWork(w: Worker, jn: number, app: Application) {
  const context = { w, jn, st: Date.now() };
  const st = backStations[jn];
  const { workDuration: wd } = st;

  let state = "station";
  let workStartTime = -1;
  let dt = 0;
  let dl: Station;

  const work = ({ deltaTime }: { deltaTime: number }) => {
    const speed = SPEED * deltaTime;
    switch (state) {
      case "station":
        // go to the right station
        if (w.moveTo(st.getDockingPoint(DockPoint.RIGHT), speed)) {
          state = "work";
          workStartTime = Date.now();
        }
        break;

      case "work":
        dt = Date.now() - workStartTime;
        // wait for the required time
        if (dt >= wd) {
          state = "deliver";
          // product pickup
          const product = w.makeProduct(st);
          w.takeProduct(product);

          // choose the delivery location
          dl = deliveryLocations[getRandomInt(0, deliveryLocations.length - 1)];
        } // else {
        // update wait loading bar
        // eg. loadbar(dt/wd);
        // }
        break;

      case "deliver":
        // deliver product
        if (w.moveTo(dl.getDockingPoint(DockPoint.BOTTOM), speed)) {
          // move product from hand to table
          const p = w.leaveProduct(dl);
          app.stage.addChild(p);

          // these products should be deliverd by FE workers
          jobsFront.push(p);
          state = "done";
        }
        break;
      case "done":
        // work done
        app.ticker.remove(work, context);
        // join back into queue
        workersBack.push(w);
        break;
      default:
        console.log("should never reach default");
        throw new Error("Work fell in default case!");
    }
  };

  app.ticker.add(work, context);
}
