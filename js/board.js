import {
  GRID_SIZE, HALF_GRID, HOLE_SIZE, TAU,
  DIRECTION_HORIZONTAL, DIRECTION_VERTICAL,
  SNAP_BOARD, SNAP_POWER_RAIL_1, SNAP_POWER_RAIL_2,
} from './consts.js';
import { Part, High, Low, Wire, DrawOptions } from './parts.js';

const RAIL_HEIGHT = 55;

export class SnapPoint extends DOMPoint {
  /** @type {Number} */
  type;

  /** @type {Number} */
  col;

  /** @type {Number} */
  row;

  /**
   * @arg {Number} x - Snap point X coordinate in screen pixels.
   * @arg {Number} y - Snap point Y coordinate in screen pixels.
   * @arg {Number} type - See `SNAP_TYPE_*` exports.
   * @arg {Number} col - Pin column number.
   * @arg {Number} row - Pin row number.
   */
  constructor(x, y, type, col, row) {
    super(x, y);

    this.type = type;
    this.col = col;
    this.row = row;
  }
}

export class Board {
  /** @type {Number} */
  width;

  /** @type {Number} */
  height;

  /** @type {DOMPoint} */
  pos;

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
    this.pos = new DOMPoint();

    this.#parts = Array.from(new Array(this.height), () => new Array(this.width));
    this.#traces = Array.from(new Array(this.width * 2), () => {
      return new Trace(5, DIRECTION_VERTICAL, 'rgba(0, 32, 64, 0.2)');
    });

    const pins = Math.floor(this.width / 6 * 5);
    this.#power = [
      new PowerRail(pins, (this.width + 2) * GRID_SIZE, true),
      new PowerRail(pins, (this.width + 2) * GRID_SIZE, false),
    ];
  }

  /**
   * @arg {CanvasRenderingContext2D} ctx - Canvas rendering context.
   * @arg {DOMHighResTimeStamp} delta - Time delta for animations.
   */
  draw(ctx, delta) {
    const width = (this.width + 2) * GRID_SIZE;
    const height = (this.height + 4) * GRID_SIZE;

    ctx.translate(this.pos.x, this.pos.y);

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

    ctx.translate(-this.pos.x, -this.pos.y);
  }

  /**
   * @arg {Part} part - Part to be snapped to the grid.
   * @arg {Number} x - X coordinate in screen pixels.
   * @arg {Number} y - Y coordinate in screen pixels.
   * @return {SnapPoint | void}
   */
  snap(part, x, y) {
    x -= this.pos.x;
    y -= this.pos.y - RAIL_HEIGHT;

    const width = (this.width + 2) * GRID_SIZE;
    const height = (this.height + 4) * GRID_SIZE + RAIL_HEIGHT * 2;
    const halfHeight = this.height / 2;

    // Hit test
    if (x < 0 || y < 0 || x >= width || y >= height) {
      return;
    }

    let col = 0;
    let row = 0;

    // Set the snap type
    let type = SNAP_POWER_RAIL_1;
    if (y > RAIL_HEIGHT && y < height - RAIL_HEIGHT) {
      type = SNAP_BOARD;
    } else {
      type = SNAP_POWER_RAIL_2;
    }

    // Only wires can connect to the power rails
    if (!(part instanceof Wire) && type != SNAP_BOARD) {
      return;
    }

    if (type == SNAP_BOARD) {
      // Snap to board pins
      let by = Math.floor((y - RAIL_HEIGHT) / GRID_SIZE - 1);
      if (by <= halfHeight) {
        by = Math.min(by, halfHeight - 1);
      } else if (by > halfHeight) {
        by = Math.max(by - 2, halfHeight);
      }

      col = Math.min(Math.max(Math.floor(x / GRID_SIZE - 1), 0), this.width - part.pins);
      row = Math.min(Math.max(by, 0), this.height - 1);

      x = this.pos.x + (col + 1) * GRID_SIZE + HALF_GRID;
      y = this.pos.y + ((row >= halfHeight ? row + 2 : row) + 1) * GRID_SIZE + HALF_GRID;
    } else {
      // TODO: Snap to power rail pins
      x += this.pos.x;
      y += this.pos.y - RAIL_HEIGHT;
    }

    // Compute snapping point
    return new SnapPoint(x, y, type, col, row);
  }
}

class PowerRail {
  /** @type {Number} */
  #pins;

  /** @type {Number} */
  #width;

  /** @type {Boolean} */
  #top;

  /** @type {[Trace, Trace]} */
  #traces;

  /**
   * @arg {Number} pins - Number of pins in each trace.
   * @arg {Number} width - board width in pixels.
   * @arg {Boolean} top - Draw with offset from top or bottom.
   */
  constructor(pins, width, top) {
    this.#pins = pins;
    this.#width = width;
    this.#top = top;

    this.#traces = [
      new Trace(pins, DIRECTION_HORIZONTAL, 'rgba(192, 0, 0, 0.2)'),
      new Trace(pins, DIRECTION_HORIZONTAL, 'rgba(0, 0, 192, 0.2)'),
    ];
  }

  /** @return {Part} */
  high() {
    return new High();
  }

  /** @return {Part} */
  low() {
    return new Low();
  }

  /**
   * @arg {CanvasRenderingContext2D} ctx - Canvas context.
   * @arg {DOMHighResTimeStamp} delta - Time delta for animations.
   */
  draw(ctx, delta) {
    ctx.save();
    ctx.translate(0, this.#top ? -RAIL_HEIGHT : 0);

    // Base
    ctx.fillStyle = 'gray';
    ctx.fillRect(0, 0, this.#width, RAIL_HEIGHT);

    // Edge separators
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, this.#width, 2);
    ctx.fillRect(0, RAIL_HEIGHT - 2, this.#width, 2);

    // Positive label
    {
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgb(192, 0, 0)';
      ctx.beginPath();

      // Left plus
      ctx.moveTo(15, 5);
      ctx.lineTo(15, 15);
      ctx.moveTo(10, 10);
      ctx.lineTo(20, 10);

      // Line
      ctx.moveTo(30, 10);
      ctx.lineTo(this.#width - 30, 10);

      // Right plus
      ctx.moveTo(this.#width - 15, 5);
      ctx.lineTo(this.#width - 15, 15);
      ctx.moveTo(this.#width - 20, 10);
      ctx.lineTo(this.#width - 10, 10);
      ctx.closePath();

      ctx.stroke();
    }

    // Negative label
    {
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgb(0, 0, 192)';
      ctx.beginPath();

      // Left minus
      ctx.moveTo(10, 45);
      ctx.lineTo(20, 45);

      // Line
      ctx.moveTo(30, 45);
      ctx.lineTo(this.#width - 30, 45);

      // Right minus
      ctx.moveTo(this.#width - 20, 45);
      ctx.lineTo(this.#width - 10, 45);
      ctx.closePath();

      ctx.stroke();
    }

    // Inner traces
    for (const [i, trace] of this.#traces.entries()) {
      const x = 35;
      const y = (i + 1) * GRID_SIZE;

      ctx.translate(x, y);
      trace.draw(ctx, delta);
      ctx.translate(-x, -y);
    }

    // Holes
    ctx.fillStyle = 'black';
    for (const j of [1, 2]) {
      for (let i = 0; i < this.#pins; i++) {
        const g = Math.floor(i / 5);
        const x = (i + g) * GRID_SIZE + 35;
        const y = j * GRID_SIZE;

        ctx.beginPath();
        ctx.arc(x, y, HOLE_SIZE, 0, TAU);
        ctx.closePath();
        ctx.fill();
      }
    }

    ctx.restore();
  }
}

export class Trace {
  /** @type {Number} */
  #pins;

  /** @type {Number} */
  #dir;

  /** @type {String} */
  #color;

  /**
   * @arg {Number} pins - Number of pins in the trace.
   * @arg {Number} dir - Trace direction (See `DIRECTION_*` constants).
   * @arg {String} color - Wire color.
   */
  constructor(pins, dir, color) {
    this.#pins = pins;
    this.#dir = dir;
    this.#color = color;
  }

  /**
   * @arg {CanvasRenderingContext2D} ctx - Canvas context.
   * @arg {DOMHighResTimeStamp} _delta - Time delta for animations.
   * @arg {DrawOptions} [_options] - Drawing options.
   */
  draw(ctx, _delta, _options) {
    ctx.strokeStyle = this.#color;
    ctx.lineWidth = HOLE_SIZE * 1.5;

    let x = 0;
    let y = 0;

    if (this.#dir == DIRECTION_HORIZONTAL) {
      x = (this.#pins / 5 * 6 - 2) * GRID_SIZE;
    } else {
      y = (this.#pins - 1) * GRID_SIZE;
    }

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(x, y);
    ctx.closePath();
    ctx.stroke();
  }
}
