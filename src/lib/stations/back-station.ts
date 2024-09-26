import { viewUpdateJob, x } from "../../globals";
import { Product } from "../product";
import { BackStationSlot } from "./back-station-slot";
import { DockPoint, Station, type StationOptions } from "./stations";

const ONE_MS = 1_000; // 1000 ms aka 1 s

type BackStationOptions = StationOptions & {
  // identifier
  category: number;
  // starting price of produced product
  price: number;
  // starting time in milliseconds for work to complete
  workDuration: number;
  // TODO: temp option for dev, should be extracted from config
  slotGrowDirection: string;
};

export class BackStation extends Station {
  static MAX_SLOTS = 3;

  public category: number;
  public price: number;
  public workDuration = ONE_MS * 1.5;

  // TODO: make stations locked by default
  public isUnlocked = false;

  private slots: BackStationSlot[] = [];
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

    this.view.alpha = 0.5;

    // for now unlocking and upgrading stations on click
    // TODO: Update from pop ups when enough coins available
    this.view.on("pointertap", () => this.upgrade());

    this.slotGrowDirection = slotGrowDirection;
  }
  
  upgrade() {
      this.isUnlocked = true;
      this.view.alpha = 1;

      const slot = this.addSlot();
      slot && viewUpdateJob.push({ job: "add", child: slot.view });
  }

  getSlot(): BackStationSlot | undefined {
    if (!this.isUnlocked) return undefined;

    let slot: BackStationSlot | undefined = undefined;
    for (let i = 0; i < this.slots.length; i++) {
      if (this.slots[i].available()) {
        slot = this.slots[i];
        break;
      }
    }
    return slot;
  }

  addSlot(): Station | undefined {
    const sl = this.slots.length;
    if (sl === BackStation.MAX_SLOTS) return undefined;

    const lastSlot = sl === 0 ? this.position : this.slots[sl - 1].position;
    const d = this.slotGrowDirection === "bottom";

    const _x = lastSlot.x + (d ? 0 : BackStation.SIZE + x(1));
    const _y = lastSlot.y + (d ? BackStation.SIZE + x(1) : 0);
    const newSlot = new BackStationSlot(_x, _y, {
      color: this.color,
      dockSide: d ? DockPoint.RIGHT : DockPoint.TOP,
    });

    this.slots.push(newSlot);
    return newSlot;
  }

  createProduct() {
    return new Product(this.category, this.color, this.price);
  }
}
