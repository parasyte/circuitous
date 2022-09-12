import { GRID_SIZE, HALF_GRID, HOLE_SIZE, TAU } from './consts.js';

const RAIL_HEIGHT = 55;

export class DrawOptions {
  /** @type {DOMPoint[]} */
  #inputs;

  /** @type {DOMPoint[]} */
  #outputs;

  /**
   * @arg {DOMPoint[]} inputs - List of all inputs.
   * @arg {DOMPoint[]} outputs - List of all outputs.
   */
  constructor(inputs, outputs) {
    this.#inputs = inputs;
    this.#outputs = outputs;
  }

  /** @return {DOMPoint[]} */
  get inputs() {
    return this.#inputs;
  }

  /** @return {DOMPoint[]} */
  get outputs() {
    return this.#outputs;
  }
}

export class PowerRail {
  /** @type {Number} */
  #width;

  /** @type {Number} */
  #board_width;

  /** @type {Boolean} */
  #top;

  /**
   * @arg {Number} width - Power Rail outputs.
   * @arg {Number} board_width - board width.
   * @arg {Boolean} top - Draw with offset from top or bottom.
   */
  constructor(width, board_width, top) {
    this.#width = width;
    this.#board_width = board_width;
    this.#top = top;
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
   * @arg {DOMHighResTimeStamp} _delta - Time delta for animations.
   * @arg {DrawOptions} _options - Drawing options.
   */
  draw(ctx, _delta, _options) {
    ctx.translate(0, this.#top ? -RAIL_HEIGHT : 0);

    // Base
    ctx.fillStyle = 'gray';
    ctx.fillRect(0, 0, this.#board_width, RAIL_HEIGHT);

    // Edge separators
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, this.#board_width, 2);
    ctx.fillRect(0, RAIL_HEIGHT - 2, this.#board_width, 2);

    // Positive label
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
    ctx.lineTo(this.#board_width - 30, 10);

    // Right plus
    ctx.moveTo(this.#board_width - 15, 5);
    ctx.lineTo(this.#board_width - 15, 15);
    ctx.moveTo(this.#board_width - 20, 10);
    ctx.lineTo(this.#board_width - 10, 10);
    ctx.closePath();

    ctx.stroke();

    // Negative label
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgb(0, 0, 192)';
    ctx.beginPath();

    // Left minus
    ctx.moveTo(10, 45);
    ctx.lineTo(20, 45);

    // Line
    ctx.moveTo(30, 45);
    ctx.lineTo(this.#board_width - 30, 45);

    // Right minus
    ctx.moveTo(this.#board_width - 20, 45);
    ctx.lineTo(this.#board_width - 10, 45);
    ctx.closePath();

    ctx.stroke();

    // Positive inner trace
    ctx.strokeStyle = 'rgba(192, 0, 0, 0.2)';
    ctx.lineWidth = HOLE_SIZE * 1.5;
    {
      const x1 = 35;
      const x2 = (this.#width / 5 * 6 - 2) * GRID_SIZE + 35;
      const y = GRID_SIZE;

      ctx.beginPath();
      ctx.moveTo(x1, y);
      ctx.lineTo(x2, y);
      ctx.closePath();
      ctx.stroke();
    }

    // Negative inner trace
    ctx.strokeStyle = 'rgba(0, 0, 192, 0.2)';
    ctx.lineWidth = HOLE_SIZE * 1.5;
    {
      const x1 = 35;
      const x2 = (this.#width / 5 * 6 - 2) * GRID_SIZE + 35;
      const y = GRID_SIZE * 2;

      ctx.beginPath();
      ctx.moveTo(x1, y);
      ctx.lineTo(x2, y);
      ctx.closePath();
      ctx.stroke();
    }

    // Holes
    ctx.fillStyle = 'black';
    for (const j of [1, 2]) {
      for (let i = 0; i < this.#width; i++) {
        const g = Math.floor(i / 5);
        const x = (i + g) * GRID_SIZE + 35;
        const y = j * GRID_SIZE;

        ctx.beginPath();
        ctx.arc(x, y, HOLE_SIZE, 0, TAU);
        ctx.closePath();
        ctx.fill();
      }
    }
  }
}

export class Trace {
  /** @type {String} */
  #color;

  /**
   * @arg {String} color - Wire color.
   */
  constructor(color) {
    this.#color = color;
  }

  /**
   * @arg {CanvasRenderingContext2D} ctx - Canvas context.
   * @arg {DOMHighResTimeStamp} _delta - Time delta for animations.
   * @arg {DrawOptions} _options - Drawing options.
   */
  draw(ctx, _delta, _options) {
    ctx.strokeStyle = this.#color;
    ctx.lineWidth = HOLE_SIZE * 1.5;

    const y = 4 * GRID_SIZE;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, y);
    ctx.closePath();
    ctx.stroke();
  }
}

export class Part {
  /** @return {Number} */
  output() {
    throw new Error('Attempt to output high-Z');
  }

  /**
   * @arg {CanvasRenderingContext2D} _ctx - Canvas context.
   * @arg {DOMHighResTimeStamp} _delta - Time delta for animations.
   * @arg {DrawOptions} _options - Drawing options.
   */
  draw(_ctx, _delta, _options) {
    throw new Error('TODO');
  }
}

export class Low extends Part {
  /** @return {Number} */
  output() {
    return 0;
  }
}

export class High extends Part {
  /** @return {Number} */
  output() {
    return 1;
  }
}

export class Buffer extends Part {
  /** @type {Part} */
  #input;

  /**
   * @arg {Part} input - Input.
   */
  constructor(input) {
    super();
    this.#input = input;
  }

  /** @return {Number} */
  output() {
    return this.#input.output();
  }
}

export class Wire extends Buffer {
  /** @type {String} */
  #color;

  /**
   * @arg {Part} input - Input.
   * @arg {String} color - Wire color.
   */
  constructor(input, color) {
    super(input);
    this.#color = color;
  }

  /**
   * @arg {CanvasRenderingContext2D} ctx - Canvas context.
   * @arg {DOMHighResTimeStamp} _delta - Time delta for animations.
   * @arg {DrawOptions} options - Drawing options.
   */
  draw(ctx, _delta, options) {
    ctx.save();
    ctx.strokeStyle = this.#color;
    ctx.lineWidth = 10;

    ctx.beginPath();
    const start = options.inputs[0];
    ctx.moveTo(start.x, start.y);
    const end = options.outputs[0];
    ctx.bezierCurveTo(start.x + 10, start.y, end.x - 10, end.y, end.x, end.y); // TODO
    ctx.closePath();

    ctx.stroke();
    ctx.restore();

    throw new Error('TODO');
  }
}

export class Led extends Buffer {
  /**
   * @arg {CanvasRenderingContext2D} _ctx - Canvas context.
   * @arg {DOMHighResTimeStamp} _delta - Time delta for animations.
   * @arg {DrawOptions} _options - Drawing options.
   */
  draw(_ctx, _delta, _options) {
    throw new Error('TODO');
  }
}

export class Inverter extends Buffer {
  /** @return {Number} */
  output() {
    return super.output() ? 0 : 1;
  }
}

export class And extends Part {
  /** @type {Part} */
  #a;

  /** @type {Part} */
  #b;

  /**
   * @arg {Part} a - First input.
   * @arg {Part} b - Second input.
   */
  constructor(a, b) {
    super();
    this.#a = a;
    this.#b = b;
  }

  /** @return {Number} */
  output() {
    return this.#a.output() & this.#b.output();
  }
}

export class Or extends Part {
  /** @type {Part} */
  #a;

  /** @type {Part} */
  #b;

  /**
   * @arg {Part} a - First input.
   * @arg {Part} b - Second input.
   */
  constructor(a, b) {
    super();
    this.#a = a;
    this.#b = b;
  }

  /** @return {Number} */
  output() {
    return this.#a.output() | this.#b.output();
  }
}

export class Xor extends Part {
  /** @type {Part} */
  #a;

  /** @type {Part} */
  #b;

  /**
   * @arg {Part} a - First input.
   * @arg {Part} b - Second input.
   */
  constructor(a, b) {
    super();
    this.#a = a;
    this.#b = b;
  }

  /** @return {Number} */
  output() {
    return this.#a.output() ^ this.#b.output();
  }
}

export class Nand extends Part {
  /** @type {Part} */
  #input;

  /**
   * @arg {Part} a - First input.
   * @arg {Part} b - Second input.
   */
  constructor(a, b) {
    super();
    this.#input = new Inverter(new And(a, b));
  }

  /** @return {Number} */
  output() {
    return this.#input.output();
  }
}

export class Nor extends Part {
  /** @type {Part} */
  #input;

  /**
   * @arg {Part} a - First input.
   * @arg {Part} b - Second input.
   */
  constructor(a, b) {
    super();
    this.#input = new Inverter(new Or(a, b));
  }

  /** @return {Number} */
  output() {
    return this.#input.output();
  }
}

export class Xnor extends Part {
  /** @type {Part} */
  #input;

  /**
   * @arg {Part} a - First input.
   * @arg {Part} b - Second input.
   */
  constructor(a, b) {
    super();
    this.#input = new Inverter(new Xor(a, b));
  }

  /** @return {Number} */
  output() {
    return this.#input.output();
  }
}

export class Switch extends Part {
  /** @type {Part} */
  #a;

  /** @type {Part} */
  #b;

  /** @type {Boolean} */
  #state;

  /**
   * @arg {Part} a - First input.
   * @arg {Part} b - Second input.
   */
  constructor(a, b) {
    super();
    this.#a = a;
    this.#b = b;
    this.#state = false;
  }

  /** @return {Number} */
  output() {
    return this.#state ? this.#b.output() : this.#a.output();
  }

  toggle() {
    this.#state = !this.#state;
  }
}
