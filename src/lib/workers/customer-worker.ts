import { Application, Point, Text } from "pixi.js";
import { DockPoint, FrontStation } from "../stations";
import { Worker, type WorkerOptions } from "./worker";
import { backStations, EDGES, jobsFrontTakeOrder, removeFromView, SPEED } from "../../globals";
import { getRandomInt } from "../utils";
import { Product } from "../product";

export class CustomerWorker extends Worker {
  public orderQuantityRemaining = -1;
  public choosenProductType = -1;
  private quantityView: Text;
  private makeOrderTime = 1_000; // 1 second

  constructor(x: number, y: number, options?: WorkerOptions) {
    super(x, y, options);

    this.quantityView = new Text({
      anchor: 1.5,
      text: this.orderQuantityRemaining,
      style: {
        fill: "white",
        fontWeight: "bold",
        fontSize: "40em",
        padding: 5,
      },
    });
    this.quantityView.visible = false;
    this.addChild(this.quantityView);
  }

  chooseProduct(type: number) {
    this.choosenProductType = type;
  }

  isProductChoosen() {
    return (this.choosenProductType !== -1);
  }

  takeProduct(p: Product) {
    super.takeProduct(p);
    if (this.isProductChoosen()) {
      this.quantityView.text = this.orderQuantityRemaining;
      this.quantityView.visible = true;
    }
  }

  makeOrder(startTime: number) {
    const dt = Date.now() - startTime;
    let completion = dt / this.makeOrderTime;
    completion = completion > 1 ? 1 : completion;
    let orders: number[] = [];

    if (completion === 1) {
      if (!this.isProductChoosen()) {
        throw new Error("product type not choosen yet but making order");
      }

      this.orderQuantityRemaining = getRandomInt(1, 3);
      orders = Array(this.orderQuantityRemaining).fill(this.choosenProductType);

      // TODO: this is temp code to show which order customer wants
      // should later be changed to a pop up with image and number
      const st = backStations[this.choosenProductType];
      const p = st.createProduct();
      this.takeProduct(p);
    }

    return { completion, orders };
  }

  recieveProduct(p: Product) {
    if (p.category === this.choosenProductType) {
      if (this.orderQuantityRemaining === 0) {
        throw new Error("Recieve called but quantity needed is zero");
      }
      this.orderQuantityRemaining -= 1;
      this.quantityView.text = this.orderQuantityRemaining;
      if (this.isOrderCompleted()) {
        this.quantityView.visible = false;
      }
    } else {
      throw new Error("Recieve called with type mismatch");
    }
  }

  isOrderCompleted() {
    if (this.orderQuantityRemaining !== 0) {
      return false;
    }

    if (!this.hold) throw new Error("OrderComplete true but no product held");
    this.removeChild(this.hold);
    return true;
  }

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
            removeFromView(app, p);
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
          removeFromView(app, this);

          createCustomer(app);
          break;
      }
    };

    app.ticker.add(work, context);
  }
}
