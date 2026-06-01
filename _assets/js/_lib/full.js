/**
 * CMS Theme Library - Full JavaScript Bundle
 * Includes: nav-toggle.js, announcement-dismiss.js, collapse.js
 * Build date: 2026-05-05T18:23:17.188Z
 */

/* ===== nav-toggle.js ===== */

/**
 * nav-toggle.js – Mobile Navigation Toggle
 *
 * Features:
 * - Opens/closes mobile burger menu
 * - Supports an optional second navigation level
 * - Prevents body scroll when the mobile menu is open
 * - Closes on Escape key
 * - Closes on navigation item click
 * - Closes on window resize to desktop
 * - Accessible (ARIA attributes, focus management, keyboard support)
 *
 * Usage:
 * Include this script with defer attribute:
 * <script src="js/nav-toggle.js" defer></script>
 *
 * Requires:
 * - css/navigation.css
 * - HTML structure with .c-nav-toggle and .c-nav elements
 */

(function() {
  'use strict';

  const toggle = document.querySelector('.c-nav-toggle');
  const nav = document.querySelector('.c-nav');

  if (!toggle || !nav) {
    console.warn('Navigation toggle or nav element not found');
    return;
  }

  const submenuControls = Array.from(
    nav.querySelectorAll('.c-nav__entry--has-children')
  ).map(function(entry, index) {
    const button = entry.querySelector('.c-nav__submenu-toggle');
    const submenu = entry.querySelector('.c-nav__submenu');

    if (!button || !submenu) {
      return null;
    }

    if (!submenu.id) {
      submenu.id = (nav.id || 'c-nav') + '-submenu-' + (index + 1);
    }

    button.setAttribute('aria-controls', submenu.id);
    button.setAttribute('aria-haspopup', 'true');

    return { entry, button, submenu };
  }).filter(Boolean);

  function isMobileView() {
    return window.innerWidth < 768;
  }

  function isMenuOpen() {
    return toggle.getAttribute('aria-expanded') === 'true';
  }

  function isSubmenuExpanded(control) {
    return control.button.getAttribute('aria-expanded') === 'true';
  }

  function isActiveTrail(entry) {
    return entry.classList.contains('c-nav__entry--active-trail')
      || Boolean(entry.querySelector('.c-nav__subitem[aria-current="page"]'));
  }

  function getSubmenuItems(control) {
    return Array.from(control.submenu.querySelectorAll('.c-nav__subitem'));
  }

  function setSubmenuExpanded(control, expanded) {
    control.entry.setAttribute('data-submenu-open', expanded ? 'true' : 'false');
    control.button.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  }

  function closeAllSubmenus(options) {
    const config = Object.assign({
      except: null,
      keepActiveTrail: false
    }, options);

    submenuControls.forEach(function(control) {
      if (config.except === control.entry) {
        return;
      }

      const shouldStayOpen = config.keepActiveTrail && isActiveTrail(control.entry);
      setSubmenuExpanded(control, shouldStayOpen);
    });
  }

  function syncSubmenusForViewport() {
    closeAllSubmenus({ keepActiveTrail: isMobileView() });
  }

  function openMenu() {
    toggle.setAttribute('aria-expanded', 'true');
    nav.setAttribute('data-open', 'true');
    document.body.style.overflow = 'hidden';
    syncSubmenusForViewport();
  }

  function closeMenu() {
    toggle.setAttribute('aria-expanded', 'false');
    nav.setAttribute('data-open', 'false');
    document.body.style.overflow = '';
    syncSubmenusForViewport();
  }

  function toggleMenu() {
    if (isMenuOpen()) {
      closeMenu();
      return;
    }

    openMenu();
  }

  function focusSubmenuItem(control, targetIndex) {
    const items = getSubmenuItems(control);

    if (!items.length) {
      return;
    }

    const normalizedIndex = Math.max(0, Math.min(targetIndex, items.length - 1));
    items[normalizedIndex].focus();
  }

  function handleSubmenuButtonKeydown(control, event) {
    const items = getSubmenuItems(control);

    if (!items.length) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      closeAllSubmenus({ except: control.entry });
      setSubmenuExpanded(control, true);
      focusSubmenuItem(control, 0);
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      closeAllSubmenus({ except: control.entry });
      setSubmenuExpanded(control, true);
      focusSubmenuItem(control, items.length - 1);
    }
  }

  function handleSubmenuListKeydown(control, event) {
    const items = getSubmenuItems(control);
    const currentIndex = items.indexOf(document.activeElement);

    if (!items.length) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusSubmenuItem(control, currentIndex < 0 ? 0 : currentIndex + 1);
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      focusSubmenuItem(control, currentIndex <= 0 ? items.length - 1 : currentIndex - 1);
    }

    if (event.key === 'Home') {
      event.preventDefault();
      focusSubmenuItem(control, 0);
    }

    if (event.key === 'End') {
      event.preventDefault();
      focusSubmenuItem(control, items.length - 1);
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      setSubmenuExpanded(control, isMobileView() && isActiveTrail(control.entry));
      control.button.focus();
    }
  }

  toggle.addEventListener('click', toggleMenu);

  submenuControls.forEach(function(control) {
    setSubmenuExpanded(control, false);

    control.button.addEventListener('click', function() {
      const shouldExpand = !isSubmenuExpanded(control);
      closeAllSubmenus({ except: shouldExpand ? control.entry : null });
      setSubmenuExpanded(control, shouldExpand);
    });

    control.button.addEventListener('keydown', function(event) {
      handleSubmenuButtonKeydown(control, event);
    });

    control.submenu.addEventListener('keydown', function(event) {
      handleSubmenuListKeydown(control, event);
    });
  });

  nav.addEventListener('focusin', function(event) {
    if (isMobileView()) {
      return;
    }

    const currentEntry = event.target.closest('.c-nav__entry--has-children');

    if (currentEntry) {
      closeAllSubmenus({ except: currentEntry });
    }
  });

  nav.addEventListener('click', function(event) {
    const clickedButton = event.target.closest('.c-nav__submenu-toggle');
    const clickedLink = event.target.closest('.c-nav__item, .c-nav__subitem');

    if (clickedButton || !clickedLink) {
      return;
    }

    if (isMobileView()) {
      closeMenu();
    }
  });

  document.addEventListener('click', function(event) {
    if (nav.contains(event.target) || toggle.contains(event.target)) {
      return;
    }

    closeAllSubmenus();

    if (isMobileView() && isMenuOpen()) {
      closeMenu();
    }
  });

  document.addEventListener('focusin', function(event) {
    if (nav.contains(event.target) || toggle.contains(event.target)) {
      return;
    }

    closeAllSubmenus();
  });

  document.addEventListener('keydown', function(event) {
    if (event.key !== 'Escape') {
      return;
    }

    const expandedControl = submenuControls.find(isSubmenuExpanded);

    if (expandedControl && nav.contains(document.activeElement)) {
      event.preventDefault();
      setSubmenuExpanded(
        expandedControl,
        isMobileView() && isActiveTrail(expandedControl.entry)
      );
      expandedControl.button.focus();
      return;
    }

    if (isMenuOpen()) {
      closeMenu();
      toggle.focus();
    }
  });

  let resizeTimer;

  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);

    resizeTimer = setTimeout(function() {
      if (!isMobileView() && isMenuOpen()) {
        closeMenu();
        return;
      }

      syncSubmenusForViewport();
    }, 200);
  });

  syncSubmenusForViewport();
})();


/* ===== announcement-dismiss.js ===== */

/**
 * announcement-dismiss.js – Dismissible announcement bars
 *
 * Features:
 * - Hides dismissed announcements with a CSS transition
 * - Persists dismissal in localStorage when data-announcement-id is provided
 * - Gracefully falls back to session-only dismissal when no ID is set
 *
 * Usage:
 * <script src="js/announcement-dismiss.js" defer></script>
 *
 * Requires:
 * - .c-announcement markup
 * - css/navigation.css (announcement styles)
 */

(function() {
  'use strict';

  const announcements = Array.from(document.querySelectorAll('.c-announcement'));

  if (!announcements.length) {
    return;
  }

  function getAnnouncementId(bar) {
    return (bar.dataset.announcementId || '').trim();
  }

  function getStorageKey(id) {
    return 'announcement-dismissed-' + id;
  }

  function canUseLocalStorage() {
    try {
      const testKey = '__cms-theme-announcement-test__';
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  }

  function afterTransition(element, callback) {
    let finished = false;

    function finish() {
      if (finished) {
        return;
      }

      finished = true;
      window.clearTimeout(fallbackTimer);
      element.removeEventListener('transitionend', onTransitionEnd);
      callback();
    }

    function onTransitionEnd(event) {
      if (event.target !== element) {
        return;
      }

      finish();
    }

    const computedStyle = window.getComputedStyle(element);
    const duration = parseFloat(computedStyle.transitionDuration) || 0;
    const delay = parseFloat(computedStyle.transitionDelay) || 0;
    const fallbackMs = Math.max((duration + delay) * 1000 + 50, 50);
    const fallbackTimer = window.setTimeout(finish, fallbackMs);

    element.addEventListener('transitionend', onTransitionEnd);
  }

  const storageEnabled = canUseLocalStorage();

  announcements.forEach(function(bar) {
    const dismissButton = bar.querySelector('.c-announcement__dismiss');
    const announcementId = getAnnouncementId(bar);

    if (announcementId && storageEnabled) {
      try {
        if (window.localStorage.getItem(getStorageKey(announcementId))) {
          bar.hidden = true;
          return;
        }
      } catch (error) {
        // Ignore storage read failures and fall back to session-only dismissal.
      }
    }

    if (!dismissButton) {
      return;
    }

    dismissButton.addEventListener('click', function() {
      if (bar.hidden || bar.classList.contains('is-dismissed')) {
        return;
      }

      bar.classList.add('is-dismissed');

      if (announcementId && storageEnabled) {
        try {
          window.localStorage.setItem(getStorageKey(announcementId), '1');
        } catch (error) {
          // Ignore storage write failures and keep dismissal limited to this page view.
        }
      }

      afterTransition(bar, function() {
        bar.hidden = true;
      });
    });
  });
})();


/* ===== collapse.js ===== */

/**
 * collapse.js – Collapsible Sections & Accordions
 *
 * Features:
 * - Smooth height animations
 * - Standalone collapses (independent toggle)
 * - Accordion pattern (only one open at a time)
 * - Accessible (ARIA attributes, keyboard navigation)
 * - Handles dynamic content (recalculates height)
 *
 * Usage:
 * Include this script with defer attribute:
 * <script src="js/collapse.js" defer></script>
 *
 * Requires:
 * - css/collapse.css
 * - HTML structure with .c-collapse elements
 *
 * Patterns:
 * - Standalone: <div class="c-collapse">...</div>
 * - Accordion: <div class="c-accordion"><div class="c-collapse">...</div>...</div>
 */

(function() {
  'use strict';

  /**
   * Initialize a single collapse element
   * @param {HTMLElement} collapse - The collapse container
   * @param {boolean} isAccordion - Whether this collapse is part of an accordion
   * @param {HTMLElement|null} accordionContainer - The accordion container (if accordion)
   */
  function initCollapse(collapse, isAccordion, accordionContainer) {
    const toggle = collapse.querySelector('.c-collapse__toggle');
    const content = collapse.querySelector('.c-collapse__content');

    if (!toggle || !content) {
      console.warn('Collapse element missing toggle or content');
      return;
    }

    // Set initial height for open collapses
    if (!content.hasAttribute('hidden')) {
      content.style.height = content.scrollHeight + 'px';
    }

    /**
     * Expand this collapse
     */
    function expand() {
      content.removeAttribute('hidden');
      content.style.height = content.scrollHeight + 'px';
      toggle.setAttribute('aria-expanded', 'true');

      // Remove height after transition to allow dynamic content
      content.addEventListener('transitionend', function handler() {
        if (toggle.getAttribute('aria-expanded') === 'true') {
          content.style.height = 'auto';
        }
        content.removeEventListener('transitionend', handler);
      });
    }

    /**
     * Collapse this collapse
     */
    function collapseItem() {
      // Set explicit height before transitioning
      content.style.height = content.scrollHeight + 'px';
      // Force reflow
      content.offsetHeight; // eslint-disable-line no-unused-expressions
      // Transition to height 0
      content.style.height = '0';
      content.setAttribute('hidden', '');
      toggle.setAttribute('aria-expanded', 'false');
    }

    /**
     * Close all other collapses in the accordion
     */
    function closeOthersInAccordion() {
      if (!isAccordion || !accordionContainer) return;

      const otherCollapses = accordionContainer.querySelectorAll('.c-collapse');

      otherCollapses.forEach(function(otherCollapse) {
        if (otherCollapse === collapse) return;

        const otherToggle = otherCollapse.querySelector('.c-collapse__toggle');
        const otherContent = otherCollapse.querySelector('.c-collapse__content');

        if (otherToggle && otherContent && otherToggle.getAttribute('aria-expanded') === 'true') {
          otherContent.style.height = otherContent.scrollHeight + 'px';
          otherContent.offsetHeight; // eslint-disable-line no-unused-expressions
          otherContent.style.height = '0';
          otherContent.setAttribute('hidden', '');
          otherToggle.setAttribute('aria-expanded', 'false');
        }
      });
    }

    // Click event on toggle button
    toggle.addEventListener('click', function() {
      const isExpanded = toggle.getAttribute('aria-expanded') === 'true';

      if (isAccordion) {
        // Accordion behavior: close others first
        closeOthersInAccordion();

        // Then toggle current (allow closing in accordion)
        if (isExpanded) {
          collapseItem();
        } else {
          expand();
        }
      } else {
        // Standalone behavior: simple toggle
        if (isExpanded) {
          collapseItem();
        } else {
          expand();
        }
      }
    });

    // Optional: Support keyboard navigation (Enter/Space on toggle)
    toggle.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle.click();
      }
    });
  }

  /**
   * Initialize all collapses on the page
   */
  function init() {
    // Find all accordions
    const accordions = document.querySelectorAll('.c-accordion');

    accordions.forEach(function(accordion) {
      const collapses = accordion.querySelectorAll('.c-collapse');

      collapses.forEach(function(collapse) {
        initCollapse(collapse, true, accordion);
      });
    });

    // Find standalone collapses (not inside accordion)
    const standaloneCollapses = document.querySelectorAll('.c-collapse:not(.c-accordion .c-collapse)');

    standaloneCollapses.forEach(function(collapse) {
      initCollapse(collapse, false, null);
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /**
   * Optional: Expose API for dynamic content
   * Usage: window.CollapseAPI.refresh();
   */
  window.CollapseAPI = {
    refresh: init,
    version: '1.0.0'
  };

})();


