
document.addEventListener('DOMContentLoaded', () => {
  const navToggler = document.querySelector('.navbar-toggler');
  const navCollapse = document.querySelector('.navbar-collapse');
  if (navToggler && navCollapse) {
    navToggler.addEventListener('click', () => {
      navCollapse.classList.toggle('show');
      navToggler.setAttribute('aria-expanded', navCollapse.classList.contains('show'));
    });
    document.addEventListener('click', (event) => {
      if (!navToggler.contains(event.target) && !navCollapse.contains(event.target)) {
        navCollapse.classList.remove('show');
        navToggler.setAttribute('aria-expanded', 'false');
      }
    });
  }
});