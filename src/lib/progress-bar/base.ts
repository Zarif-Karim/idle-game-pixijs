import { Container } from "pixi.js";

export abstract class ProgressBar extends Container {
  constructor(x: number, y: number) {
    super({x,y});
  }

  /**
   * @description Defines how the progress bar will look
   * by creating and then adding the view is the child 
   * of the current Container
   *
   * @constructor must be called in the child class constructor
   */
  abstract createView(): void;

  /**
   * @description Updates the progress bar based on given percentage fraction
   * @param percentage fraction between 0 and 1
   */
  abstract update(percentage: number): void;

  /**
   * resets the progress to 0
   */
  reset() {
    this.update(0);
  };
}

