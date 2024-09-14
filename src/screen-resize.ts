import { Application, Assets, Graphics, Rectangle, Sprite } from "pixi.js";
import { x } from "./globals";

let IS_FULLSCREEN = false;

export function isMobile() {
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
  console.log(isMobile());
  window.addEventListener("keypress", (e: KeyboardEvent) => {
    if (e.key === "f" || e.key === "F") {
      toggleFullscreen(app);
    }
  });
}

export async function addFullScreenButton(app: Application) {
  const imgFullScreenBtn = await Assets.load("full-screen-button.png");

  const btn = new Sprite(imgFullScreenBtn);

  btn.width = x(5);
  btn.height = x(5);

  btn.position.set(app.canvas.width - btn.width - x(1), x(1));
  btn.eventMode = "static";
  btn.cursor = "pointer";

  btn.on("pointerdown", async () => {
    await toggleFullscreen(app);
  });

  btn.on("pointerover", () => {
    btn.tint = 0x666666;
  });
  btn.on("pointerout", () => {
    btn.tint = 0xffffff;
  });

  app.stage.addChild(btn);
}

