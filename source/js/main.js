'use strict';

(function () {
  var menuToggler = document.querySelector('.main-nav__button');
  var form = document.querySelector('.form__form');
  var telInput = form.querySelector('input[type="tel"]');
  var cards = document.querySelectorAll('.card');

  if (document.body.classList.contains('no-js')) {
    window.vendor.activateJs();
  }

  var onTogglerClickMenuToggle = function () {
    if (!menuToggler.classList.contains('main-nav__button--close')) {
      window.vendor.openMenu();
    } else {
      window.vendor.closeMenu();
    }
  };

  cards.forEach(function (it) {
    var button = it.querySelector('.card__button');
    if (button) {
      button.addEventListener('focus', function () {
        window.vendor.toggleDescription(it);
      });
      button.addEventListener('blur', function () {
        window.vendor.toggleDescription(it);
      });
    }
  });

  telInput.addEventListener('input', function () {
    window.vendor.validateTelInput(telInput);
  });

  menuToggler.addEventListener('click', onTogglerClickMenuToggle);

  objectFitImages();
})();
