'use strict';

(function () {
  var menuToggler = document.querySelector('.main-nav__button');

  if (document.body.classList.contains('no-js')) {
    window.vendor.activateJs();
  }

  var onTogglerClickMenuToggle = function () {
    if (!menuToggler.classList.contains('main-nav__button--close')) {
      window.vendor.openMenu();
    } else {
      window.vendor.closeMenu();
    }
  }

  menuToggler.addEventListener('click', onTogglerClickMenuToggle);

})();
