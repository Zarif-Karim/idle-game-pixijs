import "./style.css";
import { Application } from "pixi.js";
import start from "./app"

(async () => {
  const app = new Application();
  await app.init({ width: 640, height: 360 });
  const statusBar = document.createTextNode('Loading....');
  const root = document.querySelector<HTMLDivElement>("#app")!;
  root.appendChild(app.canvas);
  root.appendChild(statusBar);
  
  start(app, (status) => statusBar.textContent = status);
})();
