/* eslint-disable */
'use strict';

//object-fit polyfill
var objectFitImages = (function () {
  'use strict';

  var OFI = 'fregante:object-fit-images';
  var propRegex = /(object-fit|object-position)\s*:\s*([-.\w\s%]+)/g;
  var testImg = typeof Image === 'undefined' ? { style: { 'object-position': 1 } } : new Image();
  var supportsObjectFit = 'object-fit' in testImg.style;
  var supportsObjectPosition = 'object-position' in testImg.style;
  var supportsOFI = 'background-size' in testImg.style;
  var supportsCurrentSrc = typeof testImg.currentSrc === 'string';
  var nativeGetAttribute = testImg.getAttribute;
  var nativeSetAttribute = testImg.setAttribute;
  var autoModeEnabled = false;

  function createPlaceholder(w, h) {
    return ("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='" + w + "' height='" + h + "'%3E%3C/svg%3E");
  }

  function polyfillCurrentSrc(el) {
    if (el.srcset && !supportsCurrentSrc && window.picturefill) {
      var pf = window.picturefill._;
      // parse srcset with picturefill where currentSrc isn't available
      if (!el[pf.ns] || !el[pf.ns].evaled) {
        // force synchronous srcset parsing
        pf.fillImg(el, { reselect: true });
      }

      if (!el[pf.ns].curSrc) {
        // force picturefill to parse srcset
        el[pf.ns].supported = false;
        pf.fillImg(el, { reselect: true });
      }

      // retrieve parsed currentSrc, if any
      el.currentSrc = el[pf.ns].curSrc || el.src;
    }
  }

  function getStyle(el) {
    var style = getComputedStyle(el).fontFamily;
    var parsed;
    var props = {};
    while ((parsed = propRegex.exec(style)) !== null) {
      props[parsed[1]] = parsed[2];
    }
    return props;
  }

  function setPlaceholder(img, width, height) {
    // Default: fill width, no height
    var placeholder = createPlaceholder(width || 1, height || 0);

    // Only set placeholder if it's different
    if (nativeGetAttribute.call(img, 'src') !== placeholder) {
      nativeSetAttribute.call(img, 'src', placeholder);
    }
  }

  function onImageReady(img, callback) {
    // naturalWidth is only available when the image headers are loaded,
    // this loop will poll it every 100ms.
    if (img.naturalWidth) {
      callback(img);
    } else {
      setTimeout(onImageReady, 100, img, callback);
    }
  }

  function fixOne(el) {
    var style = getStyle(el);
    var ofi = el[OFI];
    style['object-fit'] = style['object-fit'] || 'fill'; // default value

    // Avoid running where unnecessary, unless OFI had already done its deed
    if (!ofi.img) {
      // fill is the default behavior so no action is necessary
      if (style['object-fit'] === 'fill') {
        return;
      }

      // Where object-fit is supported and object-position isn't (Safari < 10)
      if (
        !ofi.skipTest && // unless user wants to apply regardless of browser support
        supportsObjectFit && // if browser already supports object-fit
        !style['object-position'] // unless object-position is used
      ) {
        return;
      }
    }

    // keep a clone in memory while resetting the original to a blank
    if (!ofi.img) {
      ofi.img = new Image(el.width, el.height);
      ofi.img.srcset = nativeGetAttribute.call(el, "data-ofi-srcset") || el.srcset;
      ofi.img.src = nativeGetAttribute.call(el, "data-ofi-src") || el.src;

      // preserve for any future cloneNode calls
      // https://github.com/fregante/object-fit-images/issues/53
      nativeSetAttribute.call(el, "data-ofi-src", el.src);
      if (el.srcset) {
        nativeSetAttribute.call(el, "data-ofi-srcset", el.srcset);
      }

      setPlaceholder(el, el.naturalWidth || el.width, el.naturalHeight || el.height);

      // remove srcset because it overrides src
      if (el.srcset) {
        el.srcset = '';
      }
      try {
        keepSrcUsable(el);
      } catch (err) {
        if (window.console) {
          console.warn('https://bit.ly/ofi-old-browser');
        }
      }
    }

    polyfillCurrentSrc(ofi.img);

    el.style.backgroundImage = "url(\"" + ((ofi.img.currentSrc || ofi.img.src).replace(/"/g, '\\"')) + "\")";
    el.style.backgroundPosition = style['object-position'] || 'center';
    el.style.backgroundRepeat = 'no-repeat';
    el.style.backgroundOrigin = 'content-box';

    if (/scale-down/.test(style['object-fit'])) {
      onImageReady(ofi.img, function () {
        if (ofi.img.naturalWidth > el.width || ofi.img.naturalHeight > el.height) {
          el.style.backgroundSize = 'contain';
        } else {
          el.style.backgroundSize = 'auto';
        }
      });
    } else {
      el.style.backgroundSize = style['object-fit'].replace('none', 'auto').replace('fill', '100% 100%');
    }

    onImageReady(ofi.img, function (img) {
      setPlaceholder(el, img.naturalWidth, img.naturalHeight);
    });
  }

  function keepSrcUsable(el) {
    var descriptors = {
      get: function get(prop) {
        return el[OFI].img[prop ? prop : 'src'];
      },
      set: function set(value, prop) {
        el[OFI].img[prop ? prop : 'src'] = value;
        nativeSetAttribute.call(el, ("data-ofi-" + prop), value); // preserve for any future cloneNode
        fixOne(el);
        return value;
      }
    };
    Object.defineProperty(el, 'src', descriptors);
    Object.defineProperty(el, 'currentSrc', {
      get: function () { return descriptors.get('currentSrc'); }
    });
    Object.defineProperty(el, 'srcset', {
      get: function () { return descriptors.get('srcset'); },
      set: function (ss) { return descriptors.set(ss, 'srcset'); }
    });
  }

  function hijackAttributes() {
    function getOfiImageMaybe(el, name) {
      return el[OFI] && el[OFI].img && (name === 'src' || name === 'srcset') ? el[OFI].img : el;
    }
    if (!supportsObjectPosition) {
      HTMLImageElement.prototype.getAttribute = function (name) {
        return nativeGetAttribute.call(getOfiImageMaybe(this, name), name);
      };

      HTMLImageElement.prototype.setAttribute = function (name, value) {
        return nativeSetAttribute.call(getOfiImageMaybe(this, name), name, String(value));
      };
    }
  }

  function fix(imgs, opts) {
    var startAutoMode = !autoModeEnabled && !imgs;
    opts = opts || {};
    imgs = imgs || 'img';

    if ((supportsObjectPosition && !opts.skipTest) || !supportsOFI) {
      return false;
    }

    // use imgs as a selector or just select all images
    if (imgs === 'img') {
      imgs = document.getElementsByTagName('img');
    } else if (typeof imgs === 'string') {
      imgs = document.querySelectorAll(imgs);
    } else if (!('length' in imgs)) {
      imgs = [imgs];
    }

    // apply fix to all
    for (var i = 0; i < imgs.length; i++) {
      imgs[i][OFI] = imgs[i][OFI] || {
        skipTest: opts.skipTest
      };
      fixOne(imgs[i]);
    }

    if (startAutoMode) {
      document.body.addEventListener('load', function (e) {
        if (e.target.tagName === 'IMG') {
          fix(e.target, {
            skipTest: opts.skipTest
          });
        }
      }, true);
      autoModeEnabled = true;
      imgs = 'img'; // reset to a generic selector for watchMQ
    }

    // if requested, watch media queries for object-fit change
    if (opts.watchMQ) {
      window.addEventListener('resize', fix.bind(null, imgs, {
        skipTest: opts.skipTest
      }));
    }
  }

  fix.supportsObjectFit = supportsObjectFit;
  fix.supportsObjectPosition = supportsObjectPosition;

  hijackAttributes();

  return fix;

}());

objectFitImages();

// end of object-fit polyfill
// -------
// Full polyfill for browsers with no classList support
// Including IE < Edge missing SVGElement.classList

(function () {

  if ('document' in self) {

    if (
      !('classList' in document.createElement('_'))
      || document.createElementNS
      && !('classList' in document.createElementNS('http://www.w3.org/2000/svg', 'g'))
    ) {

      (function (view) {

        if (!('Element' in view)) {
          return;
        }

        var classListProp = 'classList';
        var protoProp = 'prototype';
        var elemCtrProto = view.Element[protoProp];
        var objCtr = Object;
        var strTrim = String[protoProp].trim || function () {
          return this.replace(/^\s+|\s+$/g, '');
        };
        var arrIndexOf = Array[protoProp].indexOf || function (item) {
          var i = 0;
          var len = this.length;

          for (; i < len; i++) {
            if (i in this && this[i] === item) {
              return i;
            }
          }
          return -1;
        };
        // Vendors: please allow content code to instantiate DOMExceptions
        var DOMEx = function (type, message) {
          this.name = type;
          this.code = DOMException[type];
          this.message = message;
        };
        var checkTokenAndGetIndex = function (classList, token) {
          if (token === '') {
            throw new DOMEx('SYNTAX_ERR', 'The token must not be empty.');
          }
          if (/\s/.test(token)) {
            throw new DOMEx('INVALID_CHARACTER_ERR', 'The token must not contain space characters.');
          }
          return arrIndexOf.call(classList, token);
        };
        var ClassList = function (elem) {
          var trimmedClasses = strTrim.call(elem.getAttribute('class') || '');
          var classes = trimmedClasses ? trimmedClasses.split(/\s+/) : [];
          var i = 0;
          var len = classes.length;

          for (; i < len; i++) {
            this.push(classes[i]);
          }
          this._updateClassName = function () {
            elem.setAttribute('class', this.toString());
          };
        };
        var classListProto = ClassList[protoProp] = [];
        var classListGetter = function () {
          return new ClassList(this);
        };
        // Most DOMException implementations don't allow calling DOMException's toString()
        // on non-DOMExceptions. Error's toString() is sufficient here.
        DOMEx[protoProp] = Error[protoProp];
        classListProto.item = function (i) {
          return this[i] || null;
        };
        classListProto.contains = function (token) {
          return ~checkTokenAndGetIndex(this, token + '');
        };
        classListProto.add = function () {
          var tokens = arguments;
          var i = 0;
          var l = tokens.length;
          var token;
          var updated = false;

          do {
            token = tokens[i] + '';
            if (!~checkTokenAndGetIndex(this, token)) {
              this.push(token);
              updated = true;
            }
          }
          while (++i < l);

          if (updated) {
            this._updateClassName();
          }
        };
        classListProto.remove = function () {
          var tokens = arguments;
          var i = 0;
          var l = tokens.length;
          var token;
          var updated = false;
          var index;

          do {
            token = tokens[i] + '';
            index = checkTokenAndGetIndex(this, token);
            while (~index) {
              this.splice(index, 1);
              updated = true;
              index = checkTokenAndGetIndex(this, token);
            }
          }
          while (++i < l);

          if (updated) {
            this._updateClassName();
          }
        };
        classListProto.toggle = function (token, force) {
          var result = this.contains(token);
          var method = result
            ? force !== true && 'remove'
            : force !== false && 'add';

          if (method) {
            this[method](token);
          }

          if (force === true || force === false) {
            return force;
          } else {
            return !result;
          }
        };
        classListProto.replace = function (token, replacementToken) {
          var index = checkTokenAndGetIndex(token + '');
          if (~index) {
            this.splice(index, 1, replacementToken);
            this._updateClassName();
          }
        };
        classListProto.toString = function () {
          return this.join(' ');
        };

        if (objCtr.defineProperty) {
          var classListPropDesc = {
            get: classListGetter,
            enumerable: true,
            configurable: true
          };
          try {
            objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
          } catch (ex) { // IE 8 doesn't support enumerable:true
            // adding undefined to fight this issue https://github.com/eligrey/classList.js/issues/36
            // modernie IE8-MSW7 machine has IE8 8.0.6001.18702 and is affected
            if (ex.number === undefined || ex.number === -0x7FF5EC54) {
              classListPropDesc.enumerable = false;
              objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
            }
          }
        } else if (objCtr[protoProp].__defineGetter__) {
          elemCtrProto.__defineGetter__(classListProp, classListGetter);
        }

      }(self));

    }

    // There is full or partial native classList support, so just check if we need
    // to normalize the add/remove and toggle APIs.

    (function () {

      var testElement = document.createElement('_');

      testElement.classList.add('c1', 'c2');

      // Polyfill for IE 10/11 and Firefox <26, where classList.add and
      // classList.remove exist but support only one argument at a time.
      if (!testElement.classList.contains('c2')) {
        var createMethod = function (method) {
          var original = DOMTokenList.prototype[method];

          DOMTokenList.prototype[method] = function (token) {
            var i;
            var len = arguments.length;

            for (i = 0; i < len; i++) {
              token = arguments[i];
              original.call(this, token);
            }
          };
        };
        createMethod('add');
        createMethod('remove');
      }

      testElement.classList.toggle('c3', false);

      // Polyfill for IE 10 and Firefox <24, where classList.toggle does not
      // support the second argument.
      if (testElement.classList.contains('c3')) {
        var _toggle = DOMTokenList.prototype.toggle;

        DOMTokenList.prototype.toggle = function (token, force) {
          if (1 in arguments && !this.contains(token) === !force) {
            return force;
          } else {
            return _toggle.call(this, token);
          }
        };

      }

      // replace() polyfill
      if (!('replace' in document.createElement('_').classList)) {
        DOMTokenList.prototype.replace = function (token, replacementToken) {
          var tokens = this.toString().split(' ');
          var index = tokens.indexOf(token + '');

          if (~index) {
            tokens = tokens.slice(index);
            this.remove.apply(this, tokens);
            this.add(replacementToken);
            this.add.apply(this, tokens.slice(1));
          }
        };
      }

      testElement = null;
    }());
  }

  // end of classList polyfill
  // -------
  // полифилл forEach для IE

  if ('NodeList' in window && !NodeList.prototype.forEach) {
    NodeList.prototype.forEach = function (callback, thisArg) {
      thisArg = thisArg || window;
      for (var i = 0; i < this.length; i++) {
        callback.call(thisArg, this[i], i, this);
      }
    };
  }

  // end of forEach polyfill

  var pageLogo = document.querySelector('.page-header__logo');
  var menuToggler = document.querySelector('.main-nav__button');
  var menuList = document.querySelector('.main-nav__list');

  var activateJs = function () {
    document.body.classList.remove('no-js');
    pageLogo.classList.remove('page-header__logo--dark');
    menuList.classList.remove('main-nav__list--expanded');
  };

  var openMenu = function () {
    menuToggler.classList.add('main-nav__button--close');
    pageLogo.classList.add('page-header__logo--dark');
    menuList.classList.add('main-nav__list--expanded');
  };

  var closeMenu = function () {
    menuToggler.classList.remove('main-nav__button--close');
    pageLogo.classList.remove('page-header__logo--dark');
    menuList.classList.remove('main-nav__list--expanded');
  };

  var validateTelInput = function (input) {
    var value = input.value;

    input.value = value.replace(/[^\d]/g, '');
  };

  var onTogglerClickMenuToggle = function () {
    if (!menuToggler.classList.contains('main-nav__button--close')) {
      window.vendor.openMenu();
    } else {
      window.vendor.closeMenu();
    }
  };

  var toggleCardDescription = function (el) {
    if (el.classList.contains('card--focused')) {
      el.classList.remove('card--focused');
    } else {
      el.classList.add('card--focused');
    }
  };

  var onCardButtonFocusBlurCardToggle = function (card) {
    var button = card.querySelector('.card__button');

    if (button) {
      button.addEventListener('focus', function () {
        toggleCardDescription(card);
      });
      button.addEventListener('blur', function () {
        toggleCardDescription(card);
      });
    }
  }

  window.vendor = {
    activateJs: activateJs,
    openMenu: openMenu,
    closeMenu: closeMenu,
    onTogglerClickMenuToggle: onTogglerClickMenuToggle,
    validateTelInput: validateTelInput,
    toggleCardDescription: toggleCardDescription,
    onCardButtonFocusBlurCardToggle: onCardButtonFocusBlurCardToggle,
  };
})();
