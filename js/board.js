import { GRID_SIZE, HALF_GRID, HOLE_SIZE, TAU } from './consts.js';
import { Graph } from './graph.js';
import { DrawOptions, Part, PowerRail, Trace, Wire } from './parts.js';
import { $, Debounce } from './utils.js';

export class Board {
  /** @type {CanvasRenderingContext2D} */
  #ctx;

  /** @type {Number} */
  #width;

  /** @type {Number} */
  #height;

  /** @type {Part[][]} */
  #parts;

  /** @type {Trace[]} */
  #traces;

  /** @type {[PowerRail, PowerRail]} */
  #power;

  /** @type {Graph<Part, Trace>} */
  #graph;

  /** @type {Boolean} */
  #repaint;

  /** @type {DOMHighResTimeStamp} */
  #ts;

  /**
   * @arg {String} id - Parent canvas element ID.
   * @arg {Number | undefined} [width=60] - Board width in positions.
   * @arg {Number | undefined} [height=10] - Board width in positions.
   */
  constructor(id, width, height) {
    this.#width = width || 60;
    this.#height = height || 10;

    this.#parts = Array.from(new Array(this.#height), () => new Array(this.#width));
    this.#traces = Array.from(new Array(this.#width * 2), () => new Trace('rgba(0, 32, 64, 0.2)'));

    const power_width = Math.floor(this.#width / 6 * 5);
    this.#power = [
      new PowerRail(power_width, (this.#width + 2) * GRID_SIZE, true),
      new PowerRail(power_width, (this.#width + 2) * GRID_SIZE, false),
    ];
    this.#graph = new Graph();

    const canvas = $(id);
    if (canvas instanceof HTMLCanvasElement) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        this.#ctx = ctx;
      } else {
        throw new Error('Invalid canvas context ID');
      }
    } else {
      throw new Error('Invalid canvas ID');
    }

    const debounce_resize = new Debounce(this.#resize.bind(this), 100);
    window.addEventListener('resize', debounce_resize.call.bind(debounce_resize));
    this.#resize();

    this.#repaint = true;
    this.#ts = performance.now();
    window.requestAnimationFrame(this.#animate.bind(this));
  }

  #resize() {
    // Keep canvas sized to viewport.
    this.#ctx.canvas.style.width = `${window.innerWidth}px`;
    this.#ctx.canvas.style.height = `${window.innerHeight}px`;

    const scale = window.devicePixelRatio;

    this.#ctx.canvas.width = Math.floor(window.innerWidth * scale);
    this.#ctx.canvas.height = Math.floor(window.innerHeight * scale);

    // Center board on canvas.
    const width = (this.#width + 2) * GRID_SIZE;
    const height = (this.#height + 4) * GRID_SIZE;
    const x = (window.innerWidth - width) / 2 * scale;
    const y = (window.innerHeight - height) / 2 * scale;

    this.#ctx.setTransform(new DOMMatrix([scale, 0, 0, scale, x, y]));

    this.#repaint = true;
  }

  /** @arg {DOMHighResTimeStamp} delta - Time delta for animations. */
  #draw(delta) {
    this.#ctx.clearRect(0, 0, this.#ctx.canvas.width, this.#ctx.canvas.height);

    const width = (this.#width + 2) * GRID_SIZE;
    const height = (this.#height + 4) * GRID_SIZE;

    // Base
    this.#ctx.fillStyle = 'gray';
    this.#ctx.fillRect(0, 0, width, height);

    // Center gap
    this.#ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    this.#ctx.fillRect(0, GRID_SIZE * 6.5, width, GRID_SIZE);

    // Inner traces
    for (const [i, trace] of this.#traces.entries()) {
      const x = (i % this.#width + 1) * GRID_SIZE + HALF_GRID;
      const y = (Math.floor(i / this.#width) * (this.#height / 2 + 2) + 1) * GRID_SIZE + HALF_GRID;

      this.#ctx.translate(x, y);
      trace.draw(this.#ctx, delta, new DrawOptions([], []));
      this.#ctx.translate(-x, -y);
    }

    // Holes
    this.#ctx.fillStyle = 'black';
    for (let j = 0; j < this.#height + 2; j++) {
      // Skip center two rows
      if (j === this.#height / 2) {
        j += 2;
      }

      for (let i = 0; i < this.#width; i++) {
        const x = (i + 1) * GRID_SIZE + HALF_GRID;
        const y = (j + 1) * GRID_SIZE + HALF_GRID;

        this.#ctx.beginPath();
        this.#ctx.arc(x, y, HOLE_SIZE, 0, TAU);
        this.#ctx.closePath();
        this.#ctx.fill();
      }
    }

    // Column labels
    this.#ctx.textAlign = 'center';
    this.#ctx.textBaseline = 'middle';
    for (const j of [0, this.#height + 3]) {
      for (let i = 0; i <= this.#width; i += 5) {
        const x = i * GRID_SIZE + HALF_GRID;
        const y = j * GRID_SIZE + HALF_GRID;
        if (i) {
          this.#ctx.fillText(`${i}`, x, y);
        } else {
          this.#ctx.fillText('1', x + GRID_SIZE, y);
        }
      }
    }

    // Row labels
    for (let j = 0, ch = 0; j < this.#height + 2; j++, ch++) {
      // Skip center two rows
      if (j === this.#height / 2) {
        j += 2;
      }

      for (const i of [0, this.#width + 1]) {
        const x = i * GRID_SIZE + HALF_GRID;
        const y = (j + 1) * GRID_SIZE + HALF_GRID;
        this.#ctx.fillText(String.fromCharCode(ch + 'a'.charCodeAt(0)), x, y);
      }
    }

    // Power rails
    for (const [i, rail] of this.#power.entries()) {
      const y = i * (this.#height + 4) * GRID_SIZE;

      this.#ctx.translate(0, y);
      rail.draw(this.#ctx, delta, new DrawOptions([], []));
      this.#ctx.translate(0, -y);
    }

    // Parts
    const seen = new Set();
    for (let [j, row] of this.#parts.entries()) {
      // Skip center two rows
      if (j === this.#height / 2) {
        j += 2;
      }

      for (const [i, part] of row.entries()) {
        if (!part || seen.has(part)) {
          continue;
        }
        seen.add(part);

        const x = (i + 1) * GRID_SIZE + HALF_GRID;
        const y = (j + 1) * GRID_SIZE + HALF_GRID;

        this.#ctx.translate(x, y);
        part.draw(this.#ctx, delta, new DrawOptions([], []));
        this.#ctx.translate(-x, -y);
      }
    }
  }

  /** @arg {DOMHighResTimeStamp} ts */
  #animate(ts) {
    if (this.#repaint) {
      const delta = ts - this.#ts;
      this.#draw(delta);

      this.#ts = ts;
      this.#repaint = false;
    }

    window.requestAnimationFrame(this.#animate.bind(this));
  }
}
