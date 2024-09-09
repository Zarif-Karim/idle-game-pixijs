import {
  type Application,
  type FederatedPointerEvent,
  Graphics,
  Point,
} from "pixi.js";

import { Queue } from "./lib/queue";
import { Worker } from "./lib/worker";
import { makeTarget } from "./lib/utils";

// the rate at which the objects move in the screen
// always multiply this with the deltaTIme
const SPEED = 1;
// right and bottom are dynamically set by app.screen
const EDGES = { top: 0, left: 0, right: -1, bottom: -1 };

// const consumers: Graphics[] = [];
const jobs: Queue<Graphics> = new Queue();
const workers: Queue<Worker> = new Queue();

export default async (app: Application) => {
  EDGES.right = app.screen.width;
  EDGES.bottom = app.screen.height;

  // make whole screen interactable
  app.stage.eventMode = "static";
  app.stage.hitArea = app.screen;

  // app.stage.on("pointermove", (e: FederatedPointerEvent) => {
  //   console.log(e.global);
  // });

  targetAdder(app);
  addWorkers(app);
  assignJobs(app);
};

const assignJobs = (app: Application) => {
  app.ticker.add(() => {
    while (!workers.isEmpty) {
      // if not jobs wait for it
      if (jobs.isEmpty) {
        break;
      }

      const w = workers.pop();
      const j = jobs.pop();

      doWork(w!, j!, app);
    }
  });
};

function doWork(w: Worker, j: Graphics, app: Application) {
  const work = ({ deltaTime }: { deltaTime: number }) => {
    console.log(`Worker-${w.id}: working...`);
    const c = w.view;
    moveTowardsTarget(c, j, SPEED * deltaTime);

    if (checkCircleCollision(c, j)) {
      app.stage.removeChild(j);
      app.ticker.remove(work, w);
      console.log(`Worker-${w.id}: ...done`);

      /**
       * NOTE:
       * here we are not reusing the above worker
       * to test the app.ticker.remove is working
       * by printing the worker id which we are expecting
       * to be different.
       *
       * Think about the potentially reusing the workers
       * by adding them back in the queue. Look into the
       * benefits of re-using vs creating new workers!
       */
      app.stage.removeChild(c);
      addNewWorker(app);
    }
  };

  app.ticker.add(work, w);
}

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

const addWorkers = (app: Application) => {
  // populate a consumer randomly on the edges
  const amount = 5;
  for (let i = 0; i < amount; i++) {
    addNewWorker(app);
  }
};

function addNewWorker(app: Application) {
  const randomPos = randomPositionTopSide();
  const w = new Worker(randomPos);

  // add to queue
  workers.push(w);

  // add to screen
  app.stage.addChild(w.view);
}

const randomPositionTopSide = () => {
  const { top, right, left } = EDGES;
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
    const t = app.stage.addChild(makeTarget(e.global, 10));
    jobs.push(t);
  });
};
