import { Application } from "pixi.js";
import { Worker } from "./worker";
import { DockPoint, FrontStation } from "../stations";
import {
  backStations,
  deliveryLocations,
  jobsFrontDelivery,
  workersBack,
} from "../../globals";
import { getRandomInt } from "../utils";
import { CustomerWorker } from "./customer-worker";

export class BackWorker extends Worker {
  doWork(
    {
      type,
      customer,
      at,
    }: {
      type: number;
      customer: CustomerWorker;
      at: FrontStation;
    },
    app: Application,
  ) {
    const context = { w: this, type, st: Date.now() };
    const st = backStations[type];
    const { workDuration: wd } = st;

    // get a slot from the back station and occupy it
    const slot = st.getSlot();
    if (!slot) {
      return false;
    }
    slot.occupy();

    let state = "station";
    let workStartTime = -1;
    let dt = 0;
    let dl: FrontStation;
    let moveState = "start";

    const work = ({ deltaTime }: { deltaTime: number }) => {
      const speed = Worker.SPEED * deltaTime;
      switch (state) {
        case "station":
          // go to the right station
          moveState = this.moveTo(slot.getDock(), speed, moveState);
          if (moveState === "done") {
            state = "work";
            moveState = "start";
            workStartTime = Date.now();
          }
          break;

        case "work":
          dt = Date.now() - workStartTime;
          // wait for the required time
          if (dt >= wd) {
            state = "deliver";
            this.progressBar.reset();
            slot.vacate();

            // product pickup
            const product = st.createProduct();
            this.takeProduct(product);

            // choose the delivery location
            dl =
              deliveryLocations[getRandomInt(0, deliveryLocations.length - 1)];
          } else {
            // update wait loading bar
            this.progressBar.update(dt / wd);
          }
          break;

        case "deliver":
          // deliver product
          moveState = this.moveTo(
            dl.getDockingPoint(DockPoint.BOTTOM),
            speed,
            moveState,
          );
          if (moveState === "done") {
            moveState = "start";
            // move product from hand to table
            const p = this.leaveProduct(dl);
            app.stage.addChild(p);

            // these products should be deliverd by FE workers
            jobsFrontDelivery.push({ from: dl, to: at, product: p, customer });
            state = "done";
          }
          break;
        case "done":
          // work done
          app.ticker.remove(work, context);
          // join back into queue
          workersBack.push(this);
          break;
        default:
          throw new Error("Work fell in default case!");
      }
    };

    app.ticker.add(work, context);
    return true;
  }
}
