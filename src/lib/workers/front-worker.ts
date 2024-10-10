import { Application } from "pixi.js";
import {
  backStations,
  FrontDelivery,
  FrontTakeOrder,
  jobsBack,
  SPEED,
  StateData,
  status,
  workersFront,
} from "../../globals";
import { Worker } from "./worker";
import { DockPoint } from "../stations";
import { getRandomInt } from "../utils";

export class FrontWorker extends Worker {
  doWork(
    job: FrontTakeOrder | FrontDelivery,
    app: Application,
  ) {
    const context = { w: this, job, st: Date.now() };
    const jobType = "product" in job ? "FD" : "FTO";
    let state = jobType === "FD" ? "pick" : "customer";
    const jobFD = job as FrontDelivery;
    const jobFTO = job as FrontTakeOrder;

    let takeOrderStartTime: number;

    const work = ({ deltaTime }: { deltaTime: number }) => {
      const speed = SPEED * deltaTime;
      switch (state) {
        case "pick":
          if (this.moveTo(jobFD.from.getDockingPoint(DockPoint.TOP), speed)) {
            // pick product
            app.stage.removeChild(jobFD.product);
            this.takeProduct(jobFD.product);
            state = "deliver";
          }
          break;
        case "deliver":
          if (this.moveTo(jobFD.to.getDockingPoint(DockPoint.BOTTOM), speed)) {
            const p = this.leaveProduct(jobFD.to);
            app.stage.addChild(p);

            StateData.coins += p.price;
            status.update(`💰 ${StateData.coins}`);

            state = "done";
          }
          break;

        case "customer":
          if (
            this.moveTo(jobFTO.from.getDockingPoint(DockPoint.BOTTOM), speed)
          ) {
            // Take Order
            state = "takeOrder";
            takeOrderStartTime = Date.now();

            const availableStations = backStations.filter((s) => s.isUnlocked);
            const productType =
              availableStations[getRandomInt(0, availableStations.length - 1)]
                .category;
            jobFTO.customer.chooseProduct(productType);
          }
          break;
        case "takeOrder":
          const progress = jobFTO.customer.makeOrder(takeOrderStartTime);
          if (progress.completion === 1) {
            progress.orders.forEach((o) => {
              jobsBack.push({
                type: o,
                customer: jobFTO.customer,
                at: jobFTO.from,
              });
            });
            this.progressBar.reset();
            state = "done";
          } else {
            // update progress bar
            this.progressBar.update(progress.completion);
          }

          break;
        case "done":
          // work done
          app.ticker.remove(work, context);
          // join back into queue
          workersFront.push(this);
          break;
        default:
          throw new Error("Work fell in default case!");
      }
    };

    app.ticker.add(work, context);
  }
}
