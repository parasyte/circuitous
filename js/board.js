import { GRID_SIZE, HALF_GRID, HOLE_SIZE, TAU } from './consts.js';
import { Part, PowerRail, Trace } from './parts.js';

export class Board {
  /** @type {Number} */
  width;

  /** @type {Number} */
  height;

  /** @type {Part[][]} */
  #parts;

  /** @type {Trace[]} */
  #traces;

  /** @type {[PowerRail, PowerRail]} */
  #power;

  /**
   * @arg {Number | undefined} [width=60] - Board width in positions.
   * @arg {Number | undefined} [height=10] - Board width in positions.
   */
  constructor(width, height) {
    this.width = width || 60;
    this.height = height || 10;

    this.#parts = Array.from(new Array(this.height), () => new Array(this.width));
    this.#traces = Array.from(new Array(this.width * 2), () => new Trace('rgba(0, 32, 64, 0.2)'));

    const power_width = Math.floor(this.width / 6 * 5);
    this.#power = [
      new PowerRail(power_width, (this.width + 2) * GRID_SIZE, true),
      new PowerRail(power_width, (this.width + 2) * GRID_SIZE, false),
    ];
  }

  /**
   * @arg {CanvasRenderingContext2D} ctx - Canvas rendering context.
   * @arg {DOMHighResTimeStamp} delta - Time delta for animations.
   */
  draw(ctx, delta) {
    const width = (this.width + 2) * GRID_SIZE;
    const height = (this.height + 4) * GRID_SIZE;

    // Base
    ctx.fillStyle = 'gray';
    ctx.fillRect(0, 0, width, height);

    // Center gap
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, GRID_SIZE * 6.5, width, GRID_SIZE);

    // Inner traces
    for (const [i, trace] of this.#traces.entries()) {
      const x = (i % this.width + 1) * GRID_SIZE + HALF_GRID;
      const y = (Math.floor(i / this.width) * (this.height / 2 + 2) + 1) * GRID_SIZE + HALF_GRID;

      ctx.translate(x, y);
      trace.draw(ctx, delta);
      ctx.translate(-x, -y);
    }

    // Holes
    ctx.fillStyle = 'black';
    for (let j = 0; j < this.height + 2; j++) {
      // Skip center two rows
      if (j === this.height / 2) {
        j += 2;
      }

      for (let i = 0; i < this.width; i++) {
        const x = (i + 1) * GRID_SIZE + HALF_GRID;
        const y = (j + 1) * GRID_SIZE + HALF_GRID;

        ctx.beginPath();
        ctx.arc(x, y, HOLE_SIZE, 0, TAU);
        ctx.closePath();
        ctx.fill();
      }
    }

    // Column labels
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const j of [0, this.height + 3]) {
      for (let i = 0; i <= this.width; i += 5) {
        const x = i * GRID_SIZE + HALF_GRID;
        const y = j * GRID_SIZE + HALF_GRID;
        if (i) {
          ctx.fillText(`${i}`, x, y);
        } else {
          ctx.fillText('1', x + GRID_SIZE, y);
        }
      }
    }

    // Row labels
    for (let j = 0, ch = 0; j < this.height + 2; j++, ch++) {
      // Skip center two rows
      if (j === this.height / 2) {
        j += 2;
      }

      for (const i of [0, this.width + 1]) {
        const x = i * GRID_SIZE + HALF_GRID;
        const y = (j + 1) * GRID_SIZE + HALF_GRID;
        ctx.fillText(String.fromCharCode(ch + 'a'.charCodeAt(0)), x, y);
      }
    }

    // Power rails
    for (const [i, rail] of this.#power.entries()) {
      const y = i * (this.height + 4) * GRID_SIZE;

      ctx.translate(0, y);
      rail.draw(ctx, delta);
      ctx.translate(0, -y);
    }

    // Parts
    const seen = new Set();
    for (let [j, row] of this.#parts.entries()) {
      // Skip center two rows
      if (j === this.height / 2) {
        j += 2;
      }

      for (const [i, part] of row.entries()) {
        if (!part || seen.has(part)) {
          continue;
        }
        seen.add(part);

        const x = (i + 1) * GRID_SIZE + HALF_GRID;
        const y = (j + 1) * GRID_SIZE + HALF_GRID;

        ctx.translate(x, y);
        part.draw(ctx, delta);
        ctx.translate(-x, -y);
      }
    }
  }
}
