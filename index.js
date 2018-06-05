import { Universe } from "./wasm_game_of_life";
import { memory } from "./wasm_game_of_life_bg";

const CELL_SIZE = 5;
const GRID_COLOR = "#CCCCCC";

const COLOR_DEAD = "#111111";
const COLOR_ALIVE = "#FFAA00";
// These must match `Cell::Alive` and `Cell::Dead` in `src/lib.rs`.
const DEAD  = 0;
const ALIVE = 1;

const w_ = 800;
const h_ = 600;

const w = Math.ceil(w_/(CELL_SIZE * 1.5 * 1.1) + 1)/2;
const h = Math.ceil(h_/CELL_SIZE + 0.8660254037844387 * 1.1);

const universe = Universe.new(w,h);
const width = universe.width();
const height = universe.height();

// Initialize the canvas with room for all of our cells and a 1px border
// around each of them.
const canvas = document.getElementById("game-of-life-canvas");
canvas.width  = CELL_SIZE * (2 * width - 1) * 1.5 * 1.1;
canvas.height = CELL_SIZE * (height - 0.8660254037844387 * 1.1);

const ctx = canvas.getContext('2d');

let animationId = null;

const fps = new class {
  constructor() {
    this.fps = document.getElementById("fps");
    this.frames = [];
    this.lastFrameTimeStamp = performance.now();
  }

  render() {
    const now = performance.now();
    const delta = now - this.lastFrameTimeStamp;
    this.lastFrameTimeStamp = now;
    const fps = 1 / delta * 1000;

    this.frames.push(fps);
    if (this.frames.length > 100) {
      this.frames.shift();
    }

    let min = Infinity;
    let max = -Infinity;
    let sum = 0;
    for (let i = 0; i < this.frames.length; i++) {
      sum += this.frames[i];
      min = Math.min(this.frames[i], min);
      max = Math.max(this.frames[i], max);
    }
    let mean = sum / this.frames.length;

    this.fps.textContent = `
Frames per Second:
         latest = ${Math.round(fps)}
avg of last 100 = ${Math.round(mean)}
min of last 100 = ${Math.round(min)}
max of last 100 = ${Math.round(max)}
`.trim();
  }
};

var slow = -1;
const renderLoop = () => {
  fps.render();
  if (! (++slow % 10)) {
    drawCells();
    //for (let i = 0; i < 1; i++) {
      universe.tick();
    //}
  }
  animationId = requestAnimationFrame(renderLoop);
};

const getIndex = (x, y) => {
  return x + y * width;
};

const drawHexagon = (x,y) => {
    ctx.beginPath();
    ctx.moveTo(x+CELL_SIZE,y);
    // pre-calculated hexagon angles -for performance
    ctx.lineTo(x+CELL_SIZE*0.5,y+CELL_SIZE*0.8660254037844386);
    ctx.lineTo(x-CELL_SIZE*0.5,y+CELL_SIZE*0.8660254037844387);
    ctx.lineTo(x-CELL_SIZE,y);
    ctx.lineTo(x-CELL_SIZE*0.5,y-CELL_SIZE*0.8660254037844384);
    ctx.lineTo(x+CELL_SIZE*0.5,y-CELL_SIZE*0.8660254037844386);
    ctx.lineTo(x+CELL_SIZE,y);
    ctx.closePath();
    ctx.fill();
}

const drawCell = (what) => {
  for (var y = 0; y < height; y++) {
    for (var x = 0; x < width; x++) {
      const idx = getIndex(x,y);
      if (cells[idx] !== what) {
        continue;
      }
      drawHexagon(3.3*(x+(y%2)/2)*CELL_SIZE,y*CELL_SIZE);
    }
  }
};

const drawCells = () => {
  const cellsPtr = universe.cells();
  const cells = new Uint8Array(memory.buffer, cellsPtr, width * height);

  // Because changing the `fillStyle` is an expensive operation, we want to
  // avoid doing it for every cell. Instead, we do two passes: one for live
  // cells, and one for dead cells.

  // Dead cells.
  ctx.fillStyle = COLOR_DEAD;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Live cells.
  ctx.fillStyle = COLOR_ALIVE;
  for (var y = 0; y < height; y++) {
    for (var x = 0; x < width; x++) {
      const idx = getIndex(x,y);
      if (cells[idx] !== ALIVE) {
        continue;
      }
      drawHexagon(3.3*(x+(y%2)/2)*CELL_SIZE,y*CELL_SIZE);
    }
  }
};

const playPauseButton = document.getElementById("play-pause");

const isPaused = () => {
  return animationId === null;
};

const play = () => {
  playPauseButton.textContent = "⏸";
  renderLoop();
};

const pause = () => {
  playPauseButton.textContent = "▶";
  cancelAnimationFrame(animationId);
  animationId = null;
};

playPauseButton.addEventListener("click", event => {
  if (isPaused()) { play(); } else { pause(); }
});

canvas.addEventListener("click", event => {
  const boundingRect = canvas.getBoundingClientRect();

  const scaleX = canvas.width  / boundingRect.width;
  const scaleY = canvas.height / boundingRect.height;

  const canvasLeft = (event.clientX - boundingRect.left) * scaleX;
  const canvasTop  = (event.clientY - boundingRect.top)  * scaleY;

  const y = Math.min(Math.floor(canvasTop  / (CELL_SIZE + 1)), height - 1);
  const x = Math.min(Math.floor(canvasLeft / (CELL_SIZE + 1)), width  - 1);

  universe.toggle_cell(x, y);

  drawCells();
});

play();
