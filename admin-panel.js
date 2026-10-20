(function () {
  var PANEL_ID = 'temporary-admin-panel';
  var STYLE_ID = 'temporary-admin-panel-style';
  var DARK_MODE_CLASS = 'temporary-admin-dark-mode';
  var EFFECT_CLASS = 'temporary-admin-visual-effect';
  var originalHeadingText = null;
  var headingEl = null;
  var lastFocusedElement = null;
  var currentFontPercent = 100;
  var hiddenSelectors = {
    '#about': false,
    '#interests': false,
    '#projects': false,
    '#blog': false
  };

  function isTypingTarget(target) {
    if (!target || !(target instanceof Element)) return false;
    if (target.isContentEditable) return true;
    var tag = target.tagName ? target.tagName.toLowerCase() : '';
    return tag === 'input' || tag === 'textarea' || tag === 'select';
  }

  function isInteractiveTarget(target) {
    if (!target || !(target instanceof Element)) return false;
    return Boolean(target.closest('button, a, input, textarea, select, summary, [role="button"]'));
  }

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      '.temporary-admin-overlay{position:fixed;top:16px;right:16px;z-index:2147483647;width:min(360px,calc(100vw - 32px));max-height:calc(100vh - 32px);overflow:auto;background:#111827;color:#f9fafb;border:1px solid #374151;border-radius:12px;padding:14px;box-shadow:0 14px 34px rgba(0,0,0,.45);font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;}',
      '.temporary-admin-overlay h2{margin:0 0 6px;font-size:1.05rem;}',
      '.temporary-admin-overlay p{margin:0 0 12px;color:#d1d5db;font-size:.9rem;}',
      '.temporary-admin-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:8px 0;}',
      '.temporary-admin-row button,.temporary-admin-row input{font:inherit;}',
      '.temporary-admin-row button{border:1px solid #4b5563;background:#1f2937;color:#f9fafb;padding:7px 9px;border-radius:8px;cursor:pointer;}',
      '.temporary-admin-row button:hover{background:#374151;}',
      '.temporary-admin-row button:focus-visible,.temporary-admin-row input:focus-visible{outline:2px solid #60a5fa;outline-offset:2px;}',
      '.temporary-admin-row input[type="text"]{flex:1;min-width:130px;background:#0f172a;color:#f9fafb;border:1px solid #4b5563;border-radius:8px;padding:7px 9px;}',
      '.temporary-admin-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;}',
      '.temporary-admin-grid label{display:flex;gap:6px;align-items:center;font-size:.88rem;}',
      '.temporary-admin-row .temporary-admin-input-label{font-size:.88rem;color:#e5e7eb;}',
      '.temporary-admin-divider{border-top:1px solid #374151;margin:10px 0;}',
      '.' + DARK_MODE_CLASS + '{background:#0b1220 !important;color:#f3f4f6 !important;}',
      '.' + DARK_MODE_CLASS + ' .site-header{background:rgba(15,23,42,.94) !important;}',
      '.' + DARK_MODE_CLASS + ' .card,.' + DARK_MODE_CLASS + ' .project,.' + DARK_MODE_CLASS + ' .facts li{background:#1f2937 !important;color:#e5e7eb !important;border-color:#374151 !important;}',
      '.' + EFFECT_CLASS + '{filter:hue-rotate(155deg) saturate(1.15);}'
    ].join('');
    document.head.appendChild(style);
  }

  function getHeading() {
    if (headingEl && headingEl.isConnected) return headingEl;
    headingEl = document.querySelector('#home h1') || document.querySelector('h1');
    if (headingEl && originalHeadingText === null) {
      originalHeadingText = headingEl.textContent;
    }
    return headingEl;
  }

  function setSectionVisibility(selector, hidden) {
    var el = document.querySelector(selector);
    if (!el) return;
    if (hidden) {
      if (!el.hasAttribute('data-temp-admin-prev-display')) {
        el.setAttribute('data-temp-admin-prev-display', el.style.display || '');
      }
      el.setAttribute('data-temp-admin-hidden', 'true');
      el.setAttribute('aria-hidden', 'true');
      el.style.display = 'none';
    } else if (el.getAttribute('data-temp-admin-hidden') === 'true') {
      var previousDisplay = el.getAttribute('data-temp-admin-prev-display');
      el.style.display = previousDisplay === null ? '' : previousDisplay;
      el.removeAttribute('data-temp-admin-hidden');
      el.removeAttribute('data-temp-admin-prev-display');
      el.removeAttribute('aria-hidden');
    }
  }

  function applyHiddenSections() {
    Object.keys(hiddenSelectors).forEach(function (selector) {
      setSectionVisibility(selector, hiddenSelectors[selector]);
    });
  }

  function resetAllChanges() {
    document.documentElement.classList.remove(DARK_MODE_CLASS);
    document.body.classList.remove(EFFECT_CLASS);
    currentFontPercent = 100;
    document.documentElement.style.fontSize = '';
    Object.keys(hiddenSelectors).forEach(function (selector) {
      hiddenSelectors[selector] = false;
    });
    applyHiddenSections();
    var h1 = getHeading();
    if (h1 && originalHeadingText !== null) {
      h1.textContent = originalHeadingText;
    }
    syncPanelState();
  }

  function closePanel() {
    var panel = document.getElementById(PANEL_ID);
    if (panel) panel.remove();
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
      lastFocusedElement.focus();
    }
    lastFocusedElement = null;
  }

  function syncPanelState() {
    var panel = document.getElementById(PANEL_ID);
    if (!panel) return;

    var darkBtn = panel.querySelector('[data-action="dark-mode"]');
    if (darkBtn) {
      darkBtn.textContent = document.documentElement.classList.contains(DARK_MODE_CLASS)
        ? 'Dark mode: On'
        : 'Dark mode: Off';
    }

    var effectBtn = panel.querySelector('[data-action="effect"]');
    if (effectBtn) {
      effectBtn.textContent = document.body.classList.contains(EFFECT_CLASS)
        ? 'Visual effect: On'
        : 'Visual effect: Off';
    }

    var fontLabel = panel.querySelector('[data-role="font-size-label"]');
    if (fontLabel) {
      fontLabel.textContent = 'Font size: ' + currentFontPercent + '%';
    }

    Object.keys(hiddenSelectors).forEach(function (selector) {
      var checkbox = panel.querySelector('input[data-selector="' + selector + '"]');
      if (checkbox) checkbox.checked = hiddenSelectors[selector];
    });
  }

  function createPanel() {
    if (document.getElementById(PANEL_ID)) return;
    ensureStyles();

    var panel = document.createElement('aside');
    panel.id = PANEL_ID;
    panel.className = 'temporary-admin-overlay';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'false');
    panel.setAttribute('aria-labelledby', 'temporary-admin-title');
    panel.setAttribute('tabindex', '-1');
    panel.innerHTML = [
      '<div class="temporary-admin-row" style="justify-content:space-between;align-items:flex-start;">',
      '  <div>',
      '    <h2 id="temporary-admin-title">Admin Panel (Temporary)</h2>',
      '    <p>Changes are only for this page session and reset after reload.</p>',
      '  </div>',
      '  <button type="button" data-action="close" aria-label="Close admin panel">Close</button>',
      '</div>',
      '<div class="temporary-admin-divider"></div>',
      '<div class="temporary-admin-row">',
      '  <button type="button" data-action="dark-mode">Dark mode: Off</button>',
      '  <button type="button" data-action="effect">Visual effect: Off</button>',
      '</div>',
      '<div class="temporary-admin-row">',
      '  <button type="button" data-action="font-dec" aria-label="Decrease font size">A-</button>',
      '  <button type="button" data-action="font-inc" aria-label="Increase font size">A+</button>',
      '  <button type="button" data-action="font-reset">Reset font</button>',
      '  <span data-role="font-size-label">Font size: 100%</span>',
      '</div>',
      '<div class="temporary-admin-row temporary-admin-grid">',
      '  <label><input type="checkbox" data-selector="#about"> Hide About</label>',
      '  <label><input type="checkbox" data-selector="#interests"> Hide Interests</label>',
      '  <label><input type="checkbox" data-selector="#projects"> Hide More Stuff</label>',
      '  <label><input type="checkbox" data-selector="#blog"> Hide Blog</label>',
      '</div>',
      '<div class="temporary-admin-row">',
      '  <label class="temporary-admin-input-label" for="temporary-admin-heading-input">Heading text</label>',
      '  <input id="temporary-admin-heading-input" type="text" data-role="heading-input" placeholder="Temporary H1 text">',
      '  <button type="button" data-action="heading-apply">Apply heading</button>',
      '  <button type="button" data-action="heading-reset">Reset heading</button>',
      '</div>',
      '<div class="temporary-admin-row">',
      '  <button type="button" data-action="reset-all">Reset all changes</button>',
      '</div>'
    ].join('');

    panel.addEventListener('click', function (event) {
      var target = event.target;
      if (!(target instanceof HTMLElement)) return;
      var action = target.getAttribute('data-action');
      if (!action) return;

      if (action === 'close') {
        closePanel();
        return;
      }
      if (action === 'dark-mode') {
        document.documentElement.classList.toggle(DARK_MODE_CLASS);
      }
      if (action === 'effect') {
        document.body.classList.toggle(EFFECT_CLASS);
      }
      if (action === 'font-inc') {
        currentFontPercent = Math.min(150, currentFontPercent + 5);
        document.documentElement.style.fontSize = currentFontPercent + '%';
      }
      if (action === 'font-dec') {
        currentFontPercent = Math.max(80, currentFontPercent - 5);
        document.documentElement.style.fontSize = currentFontPercent + '%';
      }
      if (action === 'font-reset') {
        currentFontPercent = 100;
        document.documentElement.style.fontSize = '';
      }
      if (action === 'heading-apply') {
        var input = panel.querySelector('[data-role="heading-input"]');
        var h1 = getHeading();
        if (input && h1) {
          h1.textContent = input.value;
        }
      }
      if (action === 'heading-reset') {
        var heading = getHeading();
        if (heading && originalHeadingText !== null) {
          heading.textContent = originalHeadingText;
        }
      }
      if (action === 'reset-all') resetAllChanges();
      syncPanelState();
    });

    panel.addEventListener('change', function (event) {
      var target = event.target;
      if (!(target instanceof HTMLInputElement)) return;
      var selector = target.getAttribute('data-selector');
      if (!selector) return;
      hiddenSelectors[selector] = target.checked;
      applyHiddenSections();
      syncPanelState();
    });

    document.body.appendChild(panel);
    syncPanelState();
    var closeButton = panel.querySelector('[data-action="close"]');
    lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (closeButton && typeof closeButton.focus === 'function') {
      closeButton.focus();
    } else {
      panel.focus();
    }
  }

  function togglePanel() {
    if (document.getElementById(PANEL_ID)) {
      closePanel();
    } else {
      createPanel();
    }
  }

  document.addEventListener('keydown', function (event) {
    if (event.defaultPrevented || event.repeat) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (isTypingTarget(event.target)) return;
    var panel = document.getElementById(PANEL_ID);
    var inPanel = panel && event.target instanceof Node ? panel.contains(event.target) : false;
    if (!inPanel && isInteractiveTarget(event.target)) return;
    if ((event.key || '').toLowerCase() !== 'z') return;
    event.preventDefault();
    togglePanel();
  });
})();
