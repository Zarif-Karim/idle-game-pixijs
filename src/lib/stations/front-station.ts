import { Product } from "../product";
import { CustomerWorker } from "../workers";
import { Station } from "./stations";

export class FrontStation extends Station {
  private hold: Map<number, Product[]> = new Map();
  public occupants: Set<CustomerWorker> = new Set();

  putProduct(p: Product) {
    const c = this.centre;
    p.setPos(c.x, c.y);

    const key = p.category;
    if (this.has(key)) this.hold.get(key)!.push(p);
    else this.hold.set(key, [p]);
  }

  getProduct(category: number) {
    const p = this.hold.get(category)?.pop();
    if (!p) {
      throw new Error(
        "Trying to get product from FrontStation but product not found!",
      );
    }
    return p;
  }

  has(category: number) {
    return !!(this.hold.get(category)?.length);
  }

  occupy(customer: CustomerWorker) {
    this.occupants.add(customer);
  }
  
  vacate(customer: CustomerWorker) {
    this.occupants.delete(customer);
  }
}
