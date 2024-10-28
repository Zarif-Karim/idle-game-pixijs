import { Button, FancyButton, ScrollBox } from "@pixi/ui";
import { BigNumber } from "./idle-bignum";
import { StateData, x, y, status } from "../globals";
import { Application, Container, Graphics, Text } from "pixi.js";
import { BackStation, Station } from "./stations";
import { Worker } from "./workers";
import { Status } from "./status";
import { addNewWorker, assert, createCustomer, ICONS } from "./utils";
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

  makeUpgrade(app: Application, onLoad = false) {
    if (!onLoad) {
      StateData.bcoins.substract(this.price);
      status.update(`${ICONS.MONEYSACK} ${StateData.bcoins}`);
    }
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
        createCustomer(app, false);
        return;
      }

      // at this stage type should be in the form
      // worker-front, worker-back, worker-speed
      const [w, opp] = this.type.split("-");
      if (w !== "worker") throw new Error("Incorrect format");

      if (opp === "speed") {
        Worker.SPEED *= this.quantity;
        return;
      }

      if (["back", "front"].includes(opp)) {
        addNewWorker(app, opp, false);
      } else {
        throw new Error("Incorrect format");
      }
    }
  }
}

export class UpgradeRow<I> extends Graphics {
  public key: number;
  private upgradeButton: FancyButton;
  private upgradeItem: Upgrade<I>;

  constructor(
    id: number,
    w: number,
    h: number,
    item: Upgrade<I>,
    upgradeFn: () => void,
  ) {
    super();
    this.key = id;
    this.roundRect(0, 0, w, h, 8).fill("lightgrey");
    this.upgradeItem = item;

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

  // Sets the upgrade button state based on available coins
  // also returns the result
  refreshUpgradableStatus(wallet: BigNumber) {
    const ubn = BigNumber.from(this.upgradeItem.price);
    assert(!ubn.negative, "upgradePrice cannot be negative");

    ubn.substract(wallet);
    const canUpgrade = ubn.negative || ubn.isZero();

    this.upgradeButton.enabled = canUpgrade;
    return canUpgrade;
  }

  onLoadUpgrade(app: Application) {
    this.upgradeItem.makeUpgrade(app, true);
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
    const buttonViewDisabled = new Graphics()
      .roundRect(0, 0, w, h, radius)
      .fill({ color: "grey" });
    const upgradePriceText = new Status(`${upgradePrice}`, {
      prefix: ICONS.MONEYSACK + " ",
      fontSize,
      fill: "white",
    });

    const upgradeButton = new FancyButton({
      defaultView: buttonViewEnabled,
      disabledView: buttonViewDisabled,
      text: upgradePriceText.text,
    });

    upgradeButton.enabled = false;

    upgradeButton.onPress.connect(upgradeFn);
    upgradeButton.position.set(x, y);
    return upgradeButton;
  }
}

// TODO: also need to implement save
export class UpgradeModerator extends Container {
  private screenOverlayBg: Rectangle;
  public list: ScrollBox;
  private closeButton: Button;
  private upgradableMarker: Graphics;
  private upgradeButton?: Rectangle;

  constructor() {
    super();
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
      globalScroll: false,
    });

    this.list;
    this.list.x = x(50) - this.list.width / 2;
    this.list.y = y(50) - this.list.height / 2;

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

    this.screenOverlayBg = new Rectangle(0, 0, x(100), y(100), {
      color: "black",
      interactive: true,
    });
    this.screenOverlayBg.view.alpha = 0.5;
    this.screenOverlayBg.view.cursor = "default";
    this.screenOverlayBg.view.on("pointertap", this.hide.bind(this));

    this.upgradableMarker = new Graphics()
      .circle(0, 0, Station.SIZE * 0.25)
      .fill({ color: "red" });
    this.upgradableMarker.eventMode = "none";
    this.upgradableMarker.visible = false;

    this.addChild(this.screenOverlayBg.view, this.list);
    this.zIndex = 10;
    this.visible = false;
  }

  show() {
    this.visible = true;
  }

  hide() {
    this.visible = false;
  }

  toggleVisibility() {
    this.visible = !this.visible;
  }

  setup(upgradeButton: Rectangle, upgrades: Upgrade<any>[], app: Application) {
    this.upgradeButton = upgradeButton;
    this.upgradeButton.view.addChild(this.upgradableMarker);
    upgrades.forEach((value, key) => this.addItem(key, value, app));
  }

  onLoad(upgradeIndexes: number[], app: Application) {
    upgradeIndexes.forEach((id) => {
      const index = this.list.items.findIndex(
        (v) => (v as UpgradeRow<any>).key === id,
      );
      const upgradeRow = this.list.items[index] as UpgradeRow<any>;
      upgradeRow.onLoadUpgrade(app);
      this.removeUpgradeWithKey(id);
    });
  }

  setAvailableUpgradesMarker(value: boolean) {
    this.upgradableMarker.visible = value;
  }

  addItem<T>(id: number, item: Upgrade<T>, app: Application) {
    const w = this.list.width * 0.92;
    const h = this.list.height / 10;
    const upgradeFn = () => {
      item.makeUpgrade(app);
      StateData.upgrades.push(id);
      this.removeUpgradeWithKey(id);
    };

    const row = new UpgradeRow(id, w, h, item, upgradeFn.bind(this));
    this.list.addItem(row);
  }

  private removeUpgradeWithKey(id: number) {
    const index = this.list.items.findIndex(
      (v) => (v as UpgradeRow<any>).key === id,
    );
    this.list.removeItem(index);
  }
}
