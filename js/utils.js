/** @arg {String} selector - Element query selector */
export function $(selector) {
  return document.querySelector(selector);
}

/** @arg {String} selector - Element query selector */
export function $$(selector) {
  return document.querySelectorAll(selector);
}

export class Debounce {
  /** @type {Function} */
  #fn;

  /** @type {any[]} */
  #args;

  /** @type {Number} */
  #delay;

  /** @type {Number} */
  #timer;

  /**
   * @arg {Function} fn - Function reference to debounce.
   * @arg {Number} delay - How long (in milliseconds) the debouncer will wait for additional calls.
   * @arg {any[]} args - Function arguments.
   */
  constructor(fn, delay, ...args) {
    this.#fn = fn;
    this.#args = args;
    this.#delay = delay;
    this.#timer = 0;
  }

  call() {
    if (this.#timer) {
      clearTimeout(this.#timer);
    }

    this.#timer = setTimeout(() => this.#fn.apply(null, this.#args), this.#delay);
  }
}
