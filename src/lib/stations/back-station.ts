import { StateData, status, viewUpdateJob, x } from "../../globals";
import { Product } from "../product";
import { Status } from "../status";
import { BackStationSlot } from "./back-station-slot";
import { DockPoint, Station, type StationOptions } from "./stations";

const ONE_MS = 1_000; // 1000 ms aka 1 s

type BackStationOptions = StationOptions & {
  // identifier
  category: number;
  // starting price of produced product
  productPrice: number;
  // starting time in milliseconds for work to complete
  workDuration: number;
  // TODO: temp option for dev, should be extracted from config
  slotGrowDirection: string;
  // price needed to unlock station for the first time
  upgradePrice: number;
};

export class BackStation extends Station {
  static MAX_SLOTS = 3;

  public productPrice: number;

  public upgradePrice: number;

  public category: number;
  public workDuration = ONE_MS * 1.5;

  public isUnlocked = false;

  private slots: BackStationSlot[] = [];
  // TODO: temp var for dev (assess)
  private slotGrowDirection: string;

  private upgradePriceText: Status;
  private productPriceText: Status;

  constructor(
    x: number,
    y: number,
    opts: BackStationOptions,
  ) {
    super(x, y, { color: opts.color });
    this.category = opts.category;
    this.productPrice = opts.productPrice;
    this.workDuration = opts.workDuration;

    this.upgradePrice = opts.upgradePrice;

    // TODO: make pop-up
    // showing prices on the side as a workaround
    this.upgradePriceText = new Status(`${this.upgradePrice}`, {
      x: 50,
      y: -2,
      prefix: 'U: ',
    });
    this.productPriceText = new Status(`${this.productPrice}`, {
      x: 50,
      y: 20,
      prefix: 'P: ',
    });
    this.view.addChild(this.upgradePriceText.text);
    this.view.addChild(this.productPriceText.text);

    this.view.alpha = 0.5;

    // for now unlocking and upgrading stations on click
    // TODO: Update from pop ups when enough coins available
    this.view.on("pointertap", () => this.upgrade());

    this.slotGrowDirection = opts.slotGrowDirection;
  }

  canUpgrade(wallet: number) {
    const canUnlock = !this.isUnlocked && wallet >= this.upgradePrice;
    const canUpgrade = wallet >= this.upgradePrice;
    return canUnlock || canUpgrade;
  }

  upgrade() {
    if (!this.canUpgrade(StateData.coins)) {
      status.update(`${this.category}: need ${this.upgradePrice}`)
      setTimeout(() =>
        status.update(`Coins: ${StateData.coins}`), 1000);
      return;
    }

    this.isUnlocked = true;
    this.view.alpha = 1;

    StateData.coins -= this.upgradePrice;
    // increase product sell price by 8% every upgrade
    this.productPrice = Math.ceil(this.productPrice * 1.08);
    this.productPriceText.update(`${this.productPrice}`);
    // increase next upgrade price by 20% every upgrade
    this.upgradePrice = Math.ceil(this.upgradePrice * 1.2);
    this.upgradePriceText.update(`${this.upgradePrice}`);


    const slot = this.addSlot();
    slot && viewUpdateJob.push({ job: "add", child: slot.view });
    status.update(`Coins: ${StateData.coins}`);
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
    return new Product(this.category, this.color, this.productPrice);
  }
}
