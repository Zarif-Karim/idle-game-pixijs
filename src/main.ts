import "./style.css";
import { Application } from "pixi.js";
import start from "./app";
import { addFullScreenButton } from "./screen-resize";
import { EDGES } from "./globals";

(async () => {
  const app = new Application();
  await app.init({
    resizeTo: window,
    resolution: window.devicePixelRatio || 1,
    width: EDGES.width,
    height: EDGES.height,
    autoDensity: true,
  });
  const root = document.querySelector<HTMLDivElement>("#app")!;
  root.appendChild(app.canvas);

  console.log();
  await addFullScreenButton(app);

  start(app);
})();
