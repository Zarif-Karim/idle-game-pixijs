import { Product } from "./lib/product";
import { Queue } from "./lib/queue";
import { BackStation, FrontStation } from "./lib/stations";
import { Status } from "./lib/status";
import { Worker } from "./lib/worker";

// export const CUSTOMERS = {
//   maxCount: 5,
// };

export const StageData = {
  coins: 0,
};

// Maintain an aspect ration of 9:16 to be mobile friendly
export function getScreenSize() {
  const { innerHeight, innerWidth } = window;
  let height = innerHeight;
  let width = height * 9 / 16;

  if (width > innerWidth) {
    width = innerWidth;
    height = width * 16 / 9;
  }
  return { width, height };
}

// the rate at which the objects move in the screen
// always multiply this with the deltaTIme
export const SPEED = 4;
// right and bottom are dynamically set by app.screen
export const EDGES = { top: 0, left: 0, ...getScreenSize() };

export const status: Status = new Status("Initialising");

/**
 * Take a number between 0 - 100 (including fractions)
 * the above number is used as a percentage to
 * return the on screen X coordinate
 */
export function x(percentage: number): number {
  return EDGES.width * (percentage / 100);
}

/**
 * Take a number between 0 - 100 (including fractions)
 * the above number is used as a percentage to
 * return the on screen Y coordinate
 */
export function y(percentage: number): number {
  return EDGES.height * (percentage / 100);
}

export type FrontTakeOrder = {
  from: FrontStation;
  customer: Worker;
};

export type FrontDelivery = FrontTakeOrder & {
  to: FrontStation;
  product: Product;
};

export const jobsBack: Queue<{ type: number; customer: Worker; at: FrontStation }> =
  new Queue();
export const workersBack: Queue<Worker> = new Queue();
export const backStations: BackStation[] = [];

export const deliveryLocations: FrontStation[] = [];

export const jobsFrontDelivery: Queue<FrontDelivery> = new Queue();
export const jobsFrontTakeOrder: Queue<FrontTakeOrder> = new Queue();
export const workersFront: Queue<Worker> = new Queue();
export const waitingArea: Queue<FrontStation> = new Queue();

export const customers: Queue<Worker> = new Queue();
