import { Container, Graphics, Point } from "pixi.js";
import { Status } from "../status";
import { Station } from "./stations";
import { EDGES, x as sX } from "../../globals";
import { Button } from "@pixi/ui";
import { ICONS } from "../utils";
import { StraightProgressBar } from "../progress-bar";
import { BackStation } from "./back-station";
import { BigNumber } from "../idle-bignum";

export class StationDetails extends Container {
  private levelText?: Status;
  private upgradePriceText?: Status;
  private upgradePriceTextDisabled?: Status;
  private productPriceText?: Status;
  private durationText?: Status;

  private bgBoard?: Graphics;
  private bgAnchor?: Graphics;

  private upgradeButton?: Button;
  private buttonViewEnabled?: Graphics;
  private buttonViewDisabled?: Graphics;

  private levelProgress?: StraightProgressBar;

  // TODO: add expanding animation
  constructor(
    x: number,
    y: number,
    level: number,
    upgradePrice: BigNumber,
    productPrice: BigNumber,
    duration: number,
    upgradeFn: () => void,
  ) {
    super({ x, y });
    this.createBackground();
    this.fillInfo(level, productPrice, duration);
    this.addUpgradeButton(upgradeFn, upgradePrice);
    this.addProgressBar();
    // this is an info panel, should be above everything in the ingame screen
    this.zIndex = 100;
  }

  setUpgradable(flag: boolean) {
    if (!this.upgradeButton) throw new Error("Upgrade button is not defined!");

    this.upgradeButton.enabled = flag;
    this.upgradeButton.view.visible = flag;
  }

  private addProgressBar() {
    const b = this.getBgPosition();
    const w = b.w * 0.85;
    const h = b.h * 0.15;
    const x = b.x + b.w / 2 - w / 2;
    const y = b.y + b.h * 0.25;
    this.levelProgress = new StraightProgressBar(x, y, w, h, h * 0.3);
    this.addChild(this.levelProgress);
    this.levelProgress.visible = false;
  }

  private addUpgradeButton(upgradeFn: () => void, upgradePrice: BigNumber) {
    const fontSize = Station.SIZE * 0.35;
    const bgp = this.getBgPosition();
    const color = "green";
    const radius = 5;
    const w = bgp.w * 0.75;
    let x = bgp.x + bgp.w / 2 - w / 2;
    let y = bgp.y + bgp.h * 0.65;
    this.buttonViewEnabled = new Graphics()
      .roundRect(x, y, w, bgp.h * 0.2, radius)
      .fill({ color });

    this.upgradePriceText = new Status(`${upgradePrice}`, {
      x: x + this.buttonViewEnabled.width / 2,
      y: y + this.buttonViewEnabled.height / 2,
      prefix: ICONS.MONEYSACK + " ",
      fontSize,
      fill: "white",
    });

    this.buttonViewDisabled = new Graphics()
      .roundRect(x, y, w, bgp.h * 0.2, radius)
      .fill({ color: "grey" });
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

    // TODO: change this to Fancy Button
    this.upgradeButton = new Button(this.buttonViewEnabled);

    this.upgradeButton.enabled = false;

    let intervalId: any;
    let held = false;
    this.upgradeButton.onPress.connect(upgradeFn);
    this.upgradeButton.onDown.connect(() => {
      this.upgradeButton!.view.scale = 0.98;
      held = true;
      setTimeout(() => {
        if (held && !intervalId) {
          intervalId = setInterval(upgradeFn, 100);
        }
      }, 400);
    });
    this.upgradeButton.onUp.connect(() => {
      this.upgradeButton!.view.scale = 1;
      held = false;
      clearInterval(intervalId);
      intervalId = undefined;
    });
    this.addChild(this.buttonViewDisabled);
    this.addChild(this.upgradeButton.view);
  }

  private fillInfo(level: number, productPrice: BigNumber, duration: number) {
    const fontSize = Station.SIZE * 0.35;
    const bgp = this.getBgPosition();

    this.levelText = new Status(`${level}`, {
      x: bgp.x + bgp.w / 2,
      y: bgp.y + bgp.h * 0.15,
      prefix: "Level ",
      fontSize,
      fill: "black",
    });

    this.productPriceText = new Status(`${productPrice.toString(0)}`, {
      x: bgp.x + bgp.w * 0.7,
      y: bgp.y + bgp.h * 0.55,
      prefix: `${ICONS.MONEYSACK}`,
      fontSize,
      fill: "black",
    });

    duration /= 1000; // convert to seconds
    this.durationText = new Status(duration.toString() + "s", {
      x: bgp.x + bgp.w * 0.25,
      y: bgp.y + bgp.h * 0.55,
      prefix: `${ICONS.CLOCK} `,
      fontSize,
      fill: "black",
    });

    this.addChild(this.levelText.text);
    this.addChild(this.productPriceText.text);
    this.addChild(this.durationText.text);
  }

  private createBackground() {
    const ss = Station.SIZE;
    const color = "BlanchedAlmond";
    const bgp = this.getBgPosition();
    this.bgBoard = new Graphics().roundRect(bgp.x, bgp.y, bgp.w, bgp.h).fill({
      color,
    });
    this.bgBoard.eventMode = "passive";

    this.bgAnchor = new Graphics()
      .star(ss / 2, -ss / 2, 3, ss / 2, ss / 4, Math.PI)
      .fill({
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

  update(
    level: number,
    productPrice: BigNumber,
    upgradePrice: BigNumber,
    duration: number,
  ) {
    this.updateLevel(level);
    this.updateLevelProgressView(level);
    this.updateProductPrice(productPrice);
    this.updateUpgradePrice(upgradePrice);
    this.updateDuration(duration);
  }

  updateLevel(level: number) {
    this.levelText?.update(level.toString());
  }

  updateLevelProgressView(level: number) {
    // lower boundary value
    // start in the lowest bracket
    let lbv = 0;

    // upperBoundary of level range
    const ub = BackStation.DOUBLES_PRICE_AT.findIndex((v) => v > level);
    if (ub > 0) {
      lbv = BackStation.DOUBLES_PRICE_AT[ub - 1];
    }
    this.levelProgress!.visible = true;

    const range = BackStation.DOUBLES_PRICE_AT[ub] - lbv;
    const progress = level - lbv;
    if (progress < 0) throw new Error("Progress can't be below zero");

    this.levelProgress?.update(progress / range);
  }

  updateProductPrice(price: BigNumber) {
    this.productPriceText?.update(price.toString(1));
  }

  updateUpgradePrice(price: BigNumber) {
    this.upgradePriceText?.update(price.toString(1));
    this.upgradePriceTextDisabled?.update(price.toString(1));
  }

  updateDuration(duration: number) {
    const durationInSeconds = duration / 1000;
    this.durationText?.update(durationInSeconds.toString() + "s");
  }

  contains(point: Point) {
    if (
      this.bgBoard?.containsPoint(this.bgBoard.toLocal(point)) ||
      this.bgAnchor?.containsPoint(this.bgAnchor.toLocal(point))
    )
      return true;
    return false;
  }
}
