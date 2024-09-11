import { Rectangle } from "./rectangle";

export class Station extends Rectangle {
  public static readonly SIZE = 40;
  constructor(x: number, y: number, color: string) {
    super(x, y, Station.SIZE, Station.SIZE, { color });
  }
}
