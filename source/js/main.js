'use strict';

(function () {
  var menuToggler = document.querySelector('.main-nav__button');
  var form = document.querySelector('.form__form');
  var telInput = form.querySelector('input[type="tel"]');
  var cards = document.querySelectorAll('.card');

  if (document.body.classList.contains('no-js')) {
    window.vendor.activateJs();
  }

  cards.forEach(function (it) {
    window.vendor.onCardButtonFocusBlurCardToggle(it);
  });

  telInput.addEventListener('input', function () {
    window.vendor.validateTelInput(telInput);
  });

  menuToggler.addEventListener('click', window.vendor.onTogglerClickMenuToggle);
})();
