import { Color, Point, Text } from "pixi.js";
import {
  backStations,
  x,
} from "../../globals";
import { Circle } from "../circle";
import { Product } from "../product";
import { BackStation, FrontStation, Station } from "../stations";
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

