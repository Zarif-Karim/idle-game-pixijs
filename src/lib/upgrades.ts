import { Button, FancyButton, ScrollBox } from "@pixi/ui";
import { BigNumber } from "./idle-bignum";
import { EDGES, x, y } from "../globals";
import { Graphics, Text } from "pixi.js";
import { Station } from "./stations";
import { Worker } from "./workers";
import { Status } from "./status";
import { ICONS } from "./utils";
import { Rectangle } from "./rectangle";

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
  public list: ScrollBox;
  private closeButton: Button;

  constructor() {
    this.list = new ScrollBox({
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

    this.list;
    this.list.x = EDGES.width / 2 - this.list.width / 2;
    this.list.y = EDGES.height / 2 - this.list.height / 2;
    this.list.zIndex = 10;

    // TODO: change to false, set to true while developing
    this.list.visible = true;

    this.closeButton = new Button(
      new Text({ text: "X", style: { fill: "darkgrey", fontSize: x(5) } }),
    );

    this.closeButton.view.position.set(x(70.8), y(1.2));
    this.closeButton.view.scale = 0.6;
    this.closeButton.onPress.connect(() => this.hide());

    const title = new Text({
      text: "UPGRADES",
      style: { fontSize: x(6), fontWeight: "bolder" },
    });

    title.position.set(x(20), y(3));
    const titleBg = new Graphics()
      .roundRect(0, 0, x(75), y(9), x(5))
      .fill("lightyellow");
    title.eventMode = "none";
    titleBg.eventMode = "none";
    this.list.addChild(titleBg, this.closeButton.view, title);
  }

  show() {
    this.list.visible = true;
  }

  hide() {
    this.list.visible = false;
  }

  toggleVisibility() {
    this.list.visible = !this.list.visible;
  }

  addItem<T>(item: Upgrade<T>) {
    const w = this.list.width * 0.92;
    const h = this.list.height / 10;
    const view = new Graphics().roundRect(0, 0, w, h, 8).fill("lightgrey");

    const upgradeButton = this.addUpgradeButton(
      {
        x: x(47),
        y: y(0.5),
        w: x(20),
        h: y(5),
        radius: 5,
        upgradePrice: item.price,
        color: "green",
        fontSize: x(3),
      },
      () => {
        console.log("clicked", item);
      },
    );

    view.addChild(upgradeButton);
    if (item.element instanceof Station) {
      const logo = new Rectangle(x(2), y(1), y(4), y(4), {
        color: item.element.color,
      });
      logo.view.eventMode = "none";
      view.addChild(logo.view);
    }
    if (item.element instanceof Worker) {
      const logo = new Worker(x(5.5), y(3), {
        color: item.element.color,
      });
      logo.eventMode = "none";
      view.addChild(logo);
    }
    this.list.addItem(view);
  }

  addItems(items: Upgrade<any>[]) {
    items.forEach((i) => this.addItem(i));
  }

  private addUpgradeButton(
    {
      x,
      y,
      w,
      h,
      radius = 5,
      upgradePrice,
      fontSize,
      color,
    }: {
      x: number;
      y: number;
      w: number;
      h: number;
      radius: number;
      upgradePrice: BigNumber;
      fontSize: number;
      color: string;
    },
    upgradeFn: () => void,
  ) {
    const buttonViewEnabled = new Graphics()
      .roundRect(0, 0, w, h, radius)
      .fill({ color });
    const upgradePriceText = new Status(`${upgradePrice}`, {
      prefix: ICONS.MONEYSACK + " ",
      fontSize,
      fill: "white",
    });

    const upgradeButton = new FancyButton({
      defaultView: buttonViewEnabled,
      text: upgradePriceText.text,
    });

    upgradeButton.enabled = true;

    upgradeButton.onPress.connect(upgradeFn);
    upgradeButton.position.set(x, y);
    return upgradeButton;
  }
}
