import { Application, Text, TextStyle, TextStyleAlign } from "pixi.js";

export type StatusOptions = {
  x?: number;
  y?: number;
  stroke?: string;
  fill?: string;
  fontSize?: number;
  fontFamily?: string;
  align?: TextStyleAlign;
  wordWrap?: boolean;
  wordWrapWidth?: number;
  breakWords?: boolean;
  app?: Application;
  prefix?: string;
  anchor?: { x: number; y: number };
};

export class Status {
  private style: TextStyle;
  private onScreenText: Text;
  private prefixText: string;

  constructor(msg: string, opts?: StatusOptions) {
    this.style = new TextStyle({
      fontFamily: opts?.fontFamily || "Arial",
      fontSize: opts?.fontSize || 15,
      fill: opts?.fill || 0xff0000, // Red text
      // stroke: opts?.stroke || 0xFFFFFF, // White stroke
      // strokeThickness: 5, // 5px stroke width
      align: opts?.align || "center",
      wordWrap: opts?.wordWrap || true,
      wordWrapWidth: opts?.app ? opts.app.canvas.width : window.innerHeight,
      breakWords: opts?.breakWords || true,
    });

    this.prefixText = opts?.prefix || "";
    this.onScreenText = new Text({ text: msg, style: this.style });

    this.onScreenText.anchor = opts?.anchor || { x: 0.5, y: 0.5 };
    this.onScreenText.x = opts?.x || 0;
    this.onScreenText.y = opts?.y || 0;
    this.update(msg);
  }

  setPrefix(txt: string) {
    this.prefixText = txt;
  }

  update(msg: string) {
    this.onScreenText.text = `${this.prefixText}${msg}`;
  }

  get text() {
    return this.onScreenText;
  }
}
