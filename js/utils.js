/** @arg {String} selector - Element query selector */
export function $(selector) {
  return document.querySelector(selector);
}

/** @arg {String} selector - Element query selector */
export function $$(selector) {
  return document.querySelectorAll(selector);
}

export const TAU = Math.PI * 2;
