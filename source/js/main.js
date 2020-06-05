(function () {
  var pageLogo = document.querySelector('.page-header__logo');
  var menuToggler = document.querySelector('.main-nav__button');
  var menuList = document.querySelector('.main-nav__list');

  if (document.body.classList.contains('no-js')) {
    document.body.classList.remove('no-js');
    pageLogo.classList.remove('page-header__logo--dark');
    menuList.classList.remove('main-nav__list--expanded');
  }

  menuToggler.addEventListener('click')

})();
