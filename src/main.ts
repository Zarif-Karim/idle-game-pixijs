import "./style.css";
import { Application } from "pixi.js";
import start from "./app"
import { addFullScreenToggle } from "./screen-resize";

// Maintain an aspect ration of 9:16 to be mobile friendly
function getScreenSize() {
  const { innerHeight, innerWidth } = window;
  let height = innerHeight;
  let width = height * 9 / 16;

  if( width > innerWidth) {
    width = innerWidth;
    height = width * 16 / 9;
  }
  return { width, height };
}


(async () => {
  const app = new Application();
  await app.init(getScreenSize());
  const root = document.querySelector<HTMLDivElement>("#app")!;
  root.appendChild(app.canvas);

  addFullScreenToggle(app);
  start(app);
})();
