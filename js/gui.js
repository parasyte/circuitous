/* eslint-disable  @typescript-eslint/no-unused-vars */
import { GRID_SIZE, HALF_GRID, MAX_WIDTH } from './consts.js';
import { Board, SnapPoint } from './board.js';
import { Part, HighZ, And, Inverter, Nand, Nor, Or, DrawOptions } from './parts.js';
/* eslint-enable  @typescript-eslint/no-unused-vars */

const GRAB_NONE = 0;
const GRAB_CLICK = 1;
const GRAB_DRAG = 2;

export class Gui {
  /** @type {Board} */
  #board;

  /** @type {() => void} */
  #repaint;

  /** @type {(cursor: String) => void} */
  #setCursor;

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
   * @arg {Board} board - Breadboard reference for hit testing.
   * @arg {() => void} repaint - Request repaint function.
   * @arg {(cursor: String) => void} setCursor - Set the cursor for grabbing.
   */
  constructor(board, repaint, setCursor) {
    this.#board = board;
    this.#repaint = repaint;
    this.#setCursor = setCursor;

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

    ctx.fillStyle = 'rgba(20, 20, 20, 0.4)';
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

      const part = this.#parts[this.#hit];
      const snap = this.#board.snap(part, x, y);
      if (snap) {
        x = snap.x;
        y = snap.y;
        alpha = 1.0;
      }

      ctx.translate(x, y);
      ctx.globalAlpha = alpha;
      this.#parts[this.#hit].draw(ctx, delta);

      // Highlight the part in red if the snap point is not valid
      if (snap && !this.#isValidConnection(part, snap)) {
        ctx.fillStyle = 'rgba(192, 0, 0, 0.5)';
        ctx.fillRect(-HALF_GRID, -HALF_GRID, part.pins * GRID_SIZE, GRID_SIZE);
      }

      ctx.globalAlpha = 1.0;
      ctx.translate(-x, -y);
    }
  }


  /** @arg {PointerEvent} event - Event information. */
  #pointermove(event) {
    this.#pointer.x = event.x;
    this.#pointer.y = event.y;

    if (this.#grabbing) {
      const part = this.#parts[this.#hit];
      const snap = this.#board.snap(part, this.#pointer.x, this.#pointer.y);
      if (snap) {
        // Set the cursor to indicate whether or not the part can be dropped
        if (this.#isValidConnection(part, snap)) {
          this.#setCursor('grabbing');
        } else {
          this.#setCursor('not-allowed');
        }
      }

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
      this.#setCursor('grab');
    } else {
      this.#setCursor('auto');
    }
  }

  #pointerdown() {
    if (this.#grabbing) {
      this.#drop();
      this.#reset();
    } else if (this.#hit >= 0) {
      this.#grabbing = GRAB_DRAG;
      this.#setCursor('grabbing');
      this.#repaint();
    }
  }

  #pointerup() {
    const width = this.width / this.#parts.length;
    const x = this.pos.x + this.#hit * width + HALF_GRID + GRID_SIZE * 2 - this.#pointer.x;
    const y = this.pos.y + HALF_GRID - this.#pointer.y;

    if (this.#grabbing === GRAB_DRAG && this.#hit >= 0 && this.#parts[this.#hit].hitTest(x, y)) {
      this.#grabbing = GRAB_CLICK;
      this.#repaint();
    } else {
      this.#drop();
      this.#reset();
    }
  }

  /** @arg {KeyboardEvent} event - Event information. */
  #keydown(event) {
    if (event.code === 'Escape') {
      this.#reset();
    }
  }

  #reset() {
    this.#grabbing = GRAB_NONE;
    this.#hit = -1;
    this.#setCursor('auto');
    this.#repaint();
  }

  #drop() {
    if (this.#hit >= 0) {
      const part = this.#parts[this.#hit];
      const snap = this.#board.snap(part, this.#pointer.x, this.#pointer.y);
      if (snap && this.#isValidConnection(part, snap)) {
        /** @type Part */
        let part;
        // TODO: This must be synchronized with the GUI constructor
        switch (this.#hit) {
        case 0:
          part = new Inverter(new HighZ());
          break;
        case 1:
          part = new And(new HighZ(), new HighZ());
          break;
        case 2:
          part = new Nand(new HighZ(), new HighZ());
          break;
        case 3:
          part = new Or(new HighZ(), new HighZ());
          break;
        case 4:
          part = new Nor(new HighZ(), new HighZ());
          break;
        default:
          throw new Error(`Invalid GUI part index: ${this.#hit}`);
        }
        this.#board.addPart(part, snap);
      }
    }
  }

  /**
   * @arg {Part} part - Part whose connection will be validated.
   * @arg {SnapPoint} snap - Where the part wants to go.
   * @return {Boolean}
   */
  #isValidConnection(part, snap) {
    // Check for overlapping parts
    if (this.#board.partOverlaps(part, snap)) {
      return false;
    }

    // Ensure the outputs are not going to connect to other outputs
    if (this.#board.partOutputConflicts(part, snap)) {
      return false;
    }

    return true;
  }
}
