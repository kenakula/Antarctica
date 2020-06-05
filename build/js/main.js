(function () {
  var pageLogo = document.querySelector('.page-header__logo');
  var menuToggler = document.querySelector('.main-nav__button');
  var menuList = document.querySelector('.main-nav__list');

  if (document.body.classList.contains('no-js')) {
    document.body.classList.remove('no-js');
    pageLogo.classList.remove('page-header__logo--dark');
    menuList.classList.remove('main-nav__list--expanded');
  }

  menuToggler.addEventListener('click', function () {
    if (!this.classList.contains('main-nav__button--close')) {
      this.classList.add('main-nav__button--close');
      pageLogo.classList.add('page-header__logo--dark');
      menuList.classList.add('main-nav__list--expanded');
    } else {
      this.classList.remove('main-nav__button--close');
      pageLogo.classList.remove('page-header__logo--dark');
      menuList.classList.remove('main-nav__list--expanded');
    }
  })

})();
