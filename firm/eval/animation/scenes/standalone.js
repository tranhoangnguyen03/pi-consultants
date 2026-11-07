// Consumer-style standalone sketch: no p5 globals or p5.js dependency.
import * as brush from '../node_modules/p5.brush/dist/brush.esm.js';
const width = 360, height = 240;
brush.createCanvas(width, height, {parent: '#app', pixelDensity: 1});
brush.scaleBrushes(2);
brush.angleMode(brush.DEGREES);
window.renderAt = (t) => {
  if (!Number.isFinite(t)) throw new Error('renderAt needs a finite time');
  brush.clear('#faf6ed');
  brush.seed(42);
  brush.noiseSeed(42);
  brush.push();
  brush.translate(-width / 2, -height / 2);
  brush.set('HB', '#24384d', 2);
  brush.line(24, 38, 336, 38);
  brush.set('marker', '#b44c3a', 3);
  brush.circle(180 + 60 * Math.sin(2 * Math.PI * t), 124, 34);
  brush.noStroke();
  brush.wash('#3f806e', 190);
  brush.rect(45, 194, 270, 16);
  brush.noWash();
  brush.pop();
  brush.render(); // mandatory in standalone, never in p5 add-on
};
window.sceneReady = true;
