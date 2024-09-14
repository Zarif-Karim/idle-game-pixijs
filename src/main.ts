import "./style.css";
import { Application } from "pixi.js";
import start from "./app";
import { addFullScreenButton } from "./screen-resize";

(async () => {
  const app = new Application();
  await app.init({ resizeTo: window });
  const root = document.querySelector<HTMLDivElement>("#app")!;
  root.appendChild(app.canvas);

  await addFullScreenButton(app);

  start(app);
})();
