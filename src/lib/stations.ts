import { Rectangle } from "./rectangle";

const ONE_MS = 1_000; // 1000 ms aka 1 s

export class Station extends Rectangle {
  public static readonly SIZE = 40;
  public workDuration = ONE_MS * 3; 
  constructor(x: number, y: number, color: string) {
    super(x, y, Station.SIZE, Station.SIZE, { color });
  }
}
