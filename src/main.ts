import "./style.css";
import { Application } from "pixi.js";
import start from "./app"

// Maintain an aspect ration of 9:16 to be mobile friendly
const BASE_SIZE = 60;
const WIDTH = BASE_SIZE * 9;
const HEIGHT = BASE_SIZE * 16;

(async () => {
  const app = new Application();
  await app.init({ width: WIDTH, height: HEIGHT });
  const root = document.querySelector<HTMLDivElement>("#app")!;
  root.appendChild(app.canvas);
  start(app);
})();
