import { GRID_SIZE, HOLE_SIZE } from './consts.js';

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
   * @arg {DrawOptions} [_options] - Drawing options.
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
   * @arg {DrawOptions} [_options] - Drawing options.
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

  /** @arg {Part} input - Input. */
  constructor(input) {
    super();
    this.#input = input;
  }

  /** @return {Number} */
  output() {
    return this.#input.output();
  }

  /** @arg {Part} input - New input. */
  setInput(input) {
    this.#input = input;
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
   * @arg {DrawOptions} [_options] - Drawing options.
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
    super();
    this.a = a;
    this.b = b;
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
}

export class Or extends Gate {
  /** @return {Number} */
  output() {
    return this.a.output() | this.b.output();
  }
}

export class Xor extends Gate {
  /** @return {Number} */
  output() {
    return this.a.output() ^ this.b.output();
  }
}

class InvertedGate extends Part {
  /** @type {Part} */
  input;

  /**
   * @arg {Part} gate - Gate to be inverted.
   */
  constructor(gate) {
    super();
    this.input = new Inverter(gate);
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

  toggle() {
    this.#state = !this.#state;
  }
}
