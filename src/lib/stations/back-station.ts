import { Product } from "../product";
import { Station, type StationOptions } from "./stations";

const ONE_MS = 1_000; // 1000 ms aka 1 s

type BackStationOptions = StationOptions & {
  // identifier
  category: number;
  // starting price of produced product
  price: number;
  // starting time in milliseconds for work to complete
  workDuration: number;
};

export class BackStation extends Station {
  public category: number;
  public price: number;
  public workDuration = ONE_MS * 1.5;

  constructor(
    x: number,
    y: number,
    { color, price, workDuration, category }: BackStationOptions,
  ) {
    super(x, y, { color });
    this.category = category;
    this.price = price;
    this.workDuration = workDuration;
  }

  createProduct() {
    return new Product(this.category, this.color, this.price);
  }
}
