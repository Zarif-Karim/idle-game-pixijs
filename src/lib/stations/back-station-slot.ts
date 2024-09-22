import { Station } from "./stations";

export class BackStationSlot extends Station {
  private isFree = true;

  occupy() {
    this.isFree = false;
  }
  
  vacate() {
    this.isFree = true;
  }
  
  available() {
    return new Boolean(this.isFree);
  }
}
