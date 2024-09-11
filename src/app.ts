import {
  type Application,
  type FederatedPointerEvent,
  Graphics,
  Point,
} from "pixi.js";

import { Queue } from "./lib/queue";
import { Worker } from "./lib/worker";
import { getRandomInt } from "./lib/utils";
import { Status } from "./lib/status";
import { Rectangle } from "./lib/rectangle";
import { Station } from "./lib/stations";

// the rate at which the objects move in the screen
// always multiply this with the deltaTIme
const SPEED = 1;
// right and bottom are dynamically set by app.screen
const EDGES = { top: 0, left: 0, right: -1, bottom: -1 };

// const consumers: Graphics[] = [];
const jobs: Queue<number> = new Queue();
const workers: Queue<Worker> = new Queue();
const status = new Status("Initialising");
const stations: Station[] = [];

export default async (app: Application) => {
  EDGES.right = app.screen.width;
  EDGES.bottom = app.screen.height;

  // make whole screen interactable
  app.stage.eventMode = "static";
  app.stage.hitArea = app.screen;

  // app.stage.on("pointermove", (e: FederatedPointerEvent) => {
  //   console.log(e.global);
  // });

  // add stations
  createStations(app);

  jobAdder(app);
  addWorkers(app);
  assignJobs(app);

  // bottom of the screen for debug purposes
  const rect = new Rectangle(
    EDGES.left,
    EDGES.bottom - 1,
    EDGES.right,
    1,
  );

  app.stage.addChild(rect.view);

  // add the status last so its always visible
  app.stage.addChild(status.text);
};

function createStations(app: Application) {
  stations.push(...[
    new Station(EDGES.left + 40, 500, "blue"),
    new Station(EDGES.left + 40, 720, 'green'),
    new Station(180, 830, 'orange'),
    new Station(180, 630, 'pink'),
    new Station(EDGES.right - Station.SIZE - 40, 500, 'yellow'),
    new Station(EDGES.right - Station.SIZE - 40, 720, 'purple'),
  ]);
  app.stage.addChild(...stations.map((r) => r.view));
}

const assignJobs = (app: Application) => {
  app.ticker.add(() => {
    while (!workers.isEmpty) {
      // if not jobs wait for it
      if (jobs.isEmpty) {
        break;
      }

      const w = workers.pop();
      const j = jobs.pop();

      // @ts-ignore debuging purposes
      console.log(jobs.elements, '->', j);

      doWork(w!, j!, app);
    }
  });
};

function doWork(w: Worker, jn: number, app: Application) {
  const context = { w, jn, st: Date.now() };

  const work = ({ deltaTime }: { deltaTime: number }) => {
    const c = w.view;
    const j = stations[jn].view;
    moveTowardsTarget(c, j, SPEED * deltaTime);

    if (checkCollision(c, j)) {
      // moving to station finished
      app.ticker.remove(work, context);

      // when target reached do work for 1 sec
      setTimeout(() => {
        status.update(`Worker-${w.id}: ...done`);
        // join the queue again to find more work
        workers.push(w);
      }, 1000);
    }
  };

  app.ticker.add(work, context);
}

function checkCollision(circle1: Graphics, rectangle: Graphics) {
  const rectCenter = new Point(
    rectangle.x + rectangle.width / 2,
    rectangle.y + rectangle.height / 2,
  );

  // Calculate the distance between the objects
  const dx = circle1.x - rectCenter.x;
  const dy = circle1.y - rectCenter.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  const radius = getRadius(circle1);
  const halfWidth = rectangle.width / 2;

  // Check if the distance is less than or equal to the sum of the radii
  return distance <= radius + halfWidth;
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
  const randomPos = randomPositionMiddle();
  const w = new Worker(randomPos);

  // add to queue
  workers.push(w);

  // add to screen
  app.stage.addChild(w.view);
}

const randomPositionMiddle = () => {
  const { top, right, left, bottom } = EDGES;
  const middle = (bottom - top) / 2;
  const midLeft = new Point(left, middle);
  const midRight = new Point(right, middle);
  return randomPoint(midLeft, midRight);
};

const randomPoint = (a: Point, b: Point) => {
  const [minX, maxX] = [Math.min(a.x, b.x), Math.max(a.x, b.x)];
  const dx = maxX - minX;

  const [minY, maxY] = [Math.min(a.y, b.y), Math.max(a.y, b.y)];
  const dy = maxY - minY;

  const randomFraction = Math.random();
  return new Point(minX + dx * randomFraction, minY + dy * randomFraction);
};

const jobAdder = (app: Application) => {
  app.stage.on("pointerdown", (_e: FederatedPointerEvent) => {
    const randomJob = getRandomInt(0, stations.length - 1);

    // @ts-ignore debuging purposes
    console.log(randomJob, '->', jobs.elements);
    jobs.push(randomJob);
  });
};
