import { GRID_SIZE, HALF_GRID, MAX_WIDTH } from './consts.js';
import { Part, And, Inverter, Nand, Nor, Or } from './parts.js';

export class Gui {
  /** @type {Part[]} */
  #parts;

  constructor() {
    this.#parts = [];
    this.#parts.push(new Inverter(new Part()));
    this.#parts.push(new And(new Part(), new Part()));
    this.#parts.push(new Nand(new Part(), new Part()));
    this.#parts.push(new Or(new Part(), new Part()));
    this.#parts.push(new Nor(new Part(), new Part()));
  }

  /** @return {Number} */
  get width() {
    return Math.min(this.#parts.length * GRID_SIZE * 4, MAX_WIDTH);
  }

  /**
   * @arg {CanvasRenderingContext2D} ctx - Canvas rendering context.
   * @arg {DOMHighResTimeStamp} delta - Time delta for animations.
   */
  draw(ctx, delta) {
    const width = this.width / this.#parts.length;

    ctx.fillStyle = 'rgba(64, 64, 64)';
    ctx.translate((-MAX_WIDTH + this.width) / 2, -HALF_GRID);
    ctx.fillRect(0, 0, MAX_WIDTH, GRID_SIZE * 3);
    ctx.translate(-(-MAX_WIDTH + this.width) / 2, HALF_GRID);

    for (const [i, part] of this.#parts.entries()) {
      const x = i * width + HALF_GRID;

      ctx.translate(x, 0);
      part.draw(ctx, delta);

      ctx.fillStyle = 'rgb(200, 200, 200)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(part.name, width / 2 - HALF_GRID, GRID_SIZE * 1.5);

      ctx.translate(-x, 0);
    }
  }
}
