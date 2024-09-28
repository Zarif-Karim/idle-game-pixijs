import { Application, Point } from "pixi.js";
import { DockPoint, FrontStation } from "../stations";
import { Worker } from "./worker";
import { backStations, EDGES, jobsFrontTakeOrder, SPEED } from "../../globals";

export class CustomerWorker extends Worker {
  doWork(
    st: FrontStation,
    createCustomer: Function,
    app: Application,
    state = "waitArea",
  ) {
    const context = { s: st, c: this, st: Date.now() };
    state = "waitArea";

    const work = ({ deltaTime }: any) => {
      const speed = SPEED * deltaTime;
      switch (state) {
        case "waitArea":
          if (this.moveTo(st.getDockingPoint(DockPoint.TOP), speed)) {
            // wait for atleast 1 station to be unlocked
            const availableStations = backStations.filter((s) => s.isUnlocked);
            if (availableStations.length === 0) {
              // console.log('customer: no available stations, waiting..');
              break;
            }

            // wait for order taking
            jobsFrontTakeOrder.push({ from: st, customer: this });
            state = "wait";
          }
          break;
        case "wait":
          // NOTE:
          // the Front worker take order from customer.
          // this also needs to be updated to decouple the process
          // so back workers can also do that!

          // wait for order to be taken
          if (!this.isProductChoosen()) {
            // this means the order has not been taken yet
            // wait for next tick
            return;
          }

          // the above check passed i.e order already taken
          // pick a product from the table if any delivered
          const rpt = this.choosenProductType;
          if (st.has(rpt)) {
            const p = st.getProduct(rpt);
            this.recieveProduct(p);
            app.stage.removeChild(p);
          }

          if (this.isOrderCompleted()) {
            state = "leave";
          }
          break;
        case "leave":
          const exitPoint = new Point(EDGES.width + 100, 50);
          if (this.moveTo(exitPoint, speed)) {
            state = "done";
          }
          break;
        case "done":
          app.ticker.remove(work, context);
          app.stage.removeChild(this);
          createCustomer(app);
          break;
      }
    };

    app.ticker.add(work, context);
  }
}
