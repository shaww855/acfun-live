/**
 * 等待诺干毫秒
 * @param {Number} ms 毫秒
 * @returns
 */
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
