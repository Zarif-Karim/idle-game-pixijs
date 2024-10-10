import { Graphics, Point } from "pixi.js";
import { StateData, status, viewUpdateJob, x } from "../../globals";
import { Product } from "../product";
import { BackStationSlot } from "./back-station-slot";
import { StationDetails } from "./station-details";
import { DockPoint, Station, type StationOptions } from "./stations";
import { ICONS } from "../utils";

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
  static DOUBLES_PRICE_AT = [10, 25, 50, 75, 100, 150, 200, 250, 300];
  static ADD_SLOTS_AT = [1, 25, 75, 150];

  public LEVEL = 0;
  public productPrice: number;

  public upgradePrice: number;

  public category: number;
  public workDuration: number;

  public isUnlocked = false;

  private slots: BackStationSlot[] = [];
  // TODO: temp var for dev (assess)
  private slotGrowDirection: string;

  public infoPopup: StationDetails;
  private upgradableMarker: Graphics;

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

    this.infoPopup = new StationDetails(
      x,
      y,
      this.LEVEL,
      this.upgradePrice,
      this.productPrice,
      () => this.upgrade(),
    );
    this.infoPopup.visible = false;
    viewUpdateJob.push({ job: "add", child: this.infoPopup });

    this.view.alpha = 0.5;

    this.view.on("pointertap", () => {
      this.infoPopup.visible = true;
    });

    this.slotGrowDirection = opts.slotGrowDirection;

    this.view.on("pointerover", () => this.view.scale = 1.07);
    this.view.on("pointerout", () => this.view.scale = 1);

    this.upgradableMarker = new Graphics().circle(0, 0, Station.SIZE * 0.25)
      .fill({ color: "red" });
    this.upgradableMarker.eventMode = "none";
    this.upgradableMarker.visible = false;
    this.view.addChild(this.upgradableMarker);
  }

  canUpgrade(wallet: number) {
    const canUnlock = !this.isUnlocked && wallet >= this.upgradePrice;
    const canUpgrade = wallet >= this.upgradePrice;
    return canUnlock || canUpgrade;
  }

  setUpgradable(flag: boolean) {
    this.upgradableMarker.visible = flag;
    this.infoPopup.setUpgradable(flag);
  }

  upgrade() {
    if (!this.canUpgrade(StateData.coins)) {
      status.update(`${this.category}: need ${this.upgradePrice}`);
      setTimeout(
        () => status.update(`${ICONS.MONEYSACK} ${StateData.coins}`),
        1000,
      );
      return;
    }

    this.isUnlocked = true;
    this.view.alpha = 1;
    this.LEVEL += 1;

    StateData.coins -= this.upgradePrice;
    // increase product sell price by 8% every upgrade
    this.productPrice = Math.ceil(this.productPrice * 1.08);
    if (BackStation.DOUBLES_PRICE_AT.includes(this.LEVEL)) {
      this.productPrice *= 2;
    }
    // increase next upgrade price by 20% every upgrade
    this.upgradePrice = Math.ceil(this.upgradePrice * 1.2);

    if (BackStation.ADD_SLOTS_AT.includes(this.LEVEL)) {
      const slot = this.addSlot();
      slot && viewUpdateJob.push({ job: "add", child: slot.view });
    }

    this.infoPopup.update(this.LEVEL, this.productPrice, this.upgradePrice);
    status.update(`${ICONS.MONEYSACK} ${StateData.coins}`);
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
      toggleStationDetails: () => {
        this.infoPopup.visible = true;
      },
    });

    this.slots.push(newSlot);
    return newSlot;
  }

  createProduct() {
    return new Product(this.category, this.color, this.productPrice);
  }

  contains(point: Point) {
    const inStationView = this.view.containsPoint(this.view.toLocal(point));
    const inSlotView = this.slots.some((s) => s.view.containsPoint(s.view.toLocal(point)));
    const inDetailsView = this.infoPopup.contains(point);
    if (inStationView || inSlotView || inDetailsView) return true;

    return false;
  }
}
