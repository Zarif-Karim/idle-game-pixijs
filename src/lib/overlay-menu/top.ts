import { Button } from "@pixi/ui";
import { Rectangle, RectangleOptions } from "../rectangle";
import { Text } from "pixi.js";
import { x as gx, y as gy } from "../../globals";

export class TopBoarder extends Rectangle {
  private btn: Button;

  private screenOverlayBg: Rectangle;

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
    this.btn.onPress.connect(() => this.settingsViewToggle());
    this.view.addChild(this.btn.view);

    this.screenOverlayBg = new Rectangle(0, 0, gx(100), gy(100), {
      color: "black",
      interactive: true,
    });
    this.screenOverlayBg.view.alpha = 0.5;
    this.screenOverlayBg.view.cursor = "default";
    this.screenOverlayBg.view.visible = false;
    this.screenOverlayBg.view.on("pointertap", () => this.settingsViewToggle());
    this.view.addChild(this.screenOverlayBg.view);
  }

  settingsViewToggle() {
    this.screenOverlayBg.view.visible = !this.screenOverlayBg.view.visible;
  }
}
