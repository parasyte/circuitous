import { Board, Trace } from './board.js';
import { GRID_SIZE } from './consts.js';
import { Graph } from './graph.js';
import { Gui } from './gui.js';
import { Part } from './parts.js';
import { $, Debounce } from './utils.js';

export class Circuitous {
  /** @type {CanvasRenderingContext2D} */
  #ctx;

  /** @type {Gui} */
  #gui;

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

    this.#board = new Board();
    this.#gui = new Gui(canvas, this.#board, this.#requestRepaint.bind(this));
    this.#graph = new Graph();

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

    this.#board.draw(this.#ctx, delta);
    this.#gui.draw(this.#ctx, delta);
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

    // Set context to high resolution with the normal logical pixel size.
    const scale = window.devicePixelRatio;
    this.#ctx.canvas.width = Math.floor(window.innerWidth * scale);
    this.#ctx.canvas.height = Math.floor(window.innerHeight * scale);
    this.#ctx.setTransform(new DOMMatrix([scale, 0, 0, scale, 0, 0]));

    // Center board on canvas.
    const height = (this.#board.height + 4) * GRID_SIZE;
    this.#board.pos = new DOMPoint(
      (window.innerWidth - (this.#board.width + 2) * GRID_SIZE) / 2,
      (window.innerHeight - height) / 2,
    );

    // Center GUI on canvas.
    this.#gui.pos = new DOMPoint(
      (window.innerWidth - this.#gui.width) / 2,
      Math.max((window.innerHeight - height) / 2 - GRID_SIZE * 7, 0),
    );

    this.#repaint = true;
  }

  #requestRepaint() {
    this.#repaint = true;
  }
}
