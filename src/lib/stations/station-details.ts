import { Container, Graphics, Point } from "pixi.js";
import { Status } from "../status";
import { Station } from "./stations";
import { EDGES, x as sX } from "../../globals";

export class StationDetails extends Container {
  private levelText: Status;
  private upgradePriceText: Status;
  private productPriceText: Status;

  private bgBoard: Graphics;
  private bgAnchor: Graphics;

  // TODO: add expanding animation
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

    const ss = Station.SIZE;
    const color = "BlanchedAlmond";
    const bgp = this.getBgPosition();
    this.bgBoard = new Graphics().roundRect(bgp.x, bgp.y, bgp.w, bgp.h).fill({
      color,
    });

    this.bgAnchor = new Graphics().star(ss/2, -ss/2, 3, ss/2, ss/4, Math.PI).fill({
      color,
    });

    this.addChild(this.bgAnchor, this.bgBoard);
    // this is an info panel, should be above everything in the ingame screen
    this.zIndex = 100;
  }

  private getBgPosition() {
    const ss = Station.SIZE;
    const w = ss * 4;
    const h = ss * 3;
    let x = ss/2 - w/2;
    if(this.x + x < EDGES.left) {
      const localCoord = this.toLocal(new Point(sX(3), 0));
      x = localCoord.x;
    }
    if(this.x + x + w > EDGES.width) {
      const localCoord = this.toLocal(new Point(sX(97), 0));
      x = localCoord.x - w;
    }
    let y = -h - ss/2;

    return { x, y, w, h};
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
