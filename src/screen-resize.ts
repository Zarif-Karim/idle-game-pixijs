import { Application } from "pixi.js";

let IS_FULLSCREEN = false;

export function isMobile() {
  const userAgentData = navigator.userAgentData;
  return !!(userAgentData && userAgentData.mobile);
}

export function toggleFullscreen(app: Application) {
  if (IS_FULLSCREEN) {
    document.exitFullscreen();
  } else {
    app.canvas.requestFullscreen();
  }
  IS_FULLSCREEN = !IS_FULLSCREEN;
}

export function addFullScreenToggle(app: Application) {
  console.log(isMobile());
  window.addEventListener('keypress', (e: KeyboardEvent) => {
    if(e.key === 'f' || e.key === 'F') {
      toggleFullscreen(app);
    }
  });
}
