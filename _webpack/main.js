// Library JS bundle – conditionally includes CMS theme JS and language switcher
if (process.env.MARBAS_USE_CMS_STYLES !== '0') {
  require('../_assets/js/_lib/full.js');
}

if (process.env.MARBAS_USE_LANGUAGE_SWITCHER !== '0') {
  require('../_assets/js/_lib/languageSwitcher.js');
}

document.addEventListener('DOMContentLoaded', () => {
  if (process.env.MARBAS_USE_CMS_STYLES === '0') {
    return;
  }

  const navToggler = document.querySelector('.navbar-toggler');
  const navCollapse = document.querySelector('.navbar-collapse');

  if (navToggler && navCollapse) {
    navToggler.addEventListener('click', () => {
      navCollapse.classList.toggle('show');
      const expanded = navCollapse.classList.contains('show');
      navToggler.setAttribute('aria-expanded', expanded);
    });

    document.addEventListener('click', (event) => {
      if (!navToggler.contains(event.target) && !navCollapse.contains(event.target)) {
        navCollapse.classList.remove('show');
        navToggler.setAttribute('aria-expanded', 'false');
      }
    });
  }
});
