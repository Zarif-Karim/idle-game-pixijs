import { Container, Graphics, Point, Text } from "pixi.js";
import { Status } from "../status";
import { Station } from "./stations";
import { EDGES, x as sX } from "../../globals";
import { Button } from "@pixi/ui";
import { ICONS } from "../utils";

export class StationDetails extends Container {
  private levelText?: Status;
  private upgradePriceText?: Status;
  private upgradePriceTextDisabled?: Status;
  private productPriceText?: Status;

  private bgBoard?: Graphics;
  private bgAnchor?: Graphics;

  private upgradeButton?: Button;
  private buttonViewEnabled?: Graphics;
  private buttonViewDisabled?: Graphics;

  // TODO: add expanding animation
  constructor(
    x: number,
    y: number,
    level: number,
    upgradePrice: number,
    productPrice: number,
    upgradeFn: () => void,
  ) {
    super({ x, y });
    this.createBackground();
    this.fillInfo(level, upgradePrice, productPrice);
    this.addUpgradeButton(upgradeFn, upgradePrice);
    // this is an info panel, should be above everything in the ingame screen
    this.zIndex = 100;
  }

  setUpgradable(flag: boolean) {
    if (!this.upgradeButton) throw new Error("Upgrade button is not defined!");

    this.upgradeButton.enabled = flag;
    this.upgradeButton.view.visible = flag;
  }

  private addUpgradeButton(upgradeFn: () => void, upgradePrice: number) {
    const fontSize = Station.SIZE * 0.35;
    const bgp = this.getBgPosition();
    const color = "green";
    const radius = 5;
    const w = bgp.w * 0.75;
    let x = bgp.x + bgp.w / 2 - w / 2;
    let y = bgp.y + bgp.h * 0.65;
    this.buttonViewEnabled = new Graphics().roundRect(
      x,
      y,
      w,
      bgp.h * 0.2,
      radius,
    ).fill({ color });

    this.upgradePriceText = new Status(`${upgradePrice}`, {
      x: x + this.buttonViewEnabled.width / 2,
      y: y + this.buttonViewEnabled.height / 2,
      prefix: ICONS.MONEYSACK + " ",
      fontSize,
      fill: "white",
    });

    this.buttonViewDisabled = new Graphics().roundRect(
      x,
      y,
      w,
      bgp.h * 0.2,
      radius,
    ).fill({ color: "grey" });
    this.buttonViewDisabled.eventMode = "none";
    this.upgradePriceTextDisabled = new Status(`${upgradePrice}`, {
      x: x + this.buttonViewEnabled.width / 2,
      y: y + this.buttonViewEnabled.height / 2,
      prefix: ICONS.MONEYSACK + " ",
      fontSize,
      fill: "white",
    });
    this.upgradePriceTextDisabled.text.eventMode = "none";

    this.buttonViewEnabled.addChild(this.upgradePriceText.text);
    this.buttonViewDisabled.addChild(this.upgradePriceTextDisabled.text);

    this.upgradeButton = new Button(this.buttonViewEnabled);

    this.upgradeButton.enabled = false;

    this.upgradeButton.onPress.connect(upgradeFn);
    this.upgradeButton.onDown.connect(() => {
      this.upgradeButton!.view.scale = 0.98;
    });
    this.upgradeButton.onUp.connect(() => {
      this.upgradeButton!.view.scale = 1;
    });
    this.addChild(this.buttonViewDisabled);
    this.addChild(this.upgradeButton.view);
  }

  private fillInfo(level: number, productPrice: number) {
    const fontSize = Station.SIZE * 0.35;
    const bgp = this.getBgPosition();

    this.levelText = new Status(`${level}`, {
      x: bgp.x + bgp.w / 2,
      y: bgp.y + bgp.h * 0.15,
      prefix: "Level ",
      fontSize,
      fill: "black",
    });

    this.productPriceText = new Status(`${productPrice}`, {
      x: bgp.x + bgp.w / 2,
      y: bgp.y + bgp.h * 0.55,
      prefix: "Sells: ",
      fontSize,
      fill: "black",
    });
    this.addChild(this.levelText.text);
    this.addChild(this.productPriceText.text);
  }

  private createBackground() {
    const ss = Station.SIZE;
    const color = "BlanchedAlmond";
    const bgp = this.getBgPosition();
    this.bgBoard = new Graphics().roundRect(bgp.x, bgp.y, bgp.w, bgp.h).fill({
      color,
    });
    this.bgBoard.eventMode = "passive";

    this.bgAnchor = new Graphics().star(
      ss / 2,
      -ss / 2,
      3,
      ss / 2,
      ss / 4,
      Math.PI,
    ).fill({
      color,
    });
    this.bgAnchor.eventMode = "none";

    this.addChild(this.bgAnchor, this.bgBoard);
  }

  private getBgPosition() {
    const ss = Station.SIZE;
    const w = ss * 4;
    const h = ss * 3;
    let x = ss / 2 - w / 2;
    if (this.x + x < EDGES.left) {
      const localCoord = this.toLocal(new Point(sX(3), 0));
      x = localCoord.x;
    }
    if (this.x + x + w > EDGES.width) {
      const localCoord = this.toLocal(new Point(sX(97), 0));
      x = localCoord.x - w;
    }
    let y = -h - ss / 2;

    return { x, y, w, h };
  }

  update(level: number, productPrice: number, upgradePrice: number) {
    this.updateLevel(level);
    this.updateProductPrice(productPrice);
    this.updateUpgradePrice(upgradePrice);
  }

  updateLevel(level: number) {
    this.levelText?.update(level.toString());
  }

  updateProductPrice(price: number) {
    this.productPriceText?.update(price.toString());
  }

  updateUpgradePrice(price: number) {
    this.upgradePriceText?.update(price.toString());
    this.upgradePriceTextDisabled?.update(price.toString());
  }
}
