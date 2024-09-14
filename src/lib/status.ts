import { Application, Text, TextStyle } from "pixi.js";

export class Status {
  private style: TextStyle;
  private onScreenText: Text;


  constructor(msg: string, app?: Application) {
    this.style = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 15,
      fill: 0xFF0000, // Red text
      stroke: 0xFFFFFF, // White stroke
      //strokeThickness: 5, // 5px stroke width
      align: 'center',
      //x: 20,
      //y: 20,
      wordWrap: true,
      wordWrapWidth: app ? app.canvas.width : window.innerHeight,
      breakWords: true,
    });

    this.onScreenText = new Text({ text: msg, style: this.style });

    this.onScreenText.x = 20;
    this.onScreenText.y = 20;
    this.onScreenText.anchor = { x: 0, y: 0 };
  }

  update(msg: string) {
    this.onScreenText.text = msg;
  }

  get text() {
    return this.onScreenText;
  }

}

