import { Application, Assets, Point, Sprite } from "pixi.js";
import { addToView, x, y } from "./globals";

let IS_FULLSCREEN = false;

export function isMobile() {
  // @ts-ignore this exists! not sure why its complaining
  const userAgentData = navigator.userAgentData;
  return !!(userAgentData && userAgentData.mobile);
}

export async function toggleFullscreen(app: Application) {
  if (IS_FULLSCREEN) {
    await document.exitFullscreen();
  } else {
    await app.canvas.requestFullscreen();
  }
  IS_FULLSCREEN = !IS_FULLSCREEN;
}

export function addFullScreenToggle(app: Application) {
  window.addEventListener("keypress", (e: KeyboardEvent) => {
    if (e.key === "f" || e.key === "F") {
      toggleFullscreen(app);
    }
  });
}

export class FullscreenButton extends Sprite {
  constructor(img: any, app: Application) {
    super(img);

    this.width = x(5);
    this.height = x(5);

    this.position.set(x(94), x(1));
    this.eventMode = "static";
    this.cursor = "pointer";

    this.on("pointerdown", async () => {
      await toggleFullscreen(app);
    });

    this.on("pointerover", () => {
      this.tint = 0x666666;
    });
    this.on("pointerout", () => {
      this.tint = 0xffffff;
    });
  }

  reset() {
    this.width = x(5);
    this.height = x(5);

    // this.position.set(x(94), y(1));
    this.parent.toLocal(new Point(x(94), y(1)), undefined, this.position)
  }
}

export async function addFullScreenButton(app: Application) {
  const imgFullScreenBtn = await Assets.load("full-screen-button.png");
  const btn = new FullscreenButton(imgFullScreenBtn, app);
  addToView(app, btn);
  return btn;
}

