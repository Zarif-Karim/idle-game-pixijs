import { Color, Point, Text } from "pixi.js";
import { Circle } from "./circle";
import { x } from "../globals";

export class Product extends Circle {
  public category: number;
  public readonly price: number;
  public priceView: Text;

  constructor(category: number, color: Color | string, price: number) {
    super(0, 0, x(3), { color });
    this.category = category;
    this.price = price;
    this.priceView = new Text({
      text: `💰${this.price}`,
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
