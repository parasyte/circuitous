import { Board } from './board.js';
import { GRID_SIZE } from './consts.js';
import { Graph } from './graph.js';
import { $, Debounce } from './utils.js';

export class Circuitous {
  /** @type {CanvasRenderingContext2D} */
  #ctx;

  /** @type {DOMMatrix} */
  #mtx;

  /** @type {Board} */
  #board;

  /** @type {Graph<Part, Trace>} */
  #graph;

  /** @type {Boolean} */
  #repaint;

  /** @type {DOMHighResTimeStamp} */
  #ts;

  /** @arg {String} id - Parent canvas element ID. */
  constructor(id) {
    this.#board = new Board();
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

    this.#mtx = new DOMMatrix();

    const debounce_resize = new Debounce(this.#resize.bind(this), 100);
    window.addEventListener('resize', debounce_resize.call.bind(debounce_resize));
    this.#resize();

    this.#repaint = true;
    this.#ts = performance.now();
    window.requestAnimationFrame(this.#animate.bind(this));
  }

  /** @arg {DOMHighResTimeStamp} delta - Time delta for animations. */
  #draw(delta) {
    this.#ctx.clearRect(0, 0, this.#ctx.canvas.width, this.#ctx.canvas.height);

    this.#ctx.setTransform(this.#mtx);
    this.#board.draw(this.#ctx, delta);
    this.#ctx.resetTransform();
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

  #resize() {
    // Keep canvas sized to viewport.
    this.#ctx.canvas.style.width = `${window.innerWidth}px`;
    this.#ctx.canvas.style.height = `${window.innerHeight}px`;

    const scale = window.devicePixelRatio;

    this.#ctx.canvas.width = Math.floor(window.innerWidth * scale);
    this.#ctx.canvas.height = Math.floor(window.innerHeight * scale);

    // Center board on canvas.
    const width = (this.#board.width + 2) * GRID_SIZE;
    const height = (this.#board.height + 4) * GRID_SIZE;
    const x = (window.innerWidth - width) / 2 * scale;
    const y = (window.innerHeight - height) / 2 * scale;

    this.#mtx = new DOMMatrix([scale, 0, 0, scale, x, y]);
    this.#repaint = true;
  }
}
