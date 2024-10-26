import { Button, FancyButton, ScrollBox } from "@pixi/ui";
import { BigNumber } from "./idle-bignum";
import { x, y } from "../globals";
import { Application, Graphics, Text } from "pixi.js";
import { BackStation, Station } from "./stations";
import { Worker } from "./workers";
import { Status } from "./status";
import { addNewWorker, createCustomer, ICONS } from "./utils";
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

  makeUpgrade(app: Application) {
    const isStationUpgrade = this.element instanceof Station;
    if (isStationUpgrade) {
      const backStation = this.element as BackStation;
      if (this.type === "speed") {
        backStation.workDuration /= this.quantity;
      } else {
        backStation.productPrice.multiply(this.quantity);
      }
      backStation.updateInfo();
    } else {
      if (this.type === "customer") {
        createCustomer(app, true);
        return;
      }

      // at this stage type should be in the form
      // worker-front, worker-back, worker-speed
      const [w, opp] = this.type.split("-");
      if (w !== "worker") throw new Error("Incorrect format");

      if (opp === "speed") {
        // TODO: increase worker speed by 10%
        console.log("worker speed wip");
        return;
      }

      if (["back", "front"].includes(opp)) {
        addNewWorker(app, opp, true);
      } else {
        throw new Error("Incorrect format");
      }
    }
  }
}

export class UpgradeRow extends Graphics {
  private upgradeButton: FancyButton;

  constructor(w: number, h: number, item: Upgrade<any>, upgradeFn: () => void) {
    super();
    this.roundRect(0, 0, w, h, 8).fill("lightgrey");

    let symbol = "";
    if (item.element instanceof Station) {
      symbol = "x";
      const logo = new Rectangle(x(2), y(1), y(4), y(4), {
        color: item.element.color,
      });
      logo.view.eventMode = "none";
      this.addChild(logo.view);
    }
    if (item.element instanceof Worker) {
      symbol = item.type.includes("speed") ? "x" : "+";
      const logo = new Worker(x(5.5), y(3), {
        color: item.element.color,
      });
      logo.eventMode = "none";
      this.addChild(logo);
    }

    const title = new Text({ text: "untitled", style: { fontSize: x(4) } });
    title.position.set(x(15), y(2));
    title.scale = 0.7;
    title.text = `${symbol}${item.quantity}  ${item.type}`;
    this.addChild(title);

    this.upgradeButton = this.addUpgradeButton(
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
      upgradeFn,
    );
    this.addChild(this.upgradeButton);
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

export class UpgradeModerator {
  public list: ScrollBox;
  private closeButton: Button;
  public upgradeList: Upgrade<any>[] = [];

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
      disableEasing: true,
    });

    this.list;
    this.list.x = x(50) - this.list.width / 2;
    this.list.y = y(50) - this.list.height / 2;
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

  load(upgrades: Upgrade<any>[], app: Application) {
    this.upgradeList = upgrades;
    upgrades.forEach((i) => this.addItem(i, app));
  }

  addItem<T>(item: Upgrade<T>, app: Application) {
    const w = this.list.width * 0.92;
    const h = this.list.height / 10;
    const upgradeFn = () => {
      item.makeUpgrade(app);
      const index = this.upgradeList.findIndex((value) => value === item);
      if (index === -1) throw new Error("Upgrade Item not on List");
      this.upgradeList = this.upgradeList.filter((value) => value !== item);
      this.list.removeItem(index);
    };
    const row = new UpgradeRow(w, h, item, upgradeFn.bind(this));
    this.list.addItem(row);
  }
}
