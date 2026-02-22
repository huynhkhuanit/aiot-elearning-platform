/**
 * Entry point - polyfills PHẢI chạy trước (dùng require, không dùng import).
 * Import bị hoisted nên nếu dùng import polyfill, các module khác có thể load trước.
 */
require('./polyfills');
require('./AppEntry');
