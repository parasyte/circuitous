import { GRID_SIZE, HALF_GRID, MAX_WIDTH } from './consts.js';
import { Board } from './board.js';
import { Part, HighZ, And, Inverter, Nand, Nor, Or, DrawOptions } from './parts.js';

const GRAB_NONE = 0;
const GRAB_CLICK = 1;
const GRAB_DRAG = 2;

export class Gui {
  /** @type {HTMLCanvasElement} */
  #canvas;

  /** @type {Board} */
  #board;

  /** @type {() => void} */
  #repaint;

  /** @type {Part[]} */
  #parts;

  /** @type {DOMPoint} */
  pos;

  /** @type {Number} */
  #grabbing;

  /** @type {DOMPoint} */
  #pointer;

  /** @type {Number} */
  #hit;

  /**
   * @arg {HTMLCanvasElement} canvas - Canvas element that owns this GUI.
   * @arg {Board} board - Breadboard reference for hit testing.
   * @arg {() => void} repaint - Request repaint function.
   */
  constructor(canvas, board, repaint) {
    this.#canvas = canvas;
    this.#board = board;
    this.#repaint = repaint;

    this.#parts = [];
    this.#parts.push(new Inverter(new HighZ()));
    this.#parts.push(new And(new HighZ(), new HighZ()));
    this.#parts.push(new Nand(new HighZ(), new HighZ()));
    this.#parts.push(new Or(new HighZ(), new HighZ()));
    this.#parts.push(new Nor(new HighZ(), new HighZ()));

    this.pos = new DOMPoint();
    this.#grabbing = GRAB_NONE;
    this.#pointer = new DOMPoint();
    this.#hit = -1;

    window.addEventListener('pointermove', this.#pointermove.bind(this));
    window.addEventListener('pointerdown', this.#pointerdown.bind(this));
    window.addEventListener('pointerup', this.#pointerup.bind(this));
    window.addEventListener('keydown', this.#keydown.bind(this));
  }

  /** @arg {PointerEvent} event - Event information. */
  #pointermove(event) {
    if (this.#grabbing) {
      this.#pointer.x = event.x;
      this.#pointer.y = event.y;
      this.#repaint();

      return;
    }

    const width = this.width / this.#parts.length;

    // Hit test mouse with GUI buttons.
    this.#hit = -1;

    for (const [i, part] of this.#parts.entries()) {
      const x = this.pos.x + i * width + HALF_GRID + GRID_SIZE * 2;
      const y = this.pos.y + HALF_GRID;

      if (part.hitTest(x - event.x, y - event.y)) {
        this.#hit = i;
        break;
      }
    }

    if (this.#hit >= 0) {
      this.#canvas.style.cursor = 'grab';
      this.#pointer.x = event.x;
      this.#pointer.y = event.y;
    } else {
      this.#canvas.style.cursor = 'auto';
      this.#pointer.x = 0;
      this.#pointer.y = 0;
    }
  }

  #pointerdown() {
    if (this.#grabbing) {
      this.#reset();
    } else if (this.#hit >= 0) {
      this.#grabbing = GRAB_DRAG;
      this.#canvas.style.cursor = 'grabbing';
      this.#repaint();
    }

    this.#pointer.x = 0;
    this.#pointer.y = 0;
  }

  #pointerup() {
    const width = this.width / this.#parts.length;
    const x = this.pos.x + this.#hit * width + HALF_GRID + GRID_SIZE * 2;
    const y = this.pos.y + HALF_GRID;

    if (this.#grabbing && this.#pointer.x && this.#pointer.y &&
      (this.#hit < 0 || !this.#parts[this.#hit].hitTest(x - this.#pointer.x, y - this.#pointer.y))
    ) {
      this.#reset();
    } else if (this.#grabbing == GRAB_DRAG && this.#hit >= 0) {
      this.#grabbing = GRAB_CLICK;
      this.#repaint();
    }
  }

  /** @arg {KeyboardEvent} event - Event information. */
  #keydown(event) {
    if (event.code == "Escape") {
      this.#reset();
    }
  }

  #reset() {
    this.#grabbing = GRAB_NONE;
    this.#hit = -1;
    this.#canvas.style.cursor = 'auto';
    this.#repaint();
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
    // Draw static GUI
    const width = this.width / this.#parts.length;

    ctx.translate(this.pos.x, this.pos.y);

    ctx.fillStyle = 'rgba(40, 40, 40)';
    // TODO: Cleanup these translations
    ctx.translate((-MAX_WIDTH + this.width) / 2, -HALF_GRID);
    ctx.fillRect(0, 0, MAX_WIDTH, GRID_SIZE * 3);
    ctx.translate(-(-MAX_WIDTH + this.width) / 2, HALF_GRID);

    for (const [i, part] of this.#parts.entries()) {
      const x = i * width + HALF_GRID;

      ctx.translate(GRID_SIZE * 2 + x, HALF_GRID);
      part.draw(ctx, delta, DrawOptions.centered());

      ctx.fillStyle = 'rgb(200, 200, 200)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(part.name, 0, GRID_SIZE);

      ctx.translate(-(GRID_SIZE * 2 + x), -HALF_GRID);
    }

    ctx.translate(-this.pos.x, -this.pos.y);

    // Draw dynamic GUI (dragging)
    if (this.#grabbing && this.#pointer.x && this.#pointer.y && this.#hit >= 0) {
      let x = this.#pointer.x;
      let y = this.#pointer.y;
      let alpha = 0.5;

      const snap = this.#board.snap(this.#parts[this.#hit], x, y);
      if (snap) {
        x = snap.x;
        y = snap.y;
        alpha = 1.0;
        // TODO: Check for conflicts and change cursor to "not-allowed"
        //
        // Possible conflicts:
        // 1. Parts overlap.
        // 2. More than 1 output connected together.
      }

      ctx.translate(x, y);
      ctx.globalAlpha = alpha;
      this.#parts[this.#hit].draw(ctx, delta);
      ctx.globalAlpha = 1.0;
      ctx.translate(-x, -y);
    }
  }
}
