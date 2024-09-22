import { x } from "../../globals";
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
  // TODO: temp option for dev, should be extracted from config
  slotGrowDirection: "left" | "bottom";
};

export class BackStation extends Station {
  static MAX_SLOTS = 4;

  public category: number;
  public price: number;
  public workDuration = ONE_MS * 1.5;

  // TODO: make stations locked by default
  public isUnlocked = true;

  private slots: Station[] = [];
  // TODO: temp var for dev (assess)
  private slotGrowDirection: string;

  constructor(
    x: number,
    y: number,
    { color, price, workDuration, category, slotGrowDirection }:
      BackStationOptions,
  ) {
    super(x, y, { color });
    this.category = category;
    this.price = price;
    this.workDuration = workDuration;

    this.slotGrowDirection = slotGrowDirection;
    // Since stations are unlocked by default for now
    // add a slot to get started
    // slots are also taken as a query
    this.addSlot();
  }

  getView() {
    
  }

  addSlot(): Station | undefined {
    const sl = this.slots.length;
    if (sl === BackStation.MAX_SLOTS) return undefined;

    const lastSlot = sl === 0 ? this.position : this.slots[sl-1].position;
    const d = this.slotGrowDirection === 'bottom';

    const _x = lastSlot.x + (d ? 0 : BackStation.SIZE + x(1));
    const _y = lastSlot.x + (d ? 0 : BackStation.SIZE + x(1));
    const newSlot = new Station(_x, _y, { color: this.color });
    newSlot.view.alpha = 0.9;

    this.slots.push(newSlot);
    return newSlot;
  }

  createProduct() {
    return new Product(this.category, this.color, this.price);
  }
}
