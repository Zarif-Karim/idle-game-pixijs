import { Application, Point } from "pixi.js";
import {
  backStations,
  deliveryLocations,
  EDGES,
  FrontDelivery,
  FrontTakeOrder,
  jobsBack,
  jobsFrontDelivery,
  jobsFrontTakeOrder,
  SPEED,
  StageData,
  status,
  workersBack,
  workersFront,
  x,
} from "../globals";
import { Circle } from "./circle";
import { Product } from "./product";
import { DockPoint, Station } from "./stations";
import { generateRandomColorHex, getRandomInt } from "./utils";

type WorkerOptions = {
  size?: number;
  color?: string;
};

export class Worker extends Circle {
  static identifier = 0;
  static defaultSize = x(6);
  public readonly id: number;

  public hold: Product | null = null;

  // customer specific TODO: make new class for customers
  private makeOrderTime = 500; // 500 ms
  public orderQuantityRemaining = 1;
  public requiredProductType = -1;

  constructor(x: number, y: number, options?: WorkerOptions) {
    super(x, y, options?.size || Worker.defaultSize, {
      color: options?.color || generateRandomColorHex(),
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

  // TODO: customer specific method, move to its own class
  makeOrder(startTime: number) {
    const dt = Date.now() - startTime;
    let completion = dt / this.makeOrderTime;
    completion = completion > 1 ? 1 : completion;
    let orders: number[] = [];

    if (completion === 1) {
      const productType = getRandomInt(0, backStations.length - 1);
      this.requiredProductType = productType;
      const quantity = getRandomInt(1, 3);

      this.orderQuantityRemaining = quantity;
      orders = Array(quantity).fill(productType);

      // TODO: this is temp code to show which order customer wants
      // should later be changed to a pop up with image and number
      const p = this.makeProduct(backStations[productType]);
      this.takeProduct(p);
    }

    return { completion, orders };
  }

  recieveProduct(p: Product) {
    if (p.category === this.requiredProductType) {
      if (this.orderQuantityRemaining === 0) {
        throw new Error("Recieve called but quantity needed is zero");
      }
      this.orderQuantityRemaining -= 1;
    } else {
      throw new Error("Recieve called with type mismatch");
    }
  }

  isOrderCompleted() {
    if (this.orderQuantityRemaining !== 0) {
      return false;
    }

    if (!this.hold) throw new Error("OrderComplete true but no product held");
    this.removeChild(this.hold);
    return true;
  }
}

export function doFrontWork(
  w: Worker,
  job: FrontTakeOrder | FrontDelivery,
  app: Application,
) {
  const context = { w, job, st: Date.now() };
  const jobType = "product" in job ? "FD" : "FTO";
  let state = jobType === "FD" ? "pick" : "customer";
  const jobFD = job as FrontDelivery;
  const jobFTO = job as FrontTakeOrder;

  let takeOrderStartTime: number;

  const work = ({ deltaTime }: { deltaTime: number }) => {
    const speed = SPEED * deltaTime;
    switch (state) {
      case "pick":
        if (w.moveTo(jobFD.from.getDockingPoint(DockPoint.TOP), speed)) {
          // pick product
          app.stage.removeChild(jobFD.product);
          w.takeProduct(jobFD.product);
          state = "deliver";
        }
        break;
      case "deliver":
        if (w.moveTo(jobFD.to.getDockingPoint(DockPoint.BOTTOM), speed)) {
          const p = w.leaveProduct(jobFD.to);
          app.stage.addChild(p);
          jobFD.customer.recieveProduct(p);
          app.stage.removeChild(p);

          StageData.coins += p.price;
          status.update(`Coins: ${StageData.coins}`);

          state = "done";
        }
        break;

      case "customer":
        if (w.moveTo(jobFTO.from.getDockingPoint(DockPoint.BOTTOM), speed)) {
          // Take Order
          state = "takeOrder";
          takeOrderStartTime = Date.now();
        }
        break;
      case "takeOrder":
        const progress = jobFTO.customer.makeOrder(takeOrderStartTime);
        if (progress.completion === 1) {
          progress.orders.forEach((o) => {
            jobsBack.push({
              type: o,
              customer: jobFTO.customer,
              at: jobFTO.from,
            });
          });
          state = "done";
        } else {
          // update progress bar
        }

        break;
      case "done":
        // work done
        app.ticker.remove(work, context);
        // join back into queue
        workersFront.push(w);
        break;
      default:
        throw new Error("Work fell in default case!");
    }
  };

  app.ticker.add(work, context);
}

export function doBackWork(
  w: Worker,
  { type, customer, at }: { type: number; customer: Worker; at: Station },
  app: Application,
) {
  const context = { w, type, st: Date.now() };
  const st = backStations[type];
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
          jobsFrontDelivery.push({ from: dl, to: at, product: p, customer });
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
        throw new Error("Work fell in default case!");
    }
  };

  app.ticker.add(work, context);
}

export function doCustomerWork(
  c: Worker,
  st: Station,
  createCustomer: Function,
  app: Application,
  state = "waitArea",
) {
  const context = { s: st, c, st: Date.now() };
  state = "waitArea";

  const work = ({ deltaTime }: any) => {
    const speed = SPEED * deltaTime;
    switch (state) {
      case "waitArea":
        if (c.moveTo(st.getDockingPoint(DockPoint.TOP), speed)) {
          // wait for order taking
          jobsFrontTakeOrder.push({ from: st, customer: c });
          state = "wait";
        }
        break;
      case "wait":
        if (c.isOrderCompleted()) {
          state = "leave";
        }
        break;
      case "leave":
        const exitPoint = new Point(EDGES.width + 100, 50);
        if (c.moveTo(exitPoint, speed)) {
          state = "done";
        }
        break;
      case "done":
        app.ticker.remove(work, context);
        app.stage.removeChild(c);
        createCustomer(app);
        break;
    }
  };

  app.ticker.add(work, context);
}
