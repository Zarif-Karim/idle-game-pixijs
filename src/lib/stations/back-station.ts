import { Graphics, Point } from "pixi.js";
import { StateData, status, viewUpdateJob, x } from "../../globals";
import { Product } from "../product";
import { BackStationSlot } from "./back-station-slot";
import { StationDetails } from "./station-details";
import { DockPoint, Station, type StationOptions } from "./stations";
import { assert, ICONS } from "../utils";
import { BigNumber } from "../idle-bignum";

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
  public productPrice: BigNumber;

  public upgradePrice: BigNumber;

  public category: number;
  public workDuration: number;

  public isUnlocked = false;

  private slots: BackStationSlot[] = [];
  // TODO: temp var for dev (assess)
  private slotGrowDirection: string;

  public infoPopup: StationDetails;
  private upgradableMarker: Graphics;

  constructor(x: number, y: number, opts: BackStationOptions) {
    super(x, y, { color: opts.color, interactive: true });

    this.category = opts.category;
    this.productPrice = BigNumber.from(opts.productPrice);
    this.workDuration = opts.workDuration;

    this.upgradePrice = BigNumber.from(opts.upgradePrice);

    this.infoPopup = new StationDetails(
      x,
      y,
      this.LEVEL,
      this.upgradePrice,
      this.productPrice,
      this.workDuration,
      () => this.upgrade(),
    );
    this.infoPopup.visible = false;
    viewUpdateJob.push({ job: "add", child: this.infoPopup, obstruct: false });

    this.view.alpha = 0.5;

    this.view.on("pointertap", () => {
      this.infoPopup.visible = true;
    });

    this.slotGrowDirection = opts.slotGrowDirection;

    this.view.on("pointerover", () => (this.view.scale = 1.07));
    this.view.on("pointerout", () => (this.view.scale = 1));

    this.upgradableMarker = new Graphics()
      .circle(0, 0, Station.SIZE * 0.25)
      .fill({ color: "red" });
    this.upgradableMarker.eventMode = "none";
    this.upgradableMarker.visible = false;
    this.view.addChild(this.upgradableMarker);
  }

  canUpgrade(wallet: BigNumber) {
    const ubn = BigNumber.from(this.upgradePrice);
    assert(!ubn.negative, "upgradePrice cannot be negative");

    ubn.substract(wallet);
    return ubn.negative || ubn.isZero();
  }

  setUpgradable(flag: boolean) {
    this.upgradableMarker.visible = flag;
    this.infoPopup.setUpgradable(flag);
  }

  /**
   * @param onLoadRun should only be set to true when loading the game state on app startup
   */
  upgrade(onLoadRun = false) {
    if (!onLoadRun && !this.canUpgrade(StateData.bcoins)) {
      return;
    }

    this.isUnlocked = true;
    this.view.alpha = 1;
    this.LEVEL += 1;

    if (!onLoadRun) {
      StateData.bcoins.substract(this.upgradePrice);
    }

    // increase product sell price by 8% every upgrade
    this.productPrice.multiply(1.08);
    if (BackStation.DOUBLES_PRICE_AT.includes(this.LEVEL)) {
      this.productPrice.multiply(2);
    }
    // increase next upgrade price by 20% every upgrade
    this.upgradePrice.multiply(1.2);

    if (BackStation.ADD_SLOTS_AT.includes(this.LEVEL)) {
      const slot = this.addSlot();
      slot &&
        viewUpdateJob.push({ job: "add", child: slot.view, obstruct: true });
    }

    this.updateInfo();
    if (!onLoadRun) status.update(`${ICONS.MONEYSACK} ${StateData.bcoins}`);
  }

  updateInfo() {
    this.infoPopup.update(
      this.LEVEL,
      this.productPrice,
      this.upgradePrice,
      this.workDuration,
    );
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
    const inSlotView = this.slots.some((s) =>
      s.view.containsPoint(s.view.toLocal(point)),
    );
    const inDetailsView = this.infoPopup.contains(point);
    if (inStationView || inSlotView || inDetailsView) return true;

    return false;
  }
}
