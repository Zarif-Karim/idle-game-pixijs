import {
  type Application,
  Assets,
  type FederatedPointerEvent,
  // Graphics,
  Sprite,
} from "pixi.js";

// const population: Sprite[] = [];
// const targets: Graphics[] = [];

export default async (
  app: Application,
  updateStatus: (status: string) => void
) => {
  // make whole screen interactable
  app.stage.eventMode = "static";
  app.stage.hitArea = app.screen;

  // Load the bunny texture.
  const texture = await Assets.load("vite.svg");

  // Create a new Sprite from an image path
  const bunny = new Sprite(texture);
  // Add to stage
  app.stage.addChild(bunny);

  let moveBunny = true;
  let bunnyOnScreen = true;
  app.stage.on("pointerdown", (_e: FederatedPointerEvent) => {
    // moveBunny = !moveBunny;
    bunnyOnScreen ? app.stage.removeChild(bunny) : app.stage.addChild(bunny);
    bunnyOnScreen = !bunnyOnScreen;
  });
  app.stage.on("pointermove", (e: FederatedPointerEvent) => {
    moveBunny && bunny.position.copyFrom(e.global);
  });

  // Center the sprite's anchor point
  bunny.anchor.set(0.5);

  // Move the sprite to the center of the screen
  bunny.x = app.screen.width / 2;
  bunny.y = app.screen.height / 2;

  // app.ticker.add((time) => {
  //   bunny.rotation += 0.1 * time.deltaTime;
  // });
};
