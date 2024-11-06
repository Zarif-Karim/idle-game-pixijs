import { Button } from "@pixi/ui";
import { Rectangle, RectangleOptions } from "../rectangle";
import { Text } from "pixi.js";
import { fpsText, x as gx, y as gy } from "../../globals";

export class TopBoarder extends Rectangle {
  private btn: Button;
  private resetBtn: Button;

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

    // add fps display
    fpsText.text.visible = false;
    this.view.addChild(fpsText.text);

    this.resetBtn = new Button(
      new Text({ text: "🔄", style: { fontSize: gx(5) } }),
    );
    this.resetBtn.onPress.connect(() => {
      if (confirm("Restart from beginning?")) {
        const id = localStorage.getItem("saveIntervalId") || "0";
        clearInterval(parseInt(id));
        localStorage.clear();
        location.reload();
      }
    });
    this.resetBtn.view.position.set(gx(80), gy(1));
    this.resetBtn.view.visible = false;
    this.view.addChild(this.resetBtn.view);
  }

  settingsViewToggle() {
    this.screenOverlayBg.view.visible = !this.screenOverlayBg.view.visible;
    fpsText.text.visible = !fpsText.text.visible;
    this.resetBtn.view.visible = !this.resetBtn.view.visible;
  }
}
