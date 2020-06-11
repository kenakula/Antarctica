'use strict';

(function () {

  if ('document' in self) {
    // Full polyfill for browsers with no classList support
    // Including IE < Edge missing SVGElement.classList
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

  // полифилл forEach для IE

  if ('NodeList' in window && !NodeList.prototype.forEach) {
    NodeList.prototype.forEach = function (callback, thisArg) {
      thisArg = thisArg || window;
      for (var i = 0; i < this.length; i++) {
        callback.call(thisArg, this[i], i, this);
      }
    };
  }


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

  var toggleDescription = function (el) {
    if (el.classList.contains('card--focused')) {
      el.classList.remove('card--focused');
    } else {
      el.classList.add('card--focused');
    }
  };

  window.vendor = {
    activateJs: activateJs,
    openMenu: openMenu,
    closeMenu: closeMenu,
    validateTelInput: validateTelInput,
    toggleDescription: toggleDescription,
  };
})();
