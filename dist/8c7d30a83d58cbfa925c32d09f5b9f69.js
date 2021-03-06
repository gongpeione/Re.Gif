// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles

require = (function (modules, cache, entry) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof require === "function" && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof require === "function" && require;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      function localRequire(x) {
        return newRequire(localRequire.resolve(x));
      }

      localRequire.resolve = function (x) {
        return modules[name][1][x] || x;
      };

      var module = cache[name] = new newRequire.Module;
      modules[name][0].call(module.exports, localRequire, module, module.exports);
    }

    return cache[name].exports;
  }

  function Module() {
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;

  for (var i = 0; i < entry.length; i++) {
    newRequire(entry[i]);
  }

  // Override the current require with this new one
  return newRequire;
})({9:[function(require,module,exports) {
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        // At least give some kind of context to the user
        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
        err.context = er;
        throw err;
      }
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],7:[function(require,module,exports) {
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var events_1 = require("events");
function dvSlice(dv, start, end) {
    var arr = new Uint8Array(end - start);
    var arrIndex = 0;
    for (var i = start; i < end; i++) {
        arr[arrIndex++] = dv.getUint8(i);
    }
    return arr;
}
function arrEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) {
        return false;
    }
    var l = arr1.length;
    return arr1.every(function (v, i) { return v === arr2[i]; });
}
function getGifSize(num) {
    var width = num.slice(0, 2).reverse().reduce(function (a, b) { return a + b; }, 0);
    var height = num.slice(2, 4).reverse().reduce(function (a, b) { return a + b; }, 0);
    return {
        width: width, height: height
    };
}
var GIF_HEADER = new Uint8Array([0x47, 0x49, 0x46]);
var gifBinIndex = {
    header: [0, 6],
    logicalScreenDescriptor: [6, 13],
    colorTable: [13]
};
var Gifer = /** @class */ (function (_super) {
    __extends(Gifer, _super);
    function Gifer(gif) {
        var _this = _super.call(this) || this;
        _this.fReader = new FileReader();
        _this.meta = {
            header: null,
            logicalScreenDescriptor: null,
            size: null,
            hasGlobalColorTable: null,
            colorRes: null,
            sort: null,
            globalColorTableSize: null,
            backgroundColorIndex: null,
            pixelAspectRatio: null,
            colorTable: [],
            graphicsControlExtension: null,
            gceSize: null,
            gcePacked: null,
            gceDelayTime: null,
            gceTransparentColorIndex: null
        };
        _this.file = gif;
        _this.fReader.readAsArrayBuffer(gif);
        _this.fReader.addEventListener('loadend', function (e) {
            _this.data = new DataView(_this.fReader.result);
            _this.fReader = null;
            _this.process();
        });
        return _this;
    }
    Gifer.prototype.process = function () {
        this.slice = dvSlice.bind(this, this.data);
        this.setMeta();
        var headerSliced = this.meta.header.slice(0, 3);
        if (!arrEqual(headerSliced, GIF_HEADER)) {
            throw new Error('This is not a gif file.');
        }
    };
    Gifer.prototype.setMeta = function () {
        this.meta.header = this.slice(gifBinIndex.header[0], gifBinIndex.header[1]);
        this.meta.logicalScreenDescriptor = this.slice(gifBinIndex.logicalScreenDescriptor[0], gifBinIndex.logicalScreenDescriptor[1]);
        this.meta.size = getGifSize(this.meta.logicalScreenDescriptor.slice(0, 4));
        var compressedBit = this.meta.logicalScreenDescriptor.slice(4, 5);
        this.meta.hasGlobalColorTable = !!(compressedBit >>> 7 & 0x1);
        if (this.meta.hasGlobalColorTable) {
            this.meta.colorRes = compressedBit >>> 4 & 0x7;
        }
        this.meta.sort = (compressedBit >>> 3 & 0x1) ? 'dec' : 'asc';
        this.meta.globalColorTableSize = Math.pow(2, ((compressedBit & 0x7) + 1));
        this.meta.backgroundColorIndex = this.meta.logicalScreenDescriptor.slice(5, 6);
        this.meta.pixelAspectRatio = this.meta.logicalScreenDescriptor.slice(6);
        var colorTableEnd = gifBinIndex.colorTable[0] + this.meta.globalColorTableSize * 3;
        var allColor = this.slice(gifBinIndex.colorTable[0], colorTableEnd);
        for (var i = 0; i < allColor.length; i += 3) {
            this.meta.colorTable.push([
                allColor[i],
                allColor[i + 1],
                allColor[i + 2]
            ]);
        }
        this.meta.graphicsControlExtension = this.slice(colorTableEnd, colorTableEnd + 8 + 1);
        this.meta.gceSize = this.meta.graphicsControlExtension.slice(2, 3);
        this.meta.gcePacked = this.meta.graphicsControlExtension.slice(3, 4);
        this.meta.gceDelayTime = this.meta.graphicsControlExtension.slice(4, 6);
        this.meta.gceTransparentColorIndex = this.meta.graphicsControlExtension.slice(6, 7);
    };
    return Gifer;
}(events_1.EventEmitter));
exports["default"] = Gifer;

},{"events":9}],8:[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.BeforeUpload = undefined;
exports.default = setBeforeUpload;

var _events = require("events");

function addEvents(target, names, cb) {
  if (!Array.isArray(names)) {
    target.addEventListener(names, cb);
    return;
  }
  names.forEach(name => {
    target.addEventListener(name, cb);
  });
}
const defaultOpt = {
  pasteOnDoc: true
};
class BeforeUpload extends _events.EventEmitter {
  constructor(container, flag, opt) {
    super();
    this.disabled = false;
    this.previews = [];
    this.handlers = {};
    this.container = document.querySelector(container) || document.body;
    this.flag = flag || BeforeUpload.ENABLE_CLICK | BeforeUpload.ENABLE_COPY_PASTE | BeforeUpload.ENABLE_DRAG;
    this.opt = Object.assign(opt, defaultOpt);
    this.inputEl = opt.inputEl || document.createElement('input');
    this.inputEl.type = 'file';
    this.inputEl.hidden = true;
    Object.keys(opt).forEach(attr => {
      if (attr in this.inputEl) {
        this.inputEl[attr] = opt[attr];
      }
    });
    this.process();
  }
  process() {
    this.setCapture();
    this.addEvents();
  }
  addEvents() {
    const addEventsListener = (names, cb, target) => {
      (Array.isArray(names) ? names : [names]).forEach(name => {
        if (!this.handlers[name]) {
          this.handlers[name] = [];
        }
        this.handlers[name].push(cb);
      });
      // const cbWrapped = (...args) => {
      //     if (this.disabled) return;
      //     cb(...args);
      // }
      addEvents.call(this, target || this.container, names, cb);
    };
    if (BeforeUpload.ENABLE_CLICK & this.flag) {
      const clickEventType = document.ontouchend !== null ? 'click' : 'touchend';
      addEventsListener(clickEventType, e => {
        this.emit(e.type);
        this.open();
      });
      addEventsListener('change', e => {
        this.files = e.target.files;
      }, this.inputEl);
    }
    if (BeforeUpload.ENABLE_COPY_PASTE & this.flag) {
      if (!('onpaste' in document)) {
        console.error('onpaste is not supported, try to update or change your browser.');
        return;
      }
      addEventsListener('paste', e => {
        console.log(e.clipboardData.files.length);
        this.emit(e.type);
        this.files = e.clipboardData.files;
      }, this.opt.pasteOnDoc ? document : this.container); // Recommend add paste event on document 
    }
    if (BeforeUpload.ENABLE_DRAG & this.flag) {
      addEventsListener(['dragover', 'dragleave'], e => {
        if (e.target !== this.container) return;
        e.preventDefault();
        this.emit(e.type);
      });
      addEventsListener('drop', e => {
        if (e.target !== this.container) return;
        e.preventDefault();
        this.emit(e.type);
        this.files = e.dataTransfer.files;
      });
    }
  }
  setCapture() {
    if (this.inputEl.capture) {
      return;
    }
    const accpet = this.inputEl.accept.toLowerCase();
    if (accpet.indexOf('image') > -1) {
      this.inputEl.capture = 'camera';
    } else if (accpet.indexOf('audio') > -1) {
      this.inputEl.capture = 'microphone';
    } else if (accpet.indexOf('video') > -1) {
      this.inputEl.capture = 'camcorder';
    }
  }
  onfile(e) {
    this.emit('file', this.files, e);
  }
  disable() {
    this.disabled = true;
    Object.keys(this.handlers).forEach(name => {
      const handlerArr = this.handlers[name];
      handlerArr.forEach(cb => {
        this.container.removeEventListener(name, cb);
      });
    });
    this.previews.forEach(url => URL.revokeObjectURL(url));
  }
  getPreviewList() {
    const accpet = this.inputEl.accept.toLowerCase();
    if (accpet.indexOf('image') === -1) {
      throw new Error('Only images supported.');
    }
    this.previews = Array.from(this.files, file => {
      return URL.createObjectURL(file);
    });
    return this.previews;
  }
  enable() {
    if (!this.disabled) return;
    this.disabled = false;
    this.addEvents();
  }
  open() {
    this.inputEl.value = '';
    this.inputEl.click();
  }
  get files() {
    return this._files;
  }
  set files(newVal) {
    this._files = newVal;
    this.emit('file', this.files);
  }
}
exports.BeforeUpload = BeforeUpload;
BeforeUpload.ENABLE_CLICK = 1;
BeforeUpload.ENABLE_COPY_PASTE = 2;
BeforeUpload.ENABLE_DRAG = 4;
function setBeforeUpload(container, flag, opt) {
  return new BeforeUpload(container, flag, opt || {});
}
;
//# sourceMappingURL=index.js.map
},{"events":9}],6:[function(require,module,exports) {
"use strict";
exports.__esModule = true;
var index_1 = require("./beforeUpload/src/index");
var Gif_1 = require("./Gif");
var $ = document.querySelector.bind(document);
var $$ = document.querySelectorAll.bind(document);
var inputEl = $('#upload');
var uploadArea = index_1["default"]('.upload-area', index_1.BeforeUpload.ENABLE_CLICK | index_1.BeforeUpload.ENABLE_DRAG | index_1.BeforeUpload.ENABLE_COPY_PASTE, { inputEl: inputEl });
var canvas = $('main canvas');
var ctx = canvas.getContext('2d');
uploadArea.on('file', function (f) {
    f = f[0];
    var img = new Image();
    img.src = URL.createObjectURL(f);
    console.log(new Gif_1["default"](f));
});

},{"./Gif":7,"./beforeUpload/src/index":8}],0:[function(require,module,exports) {
var global = (1,eval)('this');
var OldModule = module.bundle.Module;
function Module() {
  OldModule.call(this);
  this.hot = {
    accept: function (fn) {
      this._acceptCallback = fn || function () {};
    },
    dispose: function (fn) {
      this._disposeCallback = fn;
    }
  };
}

module.bundle.Module = Module;

if (!module.bundle.parent) {
  var ws = new WebSocket('ws://localhost:57820/');
  ws.onmessage = (e) => {
    var data = JSON.parse(e.data);

    if (data.type === 'update') {
      for (let asset of data.assets) {
        hmrApply(global.require, asset);
      }

      for (let asset of data.assets) {
        if (!asset.isNew) {
          hmrAccept(global.require, asset.id);
        }
      }
    }

    if (data.type === 'error-resolved') {
      console.log('[parcel] ✨ Error resolved');
    }

    if (data.type === 'error') {
      console.error(`[parcel] 🚨 ${data.error.message}\n${data.error.stack}`);
    }
  };
}

function getParents(bundle, id) {
  var modules = bundle.modules;
  if (!modules) {
    return [];
  }

  let parents = [];
  for (let k in modules) {
    for (let d in modules[k][1]) {
      let dep = modules[k][1][d];
      if (dep === id || (Array.isArray(dep) && dep[dep.length - 1] === id)) {
        parents.push(+k);
      }
    }
  }

  if (bundle.parent) {
    parents = parents.concat(getParents(bundle.parent, id));
  }

  return parents;
}

function hmrApply(bundle, asset) {
  var modules = bundle.modules;
  if (!modules) {
    return;
  }

  if (modules[asset.id] || !bundle.parent) {
    let fn = new Function('require', 'module', 'exports', asset.generated.js);
    asset.isNew = !modules[asset.id];
    modules[asset.id] = [fn, asset.deps];
  } else if (bundle.parent) {
    hmrApply(bundle.parent, asset);
  }
}

function hmrAccept(bundle, id) {
  var modules = bundle.modules;
  if (!modules) {
    return;
  }

  if (!modules[id] && bundle.parent) {
    return hmrAccept(bundle.parent, id);
  }

  let cached = bundle.cache[id];
  if (cached && cached.hot._disposeCallback) {
    cached.hot._disposeCallback();
  }

  delete bundle.cache[id];
  bundle(id);

  cached = bundle.cache[id];
  if (cached && cached.hot && cached.hot._acceptCallback) {
    cached.hot._acceptCallback();
    return true;
  }

  return getParents(global.require, id).some(id => hmrAccept(global.require, id));
}
},{}]},{},[0,6])