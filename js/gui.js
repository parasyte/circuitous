import { GRID_SIZE, MAX_WIDTH } from './consts.js';
import { Part, Inverter } from './parts.js';

export class Gui {
  /** @type {Part[]} */
  #parts;

  constructor() {
    this.#parts = [];
    this.#parts.push(new Inverter(new Part()));
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
    for (const part of this.#parts) {
      // TODO: Translate
      part.draw(ctx, delta);
    }
  }
}
