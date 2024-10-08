import { Container } from "pixi.js";
import { Status } from "../status";
import { Station } from "./stations";

export class StationDetails extends Container {
  private levelText: Status;
  public upgradePriceText: Status;
  public productPriceText: Status;

  constructor(
    x: number,
    y: number,
    level: number,
    upgradePrice: number,
    productPrice: number,
  ) {
    super({ x, y });
    const fontSize = Station.SIZE * 0.45;
    this.levelText = new Status(`${level}`, { fontSize });
    this.upgradePriceText = new Status(`${upgradePrice}`, {
      x: Station.SIZE,
      prefix: " U: ",
      fontSize,
    });
    this.productPriceText = new Status(`${productPrice}`, {
      x: Station.SIZE,
      y: Station.SIZE * 0.5,
      prefix: " P: ",
      fontSize,
    });

    this.addChild(this.levelText.text);
    this.addChild(this.upgradePriceText.text);
    this.addChild(this.productPriceText.text);
  }

  update(level: number, productPrice: number, upgradePrice: number) {
    this.updateLevel(level);
    this.updateProductPrice(productPrice);
    this.updateUpgradePrice(upgradePrice);
  }

  updateLevel(level: number) {
    this.levelText.update(level.toString());
  }

  updateProductPrice(price: number) {
    this.productPriceText.update(price.toString());
  }

  updateUpgradePrice(price: number) {
    this.upgradePriceText.update(price.toString());
  }
}
