/**
 * Polyfills cho React Native - FormData và WebSocket.
 * Chạy TRƯỚC mọi module (index.js dùng require('./polyfills') đầu tiên).
 *
 * Lý do: "[runtime not ready]" - một số thư viện (Supabase realtime, whatwg-fetch)
 * truy cập FormData/WebSocket khi load, nhưng React Native chưa khởi tạo xong.
 */
const g = typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : this;

// FormData - polyfill thuần JS, không phụ thuộc native
if (typeof g.FormData === 'undefined') {
  class FormDataPolyfill {
    constructor() {
      this._entries = [];
    }
    append(name, value, filename) {
      this._entries.push([String(name), value, filename]);
    }
    delete(name) {
      this._entries = this._entries.filter(([k]) => k !== String(name));
    }
    get(name) {
      const entry = this._entries.find(([k]) => k === String(name));
      return entry ? entry[1] : null;
    }
    getAll(name) {
      return this._entries.filter(([k]) => k === String(name)).map(([, v]) => v);
    }
    has(name) {
      return this._entries.some(([k]) => k === String(name));
    }
    set(name, value, filename) {
      this.delete(name);
      this.append(name, value, filename);
    }
    entries() {
      return makeIterator(this._entries.map(([k, v]) => [k, v]));
    }
    keys() {
      return makeIterator(this._entries.map(([k]) => k));
    }
    values() {
      return makeIterator(this._entries.map(([, v]) => v));
    }
    forEach(callback, thisArg) {
      this._entries.forEach(([k, v]) => callback.call(thisArg, v, k, this));
    }
  }
  function makeIterator(arr) {
    let i = 0;
    return {
      next() {
        return i < arr.length ? { value: arr[i++], done: false } : { value: undefined, done: true };
      },
      [Symbol.iterator]() {
        return this;
      },
    };
  }
  FormDataPolyfill.prototype[Symbol.iterator] = function () {
    return this.entries();
  };
  g.FormData = FormDataPolyfill;
}

// WebSocket - lazy-load từ React Native (tránh "runtime not ready" khi native module chưa init)
if (typeof g.WebSocket === 'undefined') {
  let RNWebSocket = null;
  function getRNWebSocket() {
    if (!RNWebSocket) {
      try {
        RNWebSocket = require('react-native/Libraries/WebSocket/WebSocket').default;
      } catch (e) {
        throw new Error(
          'WebSocket polyfill: React Native WebSocket chưa sẵn sàng. ' +
            'Thử reload app (R,R) hoặc kiểm tra native modules. ' +
            (e && e.message ? e.message : String(e))
        );
      }
    }
    return RNWebSocket;
  }
  g.WebSocket = function WebSocket(url, protocols, options) {
    return new (getRNWebSocket())(url, protocols, options);
  };
  g.WebSocket.CONNECTING = 0;
  g.WebSocket.OPEN = 1;
  g.WebSocket.CLOSING = 2;
  g.WebSocket.CLOSED = 3;
}
