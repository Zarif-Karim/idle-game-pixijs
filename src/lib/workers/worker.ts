import { Application, Color, Point, Text } from "pixi.js";
import {
  backStations,
  deliveryLocations,
  EDGES,
  jobsFrontDelivery,
  jobsFrontTakeOrder,
  SPEED,
  workersBack,
  x,
} from "../../globals";
import { Circle } from "../circle";
import { Product } from "../product";
import { BackStation, DockPoint, FrontStation, Station } from "../stations";
import { generateRandomColorHex, getRandomInt } from "../utils";
import { RoundProgressBar } from "../progress-bar";

type WorkerOptions = {
  size?: number;
  color?: Color | string;
};

export class Worker extends Circle {
  static identifier = 0;
  static defaultSize = x(8);
  public readonly id: number;

  public hold: Product | null = null;
  public progressBar: RoundProgressBar;

  private makeOrderTime = 1_000; // 1 second
  public orderQuantityRemaining = -1;
  public choosenProductType = -1;
  private quantityView: Text;

  constructor(x: number, y: number, options?: WorkerOptions) {
    const size = options?.size || Worker.defaultSize;
    const color = options?.color || generateRandomColorHex();

    super(x, y, size, { color });

    Worker.identifier += 1;
    this.id = Worker.identifier;

    this.progressBar = new RoundProgressBar(size, -size, size / 2);
    this.progressBar.reset();
    this.addChild(this.progressBar);

    this.quantityView = new Text({
      anchor: 1.5,
      text: this.orderQuantityRemaining,
      style: {
        fill: "white",
        fontWeight: "bold",
        fontSize: "40em",
        padding: 5,
      },
    });
    this.quantityView.visible = false;
    this.addChild(this.quantityView);
  }

  chooseProduct(type: number) {
    this.choosenProductType = type;
  }

  isProductChoosen() {
    return (this.choosenProductType !== -1);
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
    this.hold.scale = 1;

    if (this.isProductChoosen()) {
      this.quantityView.text = this.orderQuantityRemaining;
      this.quantityView.visible = true;
    }
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

  makeProduct(s: BackStation) {
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
      if (!this.isProductChoosen()) {
        throw new Error("product type not choosen yet but making order");
      }

      this.orderQuantityRemaining = getRandomInt(1, 3);
      orders = Array(this.orderQuantityRemaining).fill(this.choosenProductType);

      // TODO: this is temp code to show which order customer wants
      // should later be changed to a pop up with image and number
      const p = this.makeProduct(backStations[this.choosenProductType]);
      this.takeProduct(p);
    }

    return { completion, orders };
  }

  recieveProduct(p: Product) {
    if (p.category === this.choosenProductType) {
      if (this.orderQuantityRemaining === 0) {
        throw new Error("Recieve called but quantity needed is zero");
      }
      this.orderQuantityRemaining -= 1;
      this.quantityView.text = this.orderQuantityRemaining;
      if (this.isOrderCompleted()) {
        this.quantityView.visible = false;
      }
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

export function doBackWork(
  w: Worker,
  { type, customer, at }: { type: number; customer: Worker; at: FrontStation },
  app: Application,
) {
  const context = { w, type, st: Date.now() };
  const st = backStations[type];
  const { workDuration: wd } = st;

  // get a slot from the back station and occupy it
  const slot = st.getSlot();
  if (!slot) {
    return false;
  }
  slot.occupy();

  let state = "station";
  let workStartTime = -1;
  let dt = 0;
  let dl: FrontStation;

  const work = ({ deltaTime }: { deltaTime: number }) => {
    const speed = SPEED * deltaTime;
    switch (state) {
      case "station":
        // go to the right station
        if (w.moveTo(slot.getDock(), speed)) {
          state = "work";
          workStartTime = Date.now();
        }
        break;

      case "work":
        dt = Date.now() - workStartTime;
        // wait for the required time
        if (dt >= wd) {
          state = "deliver";
          w.progressBar.reset();
          slot.vacate();

          // product pickup
          const product = w.makeProduct(st);
          w.takeProduct(product);

          // choose the delivery location
          dl = deliveryLocations[getRandomInt(0, deliveryLocations.length - 1)];
        } else {
          // update wait loading bar
          w.progressBar.update(dt / wd);
        }
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
  return true;
}

export function doCustomerWork(
  customer: Worker,
  st: FrontStation,
  createCustomer: Function,
  app: Application,
  state = "waitArea",
) {
  const context = { s: st, c: customer, st: Date.now() };
  state = "waitArea";

  const work = ({ deltaTime }: any) => {
    const speed = SPEED * deltaTime;
    switch (state) {
      case "waitArea":
        if (customer.moveTo(st.getDockingPoint(DockPoint.TOP), speed)) {
          // wait for atleast 1 station to be unlocked
          const availableStations = backStations.filter((s) => s.isUnlocked);
          if (availableStations.length === 0) {
            // console.log('customer: no available stations, waiting..');
            break;
          }

          // wait for order taking
          jobsFrontTakeOrder.push({ from: st, customer: customer });
          state = "wait";
        }
        break;
      case "wait":
        // NOTE:
        // the Front worker take order from customer.
        // this also needs to be updated to decouple the process
        // so back workers can also do that!

        // wait for order to be taken
        if (!customer.isProductChoosen()) {
          // this means the order has not been taken yet
          // wait for next tick
          return;
        }

        // the above check passed i.e order already taken
        // pick a product from the table if any delivered
        const rpt = customer.choosenProductType;
        if (st.has(rpt)) {
          const p = st.getProduct(rpt);
          customer.recieveProduct(p);
          app.stage.removeChild(p);
        }

        if (customer.isOrderCompleted()) {
          state = "leave";
        }
        break;
      case "leave":
        const exitPoint = new Point(EDGES.width + 100, 50);
        if (customer.moveTo(exitPoint, speed)) {
          state = "done";
        }
        break;
      case "done":
        app.ticker.remove(work, context);
        app.stage.removeChild(customer);
        createCustomer(app);
        break;
    }
  };

  app.ticker.add(work, context);
}
