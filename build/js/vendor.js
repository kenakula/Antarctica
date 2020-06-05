'use strict';

(function () {
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

  window.vendor = {
    activateJs: activateJs,
    openMenu: openMenu,
    closeMenu: closeMenu,
  }

})();
