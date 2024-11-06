import { Button } from "@pixi/ui";
import { Rectangle, RectangleOptions } from "../rectangle";
import { Text } from "pixi.js";
import { x as gx, y as gy } from "../../globals";

export class TopBoarder extends Rectangle {
  private btn: Button;

  constructor(
    x: number,
    y: number,
    w: number,
    h: number,
    options?: RectangleOptions,
  ) {
    super(x, y, w, h, options);

    this.view.eventMode = "passive";
    this.btn = new Button(new Text({ text: "⚙️", style: { fontSize: gx(5) } }));
    this.btn.view.position.set(gx(90), gy(1));
    this.view.addChild(this.btn.view);
  }
}
