import "./style.css";
import { Application } from "pixi.js";
import start from "./app";
import { addFullScreenToggle } from "./screen-resize";
import { EDGES } from "./globals";

(async () => {
  const app = new Application();
  const { width, height } = EDGES;
  await app.init({ width, height });
  const root = document.querySelector<HTMLDivElement>("#app")!;
  root.appendChild(app.canvas);

  addFullScreenToggle(app);
  start(app);
})();
