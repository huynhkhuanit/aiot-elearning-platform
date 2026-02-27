/**
 * Polyfills cho React Native - globals cần thiết cho thư viện web.
 * Chạy TRƯỚC mọi module (index.js dùng require('./polyfills') đầu tiên).
 *
 * Lý do: "[runtime not ready]" - nhiều thư viện (Supabase, Tamagui, LogBox...)
 * truy cập window/FormData/WebSocket khi load, nhưng RN chưa khởi tạo xong.
 */
const g =
    typeof global !== "undefined"
        ? global
        : typeof self !== "undefined"
          ? self
          : this;

// window - nhiều thư viện dùng window (browser API), RN không có sẵn
if (typeof g.window === "undefined") {
    g.window = g;
}

// window.location - @react-navigation/stack và một số lib truy cập location.href
if (
    typeof g.window !== "undefined" &&
    typeof g.window.location === "undefined"
) {
    g.window.location = {
        href: "",
        pathname: "/",
        search: "",
        hash: "",
        origin: "",
        host: "",
        hostname: "",
        port: "",
        protocol: "file:",
        assign: () => {},
        replace: () => {},
        reload: () => {},
    };
}

// globalThis - chuẩn ES2020
if (typeof g.globalThis === "undefined") {
    g.globalThis = g;
}

// document - stub tối thiểu (một số lib check document.createElement, document.body, getElementById...)
if (typeof g.document === "undefined") {
    g.document = {
        createElement: () => ({}),
        getElementById: () => null,
        getElementsByClassName: () => [],
        getElementsByTagName: () => [],
        querySelector: () => null,
        querySelectorAll: () => [],
        body: {},
        documentElement: {},
        addEventListener: () => {},
        removeEventListener: () => {},
    };
}

// navigator - stub (một số lib check navigator.userAgent)
if (typeof g.navigator === "undefined") {
    g.navigator = { userAgent: "ReactNative" };
}

// setImmediate / clearImmediate - Node.js API (dùng bởi LogBox, promise polyfills, ...)
if (typeof g.setImmediate === "undefined") {
    g.setImmediate = function (fn) {
        return setTimeout(fn, 0);
    };
}
if (typeof g.clearImmediate === "undefined") {
    g.clearImmediate = function (id) {
        clearTimeout(id);
    };
}

// FormData - polyfill thuần JS, không phụ thuộc native
if (typeof g.FormData === "undefined") {
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
            return this._entries
                .filter(([k]) => k === String(name))
                .map(([, v]) => v);
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
            this._entries.forEach(([k, v]) =>
                callback.call(thisArg, v, k, this),
            );
        }
    }
    function makeIterator(arr) {
        let i = 0;
        return {
            next() {
                return i < arr.length
                    ? { value: arr[i++], done: false }
                    : { value: undefined, done: true };
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

// WebSocket - already global in modern React Native (SDK 49+), no polyfill needed.
// Previous deep import 'react-native/Libraries/WebSocket/WebSocket' is deprecated.
