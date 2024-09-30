import "./style.css";
import { Application } from "pixi.js";
import start from "./app";
import { addFullScreenButton } from "./screen-resize";
import { EDGES, getScreenSize, screenView } from "./globals";

(async () => {
  const app = new Application();
  await app.init({ resizeTo: window });
  const root = document.querySelector<HTMLDivElement>("#app")!;
  root.appendChild(app.canvas);

  await addFullScreenButton(app);

  start(app);

  // dynamically reset screen size
  window.addEventListener("resize", () => {
    const { width, height } = getScreenSize();
    console.log({ width, height });

    EDGES.width = width;
    EDGES.height = height;


    app.stage.removeChildren();
    for(let child of screenView.values()) {
      // TODO: add a resize function to all the classes
      // child.resize();
      app.stage.addChild(child);
    }
  });
})();
