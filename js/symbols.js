import { TAU } from './consts.js';

/*
 * All drawing functions use center origin and sizes measured in pixels.
 */

/**
 * @arg {CanvasRenderingContext2D} ctx - Canvas context.
 * @arg {Number} width - Body width.
 * @arg {Number} height - Body width.
 */
export function body(ctx, width, height) {
  ctx.lineWidth = 2;

  // Body background
  ctx.fillStyle = 'rgb(24, 24, 24)';
  ctx.fillRect(0, 0, width, height);

  // Shadow
  ctx.strokeStyle = 'rgb(8, 8, 8)';
  ctx.beginPath();
  ctx.moveTo(width, 0);
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.stroke();

  // Highlight
  ctx.strokeStyle = 'rgb(64, 64, 64)';
  ctx.beginPath();
  ctx.moveTo(0, height);
  ctx.lineTo(0, 0);
  ctx.lineTo(width, 0);
  ctx.stroke();
}

/** @arg {CanvasRenderingContext2D} ctx - Canvas context. */
function configureLines(ctx) {
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgb(160, 160, 160)';
}

/**
 * @arg {CanvasRenderingContext2D} ctx - Canvas context.
 * @arg {Number} length - Line length.
 */
export function input(ctx, length) {
  configureLines(ctx);

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-length, 0);
  ctx.closePath();
  ctx.stroke();
}

/**
 * @arg {CanvasRenderingContext2D} ctx - Canvas context.
 * @arg {Number} length - Line length.
 */
export function output(ctx, length) {
  configureLines(ctx);

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(length, 0);
  ctx.closePath();
  ctx.stroke();
}

/**
 * @arg {CanvasRenderingContext2D} ctx - Canvas context.
 * @arg {Number} width - Triangle width.
 * @arg {Number} height - Triangle width.
 */
export function triangle(ctx, width, height) {
  const halfWidth = width / 2;
  const halfHeight = height / 2;

  configureLines(ctx);

  ctx.beginPath();
  ctx.moveTo(-halfWidth, -halfHeight);
  ctx.lineTo(halfWidth, 0);
  ctx.lineTo(-halfWidth, halfHeight);
  ctx.closePath();
  ctx.stroke();
}

/**
 * @arg {CanvasRenderingContext2D} ctx - Canvas context.
 * @arg {Number} radius - Circle radius.
 */
export function circle(ctx, radius) {
  configureLines(ctx);

  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, TAU);
  ctx.stroke();
}

/**
 * @arg {CanvasRenderingContext2D} ctx - Canvas context.
 * @arg {Number} width - Triangle width.
 * @arg {Number} height - Triangle width.
 */
export function roundBox(ctx, width, height) {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const radius = Math.max(halfWidth, halfHeight);

  configureLines(ctx);

  ctx.beginPath();
  ctx.moveTo(-halfWidth, -halfHeight);
  ctx.arcTo(halfWidth, -halfHeight, halfWidth, 0, radius);
  ctx.arcTo(halfWidth, halfHeight, 0, halfHeight, radius);
  ctx.lineTo(-halfWidth, halfHeight);
  ctx.closePath();
  ctx.stroke();
}

/**
 * @arg {CanvasRenderingContext2D} ctx - Canvas context.
 * @arg {Number} width - Triangle width.
 * @arg {Number} height - Triangle width.
 */
export function bullet(ctx, width, height) {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const radius = Math.max(width, height);

  configureLines(ctx);

  ctx.beginPath();
  ctx.moveTo(-halfWidth, -halfHeight);
  ctx.arcTo(halfWidth / 2, -halfHeight, halfWidth, 0, radius);
  ctx.lineTo(halfWidth, 0);
  ctx.arcTo(halfWidth / 2, halfHeight, 0, halfHeight, radius);
  ctx.lineTo(-halfWidth, halfHeight);
  ctx.arcTo(-width * 0.4, 0, -halfWidth, -halfHeight, radius);
  ctx.closePath();
  ctx.stroke();
}
