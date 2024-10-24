import { Button, ScrollBox } from "@pixi/ui";
import { BigNumber } from "./idle-bignum";
import { EDGES, x, y } from "../globals";
import { Graphics, Text } from "pixi.js";

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
  private closeButton: Button;

  constructor() {
    this.world = new ScrollBox({
      width: x(75),
      height: y(60),
      background: "lightyellow",
      type: "vertical",
      radius: x(5),
      topPadding: y(10),
      bottomPadding: y(2),
      leftPadding: x(3),
      elementsMargin: y(0.5),
    });

    this.world;
    this.world.x = EDGES.width / 2 - this.world.width / 2;
    this.world.y = EDGES.height / 2 - this.world.height / 2;
    this.world.zIndex = 10;

    // TODO: change to false, set to true while developing
    this.world.visible = true;

    this.closeButton = new Button(
      new Text({ text: "X", style: { fill: "darkgrey", fontSize: x(5) } }),
    );
    this.closeButton.view.position.set(x(70.8), y(1.2));
    this.closeButton.view.scale = 0.6;
    this.closeButton.onPress.connect(() => this.hide());
    this.world.addChild(this.closeButton.view);
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

  addItem<T>(_item: Upgrade<T>) {
    const w = this.world.width * 0.92;
    const h = this.world.height / 10;
    const view = new Graphics().roundRect(0, 0, w, h, 8).fill("lightgrey");
    this.world.addItem(view);
  }

  addItems(items: Upgrade<any>[]) {
    items.forEach((i) => this.addItem(i));
  }
}
