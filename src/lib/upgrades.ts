import { ScrollBox } from "@pixi/ui";
import { BigNumber } from "./idle-bignum";
import { EDGES, x, y } from "../globals";

export class Upgrade<T> {
  public element: T;
  public type: string;
  public price: BigNumber;
  public quantity: number;

  constructor(element: T, price: BigNumber, quantity: number, type: string) {
    this.element = element;
    this.type = type;
    this.price = price;
    this.quantity = quantity;
  }
}

export class UpgradeModerator {
  public world: ScrollBox;

  constructor() {
    this.world = new ScrollBox({
      width: x(75),
      height: y(60),
      background: "lightyellow",
      type: "vertical",
      radius: x(5),
    });

    this.world.x = EDGES.width / 2 - this.world.width / 2;
    this.world.y = EDGES.height / 2 - this.world.height / 2;
    this.world.zIndex = 10;
    this.world.visible = false;
  }

  show() {
    this.world.visible = true;
  }

  hide() {
    this.world.visible = false;
  }

  toggleVisibility() {
    this.world.visible = !this.world.visible;
  }
}
