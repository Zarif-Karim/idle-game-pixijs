import { Button } from "@pixi/ui";
import { Rectangle, RectangleOptions } from "../rectangle";
import { Sprite, Text } from "pixi.js";
import { fpsText, x as gx, y as gy } from "../../globals";
import { ICONS } from "../utils";

export class TopBoarder extends Rectangle {
  private btnMap: Map<string, Button> = new Map();

  private screenOverlayBg: Rectangle;
  private fullScreenBtn!: Sprite;

  constructor(
    x: number,
    y: number,
    w: number,
    h: number,
    fullScreenBtnFactory: (x?: number, y?: number) => Promise<Sprite>,
    options?: RectangleOptions,
  ) {
    super(x, y, w, h, options);

    this.setupFullScreenBtn(fullScreenBtnFactory, gx(90), gy(1));

    this.view.eventMode = "passive";

    this.createBtn(
      "main",
      gx(90),
      gy(1),
      ICONS.GEAR,
      () => this.settingsViewToggle(),
      true,
    );

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

    this.createBtn("reset", gx(84), gy(1), ICONS.RESET, () => {
      if (confirm("Restart from beginning?")) {
        const id = localStorage.getItem("saveIntervalId") || "0";
        clearInterval(parseInt(id));
        localStorage.clear();
        location.reload();
      }
    });

    this.createBtn("info", gx(78), gy(1), ICONS.INFO, () => {
      alert("infoBtn");
    });
  }

  settingsViewToggle() {
    this.screenOverlayBg.view.visible = !this.screenOverlayBg.view.visible;
    fpsText.text.visible = !fpsText.text.visible;
    this.fullScreenBtn.visible = !this.fullScreenBtn.visible;

    for (let [_, btn] of this.btnMap) {
      btn.view.visible = !btn.view.visible;
    }
  }

  private async setupFullScreenBtn(
    factory: (x?: number, y?: number) => Promise<Sprite>,
    x?: number,
    y?: number,
  ) {
    this.fullScreenBtn = await factory(x, y);
    this.fullScreenBtn.visible = false;
    this.view.addChild(this.fullScreenBtn);
  }

  private createBtn(
    name: string,
    x: number,
    y: number,
    label: string,
    callback: () => void,
    visible = false,
  ) {
    const btn = new Button(
      new Text({ text: label, style: { fontSize: gx(5) } }),
    );
    btn.onPress.connect(callback);
    btn.view.position.set(x, y);
    btn.view.visible = visible;
    this.view.addChild(btn.view);
    this.btnMap.set(name, btn);
    return btn;
  }
}
