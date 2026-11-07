// Consumer-style browser sketch: p5 2.x addon, never standalone APIs.
// A fixed-time entry point makes playback and frame-seam checks reproducible.
let sceneT = 0;
function setup() {
  pixelDensity(1);
  createCanvas(360, 240, WEBGL);
  angleMode(DEGREES);
  brush.scaleBrushes(2);
  noLoop();
  window.sceneReady = true;
  window.renderAt = (t) => {
    if (!Number.isFinite(t)) throw new Error('renderAt needs a finite time');
    sceneT = t;
    redraw();
  };
}
function draw() {
  background('#faf6ed');
  randomSeed(42);
  noiseSeed(42);
  push();
  translate(-width / 2, -height / 2);
  brush.set('HB', '#24384d', 2);
  brush.line(24, 38, 336, 38);
  brush.set('marker', '#b44c3a', 3);
  brush.circle(180 + 60 * Math.sin(2 * Math.PI * sceneT), 124, 34);
  brush.noStroke();
  brush.wash('#3f806e', 190);
  brush.rect(45, 194, 270, 16);
  brush.noWash();
  pop();
}
