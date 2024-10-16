import { Color, Point, Text } from "pixi.js";
import { Circle } from "./circle";
import { x } from "../globals";
import { ICONS } from "./utils";
import { BigNumber } from "./idle-bignum";

export class Product extends Circle {
  public category: number;
  public readonly price: BigNumber;
  public priceView: Text;

  constructor(category: number, color: Color | string, price: BigNumber) {
    super(0, 0, x(3), { color });
    this.category = category;
    this.price = price;
    this.price.normalize();
    this.priceView = new Text({
      text: `${ICONS.MONEYSACK} ${this.price.toString(1)}`,
      anchor: 0.5,
      style: {
        fill: 'white',
        fontSize: x(6),
        fontWeight: 'bold',
        stroke: 'black',
      }
    });

    this.priceView.y = -this.radius*2;
    this.addChild(this.priceView);
  }

  setPos(x: number, y: number) {
    this.x = x;

    this.y = y;
  }

  get centre() {
    return new Point(this.x, this.y);
  }

  get size() {
    return this.radius * 2;
  }
}
