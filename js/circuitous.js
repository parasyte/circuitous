import { Board } from './board.js';
import { GRID_SIZE } from './consts.js';
import { Graph } from './graph.js';
import { Gui } from './gui.js';
import { Part, Trace } from './parts.js';
import { $, Debounce } from './utils.js';

export class Circuitous {
  /** @type {CanvasRenderingContext2D} */
  #ctx;

  /** @type {Gui} */
  #gui;

  /** @type {DOMPoint} */
  #guiPos;

  /** @type {Board} */
  #board;

  /** @type {DOMPoint} */
  #boardPos;

  /** @type {Graph<Part, Trace>} */
  #graph;

  /** @type {Boolean} */
  #repaint;

  /** @type {DOMHighResTimeStamp} */
  #ts;

  /** @arg {String} id - Parent canvas element ID. */
  constructor(id) {
    this.#gui = new Gui();
    this.#guiPos = new DOMPoint();

    this.#board = new Board();
    this.#boardPos = new DOMPoint();

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

  /** @arg {DOMHighResTimeStamp} delta - Time delta for animations. */
  #draw(delta) {
    this.#ctx.clearRect(0, 0, this.#ctx.canvas.width, this.#ctx.canvas.height);

    this.#ctx.translate(this.#guiPos.x, this.#guiPos.y);
    this.#gui.draw(this.#ctx, delta);
    this.#ctx.translate(-this.#guiPos.x, -this.#guiPos.y);

    this.#ctx.translate(this.#boardPos.x, this.#boardPos.y);
    this.#board.draw(this.#ctx, delta);
    this.#ctx.translate(-this.#boardPos.x, -this.#boardPos.y);
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
    const width = (this.#board.width + 2) * GRID_SIZE;
    const height = (this.#board.height + 4) * GRID_SIZE;
    this.#boardPos = new DOMPoint(
      (window.innerWidth - width) / 2,
      (window.innerHeight - height) / 2,
    );

    // Center GUI on canvas.
    this.#guiPos = new DOMPoint(
      (window.innerWidth - this.#gui.width) / 2,
      Math.max((window.innerHeight - height) / 2 - GRID_SIZE * 7, 0),
    );

    this.#repaint = true;
  }
}
