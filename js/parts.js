import { GRID_SIZE, HALF_GRID, QUART_GRID } from './consts.js';
import * as symbols from './symbols.js';

const SYM_WIDTH = GRID_SIZE / 3 * 2;
const SYM_HEIGHT = GRID_SIZE / 3 * 2;

export class DrawOptions {
  /** @type {DOMPoint[]} */
  #inputs;

  /** @type {DOMPoint[]} */
  #outputs;

  /** @type {Boolean} */
  center;

  /**
   * @arg {DOMPoint[]} inputs - List of all inputs.
   * @arg {DOMPoint[]} outputs - List of all outputs.
   */
  constructor(inputs, outputs) {
    this.#inputs = inputs;
    this.#outputs = outputs;
    this.center = false;
  }

  /** @return {DrawOptions} */
  static centered() {
    const options =  new DrawOptions([], []);
    options.center = true;

    return options;
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

export class Part {
  /** @type {Number} */
  pins;

  /** @type {Number} */
  width;

  /** @type {Number} */
  height;

  /**
   * @arg {Number} pins - Number of pins.
   * @arg {Number} width - Part width in pixels.
   * @arg {Number} height - Part height in pixels.
   */
  constructor(pins, width, height) {
    this.pins = pins;
    this.width = width;
    this.height = height;
  }

  /** @return {Number[]} */
  inputPins() {
    throw new Error('No inputs on a generic Part');
  }

  /** @return {Number[]} */
  outputPins() {
    throw new Error('No outputs on a generic Part');
  }

  /** @return {Number} */
  output() {
    throw new Error('Attempt to output high-Z');
  }

  /** @return {String} */
  get name() {
    throw new Error('Unnamed part');
  }

  /**
   * @arg {CanvasRenderingContext2D} _ctx - Canvas context.
   * @arg {DOMHighResTimeStamp} _delta - Time delta for animations.
   * @arg {DrawOptions} [_options] - Drawing options.
   */
  draw(_ctx, _delta, _options) {
    throw new Error('TODO');
  }

  /**
   * @arg {Number} x - X coordinate.
   * @arg {Number} y - Y coordinate.
   * @return {Boolean}
   */
  hitTest(x, y) {
    const halfWidth = this.width / 2;
    const halfHeight = this.height / 2;

    return x >= -halfWidth && y >= -halfHeight && x < halfWidth && y < halfHeight;
  }

  /**
   * @arg {CanvasRenderingContext2D} ctx - Canvas context.
   * @arg {DrawOptions} [options] - Drawing options.
   */
  applyOrigin(ctx, options) {
    if (options && options.center) {
      ctx.translate(-this.width / 2, -this.height / 2);
    } else {
      ctx.translate(-HALF_GRID, -HALF_GRID);
    }
  }
}

export class Low extends Part {
  constructor() {
    super(0, 0, 0);
  }

  /** @return {Number} */
  output() {
    return 0;
  }

  /** @return {String} */
  get name() {
    return 'Low';
  }
}

export class High extends Part {
  constructor() {
    super(0, 0, 0);
  }

  /** @return {Number} */
  output() {
    return 1;
  }

  /** @return {String} */
  get name() {
    return 'High';
  }
}

export class HighZ extends Part {
  constructor() {
    super(0, 0, 0);
  }

  /** @return {String} */
  get name() {
    return 'High-Z';
  }
}

export class Wire extends Part {
  /** @type {Part} */
  #input;

  /** @type {String} */
  #color;

  /**
   * @arg {Part} input - Input.
   * @arg {String} color - Wire color.
   */
  constructor(input, color) {
    const pins = 2;
    super(pins, 0, 0);
    this.#input = input;
    this.#color = color;
  }

  /** @return {Number[]} */
  inputPins() {
    return [0];
  }

  /** @return {Number[]} */
  outputPins() {
    return [1];
  }

  /** @return {Number} */
  output() {
    return this.#input.output();
  }

  /** @return {String} */
  get name() {
    return 'Wire';
  }

  /**
   * @arg {CanvasRenderingContext2D} ctx - Canvas context.
   * @arg {DOMHighResTimeStamp} _delta - Time delta for animations.
   * @arg {DrawOptions} [options] - Drawing options.
   */
  draw(ctx, _delta, options) {
    ctx.save();
    ctx.strokeStyle = this.#color;
    ctx.lineWidth = 10;

    ctx.beginPath();
    const start = (options && options.inputs[0]) || new DOMPoint();
    ctx.moveTo(start.x, start.y);
    const end = (options && options.outputs[0]) || new DOMPoint();
    ctx.bezierCurveTo(start.x + 10, start.y, end.x - 10, end.y, end.x, end.y); // TODO
    ctx.closePath();

    ctx.stroke();
    ctx.restore();

    throw new Error('TODO');
  }
}

export class Buffer extends Part {
  /** @type {Part} */
  #input;

  /** @arg {Part} input - Input. */
  constructor(input) {
    const pins = 2;
    super(pins, GRID_SIZE * pins, GRID_SIZE);
    this.#input = input;
  }

  /** @return {Number[]} */
  inputPins() {
    return [0];
  }

  /** @return {Number[]} */
  outputPins() {
    return [1];
  }

  /** @return {Number} */
  output() {
    return this.#input.output();
  }

  /** @return {String} */
  get name() {
    return 'Buffer';
  }

  /**
   * @arg {CanvasRenderingContext2D} ctx - Canvas context.
   * @arg {DOMHighResTimeStamp} [_delta] - Time delta for animations.
   * @arg {DrawOptions} [options] - Drawing options.
   */
  draw(ctx, _delta, options) {
    ctx.save();

    this.applyOrigin(ctx, options);
    symbols.body(ctx, this.width, this.height);

    ctx.translate(GRID_SIZE, HALF_GRID);
    symbols.triangle(ctx, SYM_WIDTH, SYM_HEIGHT);

    ctx.translate(-SYM_WIDTH / 2, 0);
    symbols.input(ctx, QUART_GRID);

    ctx.translate(SYM_WIDTH + GRID_SIZE * 0.2, 0);
    symbols.output(ctx, QUART_GRID);

    ctx.restore();
  }

  /** @arg {Part} input - New input. */
  setInput(input) {
    this.#input = input;
  }
}

export class Led extends Buffer {
  /** @return {String} */
  get name() {
    return 'LED';
  }
}

export class Inverter extends Buffer {
  /** @return {Number} */
  output() {
    return super.output() ? 0 : 1;
  }

  /** @return {String} */
  get name() {
    return 'Inverter';
  }

  /**
   * @arg {CanvasRenderingContext2D} ctx - Canvas context.
   * @arg {DOMHighResTimeStamp} [_delta] - Time delta for animations.
   * @arg {DrawOptions} [options] - Drawing options.
   */
  draw(ctx, _delta, options) {
    ctx.save();

    this.applyOrigin(ctx, options);
    symbols.body(ctx, this.width, this.height);

    ctx.translate(GRID_SIZE, HALF_GRID);
    symbols.triangle(ctx, SYM_WIDTH, SYM_HEIGHT);

    ctx.translate(-SYM_WIDTH / 2, 0);
    symbols.input(ctx, QUART_GRID);

    ctx.translate(SYM_WIDTH + GRID_SIZE * 0.1, 0);
    symbols.circle(ctx, GRID_SIZE * 0.1);

    ctx.translate(GRID_SIZE * 0.1, 0);
    symbols.output(ctx, QUART_GRID);

    ctx.restore();
  }
}

class Gate extends Part {
  /** @type {Part} */
  a;

  /** @type {Part} */
  b;

  /**
   * @arg {Part} a - First input.
   * @arg {Part} b - Second input.
   */
  constructor(a, b) {
    const pins = 3;
    super(pins, GRID_SIZE * pins, GRID_SIZE);
    this.a = a;
    this.b = b;
  }

  /** @return {Number[]} */
  inputPins() {
    return [0, 1];
  }

  /** @return {Number[]} */
  outputPins() {
    return [2];
  }

  /** @arg {Part} input - New input. */
  setInputA(input) {
    this.a = input;
  }

  /** @arg {Part} input - New input. */
  setInputB(input) {
    this.b = input;
  }
}

export class And extends Gate {
  /** @return {Number} */
  output() {
    return this.a.output() & this.b.output();
  }

  /** @return {String} */
  get name() {
    return 'And';
  }

  /**
   * @arg {CanvasRenderingContext2D} ctx - Canvas context.
   * @arg {DOMHighResTimeStamp} [_delta] - Time delta for animations.
   * @arg {DrawOptions} [options] - Drawing options.
   */
  draw(ctx, _delta, options) {
    ctx.save();

    this.applyOrigin(ctx, options);
    symbols.body(ctx, this.width, this.height);

    ctx.translate(GRID_SIZE * 1.5, HALF_GRID);
    symbols.roundBox(ctx, SYM_WIDTH, SYM_HEIGHT);

    ctx.translate(-SYM_WIDTH / 2, -SYM_HEIGHT / 4);
    symbols.input(ctx, QUART_GRID);

    ctx.translate(0, SYM_HEIGHT / 2);
    symbols.input(ctx, QUART_GRID);

    ctx.translate(SYM_WIDTH, -SYM_HEIGHT / 4);
    symbols.output(ctx, QUART_GRID);

    ctx.restore();
  }
}

export class Or extends Gate {
  /** @return {Number} */
  output() {
    return this.a.output() | this.b.output();
  }

  /** @return {String} */
  get name() {
    return 'Or';
  }

  /**
   * @arg {CanvasRenderingContext2D} ctx - Canvas context.
   * @arg {DOMHighResTimeStamp} [_delta] - Time delta for animations.
   * @arg {DrawOptions} [options] - Drawing options.
   */
  draw(ctx, _delta, options) {
    ctx.save();

    this.applyOrigin(ctx, options);
    symbols.body(ctx, this.width, this.height);

    ctx.translate(GRID_SIZE * 1.5, HALF_GRID);
    symbols.bullet(ctx, SYM_WIDTH, SYM_HEIGHT);

    ctx.translate(-SYM_WIDTH / 2, -SYM_HEIGHT / 4);
    symbols.input(ctx, QUART_GRID);

    ctx.translate(0, SYM_HEIGHT / 2);
    symbols.input(ctx, QUART_GRID);

    ctx.translate(SYM_WIDTH, -SYM_HEIGHT / 4);
    symbols.output(ctx, QUART_GRID);

    ctx.restore();
  }
}

export class Xor extends Gate {
  /** @return {Number} */
  output() {
    return this.a.output() ^ this.b.output();
  }

  /** @return {String} */
  get name() {
    return 'Xor';
  }
}

class InvertedGate extends Part {
  /** @type {Part} */
  input;

  /**
   * @arg {Part} gate - Gate to be inverted.
   */
  constructor(gate) {
    const pins = 3;
    super(pins, GRID_SIZE * pins, GRID_SIZE);
    this.input = new Inverter(gate);
  }

  /** @return {Number[]} */
  inputPins() {
    return [0, 1];
  }

  /** @return {Number[]} */
  outputPins() {
    return [2];
  }
}

export class Nand extends InvertedGate {
  /**
   * @arg {Part} a - First input.
   * @arg {Part} b - Second input.
   */
  constructor(a, b) {
    super(new And(a, b));
  }

  /** @return {Number} */
  output() {
    return this.input.output();
  }

  /** @return {String} */
  get name() {
    return 'Nand';
  }

  /**
   * @arg {CanvasRenderingContext2D} ctx - Canvas context.
   * @arg {DOMHighResTimeStamp} [_delta] - Time delta for animations.
   * @arg {DrawOptions} [options] - Drawing options.
   */
  draw(ctx, _delta, options) {
    ctx.save();

    this.applyOrigin(ctx, options);
    symbols.body(ctx, this.width, this.height);

    ctx.translate(GRID_SIZE * 1.5, HALF_GRID);
    symbols.roundBox(ctx, SYM_WIDTH, SYM_HEIGHT);

    ctx.translate(-SYM_WIDTH / 2, -SYM_HEIGHT / 4);
    symbols.input(ctx, QUART_GRID);

    ctx.translate(0, SYM_HEIGHT / 2);
    symbols.input(ctx, QUART_GRID);

    ctx.translate(SYM_WIDTH + GRID_SIZE * 0.1, -SYM_HEIGHT / 4);
    symbols.circle(ctx, GRID_SIZE * 0.1);

    ctx.translate(GRID_SIZE * 0.1, 0);
    symbols.output(ctx, QUART_GRID);

    ctx.restore();
  }
}

export class Nor extends InvertedGate {
  /**
   * @arg {Part} a - First input.
   * @arg {Part} b - Second input.
   */
  constructor(a, b) {
    super(new Or(a, b));
  }

  /** @return {Number} */
  output() {
    return this.input.output();
  }

  /** @return {String} */
  get name() {
    return 'Nor';
  }

  /**
   * @arg {CanvasRenderingContext2D} ctx - Canvas context.
   * @arg {DOMHighResTimeStamp} [_delta] - Time delta for animations.
   * @arg {DrawOptions} [options] - Drawing options.
   */
  draw(ctx, _delta, options) {
    ctx.save();

    this.applyOrigin(ctx, options);
    symbols.body(ctx, this.width, this.height);

    ctx.translate(GRID_SIZE * 1.5, HALF_GRID);
    symbols.bullet(ctx, SYM_WIDTH, SYM_HEIGHT);

    ctx.translate(-SYM_WIDTH / 2, -SYM_HEIGHT / 4);
    symbols.input(ctx, QUART_GRID);

    ctx.translate(0, SYM_HEIGHT / 2);
    symbols.input(ctx, QUART_GRID);

    ctx.translate(SYM_WIDTH + GRID_SIZE * 0.1, -SYM_HEIGHT / 4);
    symbols.circle(ctx, GRID_SIZE * 0.1);

    ctx.translate(GRID_SIZE * 0.1, 0);
    symbols.output(ctx, QUART_GRID);

    ctx.restore();
  }
}

export class Xnor extends InvertedGate {
  /**
   * @arg {Part} a - First input.
   * @arg {Part} b - Second input.
   */
  constructor(a, b) {
    super(new Xor(a, b));
  }

  /** @return {Number} */
  output() {
    return this.input.output();
  }

  /** @return {String} */
  get name() {
    return 'Xnor';
  }
}

export class Switch extends Gate {
  /** @type {Boolean} */
  #state;

  /**
   * @arg {Part} a - First input.
   * @arg {Part} b - Second input.
   */
  constructor(a, b) {
    super(a, b);
    this.#state = false;
  }

  /** @return {Number} */
  output() {
    return this.#state ? this.b.output() : this.a.output();
  }

  /** @return {String} */
  get name() {
    return 'Switch';
  }

  toggle() {
    this.#state = !this.#state;
  }
}
