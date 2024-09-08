import {
  type Application,
  type FederatedPointerEvent,
  Graphics,
  Point,
} from "pixi.js";

type Edges = {
  top: number;
  left: number;
  right: number;
  bottom: number;
};

// the rate at which the objects move in the screen
// always multiply this with the deltaTIme
const SPEED = 4;

const consumers: Graphics[] = [];
const targets: Graphics[] = [];

export default async (
  app: Application,
  updateStatus: (status: string) => void,
) => {
  // make whole screen interactable
  app.stage.eventMode = "static";
  app.stage.hitArea = app.screen;

  // app.stage.on("pointermove", (e: FederatedPointerEvent) => {
  //   console.log(e.global);
  // });

  updateStatus("Click to populate targets");
  targetAdder(app);
  consumerPopulator(app);
  consumerToTarget(app);
};

const consumerToTarget = (app: Application) => {
  app.ticker.add(({ deltaTime }) => {
    if (targets.length == 0) {
      // wait if there are not targets
      return;
    }
    const t = targets[0];
    consumers.forEach((c) => {
      moveTowardsTarget(c, t, SPEED * deltaTime);
      if (checkCircleCollision(c, t)) {
        app.stage.removeChild(t);
        targets.length = 0;
      }
    });
  });
};

function checkCircleCollision(circle1: Graphics, circle2: Graphics) {
  // Calculate the distance between the centers of the circles
  const dx = circle1.x - circle2.x;
  const dy = circle1.y - circle2.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Check if the distance is less than or equal to the sum of the radii
  return distance <= getRadius(circle1) + getRadius(circle2);
}

function getRadius(circle: Graphics) {
  const boundingBox = circle.getBounds();
  return Math.max(boundingBox.width, boundingBox.height) / 2;
}

function moveTowardsTarget(object: any, target: any, speed: number) {
  // Calculate the distance between the object and the target
  const dx = target.x - object.x;
  const dy = target.y - object.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  if (distance < 5) return;
  // Calculate the normalized direction vector
  const directionX = dx / distance;
  const directionY = dy / distance;

  // Calculate the movement amount for this frame
  const moveX = directionX * speed;
  const moveY = directionY * speed;

  // Update the object's position
  object.x += moveX;
  object.y += moveY;
}

const consumerPopulator = (app: Application) => {
  const { x: left, y: top, width, height } = app.screen;
  const [right, bottom] = [left + width, top + height];
  const edges = { top, left, right, bottom };
  // populate a consumer randomly on the edges
  generateRandomConsumers(edges, app);
};

const generateRandomConsumers = (edges: Edges, app: Application) => {
  const targetSize = 15;
  const ammount = 1;
  for (let i = 0; i < ammount; i++) {
    consumers.push(makeTarget(randomPositionTopSide(edges), targetSize));
  }
  app.stage.addChild(...consumers);
};

const randomPositionTopSide = ({ top, right, left }: Edges) => {
  const topLeft = new Point(left, top);
  const topRight = new Point(right, top);
  return randomPoint(topLeft, topRight);
};

const randomPoint = (a: Point, b: Point) => {
  const [minX, maxX] = [Math.min(a.x, b.x), Math.max(a.x, b.x)];
  const dx = maxX - minX;

  const [minY, maxY] = [Math.min(a.y, b.y), Math.max(a.y, b.y)];
  const dy = maxY - minY;

  const randomFraction = Math.random();
  return new Point(minX + dx * randomFraction, minY + dy * randomFraction);
};

const targetAdder = (app: Application) => {
  app.stage.on("pointerdown", (e: FederatedPointerEvent) => {
    // only add one target for now
    // on a new click remove the old target if not already removed
    if (targets.length > 0) {
      targets.forEach((t) => app.stage.removeChild(t));
      // emptying the array
      targets.length = 0;
    }

    const t = app.stage.addChild(makeTarget(e.global, 10));
    targets.push(t);
  });
};

function generateRandomColorHex(): string {
  const components = ["r", "g", "b"];
  const colorHex = "#" + components.map(() => {
    return Math.floor(Math.random() * 256).toString(16).padStart(2, "0");
  }).join("");

  return colorHex;
}

const makeTarget = (
  { x, y }: Point | { x: number; y: number },
  radius?: number,
): Graphics => {
  const target = new Graphics().circle(0, 0, radius || 20).fill({
    color: generateRandomColorHex(),
  }).stroke({ color: 0x111111, alpha: 0.87, width: 1 });
  target.position.set(x, y);
  return target;
};
