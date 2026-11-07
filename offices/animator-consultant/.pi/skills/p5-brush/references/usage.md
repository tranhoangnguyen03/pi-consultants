# p5.brush 3.0.0 working reference

Source: https://github.com/acamposuribe/p5.brush/blob/main/llms.txt (checked 2026-11-07). Read the installed package's current API if it differs. p5.brush requires a browser with WebGL2. These are **separate builds**.

| Concern | p5 add-on | Standalone |
| --- | --- | --- |
| Module | `import * as brush from 'p5.brush'` | `import * as brush from 'p5.brush/standalone'` |
| Dependency | p5.js 2.x (package peer `^2.2`) | No p5.js |
| Canvas | `createCanvas(w,h,WEBGL)` | `brush.createCanvas(w,h)` |
| Transform/state | p5 `push/pop/translate/rotate/scale` | `brush.push/pop/translate/rotate/scale` |
| Seed | p5 `randomSeed/noiseSeed` | `brush.seed/noiseSeed` |
| Clear/flush | p5 `background`; frame flush automatic | `brush.clear`; call `brush.render()` after drawing |
| Angle mode | p5 `angleMode(DEGREES)` | `brush.angleMode(brush.DEGREES)` |

## p5 add-on example

Install in the project as appropriate: `npm install p5@^2.2 p5.brush@3.0.0`. Follow the project's own build setup. In a global-mode browser sketch, after loading the relevant scripts:

```js
function setup() {
  createCanvas(600, 600, WEBGL)
  angleMode(DEGREES)
  brush.scaleBrushes(3)
}
function draw() {
  background('#faf5e8')
  randomSeed(42)
  noiseSeed(42)
  push()
  translate(-width / 2, -height / 2)
  brush.set('HB', '#253b38', 1)
  brush.field('waves')
  brush.refreshField(frameCount / 60)
  brush.flowLine(80, 300, 420, 0)
  pop()
}
```

No `brush.render()`, `brush.clear()`, `brush.push()` or `brush.seed()` in this build. Use `brush.instance(p)` before `setup/draw` in p5 instance mode. `brush.load(pg)` is for secondary p5.Graphics / framebuffer targets, not normal main-canvas startup.

## Standalone example

Install only `p5.brush@3.0.0` in the project, or load its standalone ESM build. Call `render()` **every frame** after drawing.

```js
import * as brush from 'p5.brush/standalone'
const W = 600, H = 600
brush.createCanvas(W, H, { parent: document.body })
brush.scaleBrushes(3)
brush.angleMode(brush.DEGREES)
let t = 0
function frame() {
  brush.clear('#faf5e8')
  brush.seed(42)
  brush.noiseSeed(42)
  brush.push()
  brush.translate(-W / 2, -H / 2)
  brush.set('HB', '#253b38', 1)
  brush.field('waves')
  brush.refreshField(t)
  brush.flowLine(80, 300, 420, 0)
  brush.pop()
  brush.render()
  t += 1 / 60
  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)
```

This illustrates a nominal 60-fps frame step, **not** wall-clock-correct animation. For a real-time demo, compute `t` from `requestAnimationFrame` timestamps; for deterministic export, sample `t = frameIndex / fps` and capture each rendered frame. Do not use p5 globals in the standalone build. `brush.load(canvas)` only applies when registering an externally created canvas.

## Choose drawing operations

- Strokes: `brush.set(name,color,weight)`, `brush.line`, `brush.spline`, `brush.flowLine`, `brush.noStroke`.
- Shape and natural fill: `brush.fill(color, opacity)`, `brush.noFill`, `brush.fillBleed`, `brush.fillTexture`, `brush.wash`, `brush.circle`, `brush.rect`, `brush.polygon`.
- Hatching: `brush.hatch(distance, angle, options)`, `brush.hatchStyle`, `brush.mass(name,color,options)`; disable with `noHatch` / `noMass`.
- Fields: `brush.field('waves')`, `brush.refreshField(t)`, `brush.noField()`; use `brush.listFields()` to check names.
- Setup: `brush.scaleBrushes(scale)` for a matching mark size and `brush.box()` for the current brush names.

Prefer primary drawing primitives for visible geometry; use `Plot` and `Polygon` data objects only when their stored geometry matters. Native p5 text and other overlays should be drawn after brush content so they remain on top.

## Review checklist (select what matters)

Check the first and later frames, whether the field actually changes, texture stability versus deliberate randomness, clear versus retained marks, loop continuity, clipping, device pixel ratio, WebGL2 support and large-watercolor performance. Do not infer a working export from a running page. p5.brush itself does not produce MP4; use the project's capture/export tooling or the shared composition method when suitable.
