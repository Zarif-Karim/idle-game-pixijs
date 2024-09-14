import { Application, Assets, Graphics } from "pixi.js";
import { EDGES, x } from "./globals";

let IS_FULLSCREEN = false;

export function isMobile() {
  const userAgentData = navigator.userAgentData;
  return !!(userAgentData && userAgentData.mobile);
}

export function toggleFullscreen(app: Application) {
  if (IS_FULLSCREEN) {
    document.exitFullscreen();
  } else {
    app.canvas.requestFullscreen();
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
  const svgFullscreenButton = await Assets.load({
    src: "full-screen-button.svg",
    data: {
      parseAsGraphicsContext: true,
    },
  });

  const graphics = new Graphics(svgFullscreenButton);
  const bounds = graphics.getLocalBounds();

  graphics.pivot.set(bounds.x, bounds.y);

  graphics.width = x(5);
  graphics.height = x(5);

  graphics.position.set(app.canvas.width - graphics.width - x(1), x(1));
  graphics.eventMode = "static";
  graphics.cursor = "pointer";
  // graphics.hitArea = 
  graphics.on("pointerdown", () => {
    toggleFullscreen(app);
    graphics.fill({ color: "red" });
  });

  graphics.on("pointerover", () => {
    graphics.tint = 0x666666;
  });
  graphics.on("pointerout", () => {
    graphics.tint = 0xffffff;
  });

  app.stage.addChild(graphics);
}
//
// function onPointerOver() {
//   this.tint = 0x666666;
// }
