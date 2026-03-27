/**
 * Viewer JS — option-based slide viewer.
 *
 * Options (toggleable):
 *   maximum (M) — scale slide to fill viewport (default: on)
 *   grid    (G) — thumbnail overview
 *
 * Fullscreen (F) always forces maximum scaling.
 * Keyboard: ←/→/Space navigate, Home/End, Esc exit grid/fullscreen.
 * URL params: ?page=N&maximum=off&grid=on
 */
export const viewerJS = /* js */ `
(function() {
  var slides = document.querySelectorAll('.slide-outer');
  var total = slides.length;
  if (total === 0) return;

  var current = 0;
  var body = document.body;
  var counter = document.getElementById('current-slide');
  var btnPrev = document.getElementById('btn-prev');
  var btnNext = document.getElementById('btn-next');
  var btnFullscreen = document.getElementById('btn-fullscreen');
  var btnMaximum = document.getElementById('btn-maximum');
  var btnGrid = document.getElementById('btn-grid');
  var btnMore = document.getElementById('btn-more');
  var navMenu = document.getElementById('nav-menu');
  var nav = document.getElementById('nav-controls');

  var ICON_FULLSCREEN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>';
  var ICON_SHRINK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14h6v6"/><path d="M20 10h-6V4"/><path d="M14 10l7-7"/><path d="M3 21l7-7"/></svg>';

  /* -- State ------------------------------------------------------- */
  var maximum = true;
  var gridOn = false;

  /* -- URL params -------------------------------------------------- */
  var params = new URLSearchParams(window.location.search);
  var initialPage = parseInt(params.get('page'), 10);
  if (initialPage >= 1 && initialPage <= total) current = initialPage - 1;
  if (params.get('maximum') === 'off') maximum = false;
  if (params.get('grid') === 'on') gridOn = true;

  /* -- Nav auto-hide ----------------------------------------------- */
  var hideTimer = null;
  function showNav() {
    nav.classList.add('visible');
    clearTimeout(hideTimer);
    hideTimer = setTimeout(function() { nav.classList.remove('visible'); }, 3000);
  }
  document.addEventListener('mousemove', showNav);
  document.addEventListener('touchstart', showNav);
  nav.addEventListener('mouseenter', function() { clearTimeout(hideTimer); nav.classList.add('visible'); });
  nav.addEventListener('mouseleave', function() { hideTimer = setTimeout(function() { nav.classList.remove('visible'); }, 3000); });

  /* -- URL sync ---------------------------------------------------- */
  function syncURL() {
    var p = new URLSearchParams();
    p.set('page', current + 1);
    if (!maximum) p.set('maximum', 'off');
    if (gridOn) p.set('grid', 'on');
    var qs = p.toString();
    var url = window.location.pathname + (qs ? '?' + qs : '');
    history.replaceState(null, '', url);
  }

  /* -- Apply state to DOM ------------------------------------------ */
  function applyState() {
    body.classList.toggle('maximum', maximum && !gridOn);
    body.classList.toggle('grid-on', gridOn);

    if (gridOn) {
      /* Move slides into grid container */
      if (!gridWrap.parentNode) {
        body.insertBefore(gridWrap, nav);
      }
      slides.forEach(function(s) {
        s.classList.remove('active');
        gridWrap.appendChild(s);
      });
      gridWrap.style.display = '';
    } else {
      /* Move slides back to body */
      if (gridWrap.parentNode) {
        var frag = document.createDocumentFragment();
        while (gridWrap.firstChild) frag.appendChild(gridWrap.firstChild);
        body.insertBefore(frag, nav);
        gridWrap.style.display = 'none';
      }
      showSlide(current);
    }

    updateMenuLabels();
    syncURL();
  }

  /* -- Slide navigation -------------------------------------------- */
  function showSlide(index) {
    if (index < 0) index = 0;
    if (index >= total) index = total - 1;
    current = index;
    counter.textContent = (current + 1);
    slides.forEach(function(s, i) { s.classList.toggle('active', i === current); });
    syncURL();
  }

  /* -- Grid container ---------------------------------------------- */
  var gridWrap = document.createElement('div');
  gridWrap.className = 'grid-container';
  gridWrap.style.display = 'none';

  /* -- Toggle functions -------------------------------------------- */
  function toggleMaximum() {
    maximum = !maximum;
    applyState();
  }

  function toggleGrid() {
    gridOn = !gridOn;
    if (document.fullscreenElement) document.exitFullscreen();
    applyState();
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      if (gridOn) { gridOn = false; }
      maximum = true;
      applyState();
      if (body.requestFullscreen) body.requestFullscreen();
    }
  }

  document.addEventListener('fullscreenchange', function() {
    if (document.fullscreenElement) {
      btnFullscreen.innerHTML = ICON_SHRINK;
      btnFullscreen.classList.add('active');
    } else {
      btnFullscreen.innerHTML = ICON_FULLSCREEN;
      btnFullscreen.classList.remove('active');
    }
  });

  /* -- More menu --------------------------------------------------- */
  function closeMenu() { navMenu.classList.remove('open'); }
  function toggleMenu(e) {
    e.stopPropagation();
    navMenu.classList.toggle('open');
  }
  btnMore.addEventListener('click', toggleMenu);
  document.addEventListener('click', function(e) {
    if (!navMenu.contains(e.target) && e.target !== btnMore) closeMenu();
  });
  navMenu.addEventListener('click', function(e) { e.stopPropagation(); });

  /* -- Grid click to single view ----------------------------------- */
  slides.forEach(function(s, i) {
    s.addEventListener('click', function() {
      if (!gridOn) return;
      current = i;
      gridOn = false;
      applyState();
    });
  });

  /* -- Button events ----------------------------------------------- */
  btnPrev.addEventListener('click', function(e) { e.stopPropagation(); showSlide(current - 1); });
  btnNext.addEventListener('click', function(e) { e.stopPropagation(); showSlide(current + 1); });
  btnMaximum.addEventListener('click', function() { closeMenu(); toggleMaximum(); });
  btnGrid.addEventListener('click', function() { closeMenu(); toggleGrid(); });
  btnFullscreen.addEventListener('click', toggleFullscreen);

  /* -- Keyboard ---------------------------------------------------- */
  document.addEventListener('keydown', function(e) {
    showNav();
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); showSlide(current + 1); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); showSlide(current - 1); }
    else if (e.key === 'Home') { e.preventDefault(); showSlide(0); }
    else if (e.key === 'End') { e.preventDefault(); showSlide(total - 1); }
    else if (e.key === 'm' || e.key === 'M') { toggleMaximum(); }
    else if (e.key === 'g' || e.key === 'G') { toggleGrid(); }
    else if (e.key === 'f' || e.key === 'F') { toggleFullscreen(); }
    else if (e.key === 'Escape') {
      closeMenu();
      if (document.fullscreenElement) document.exitFullscreen();
      else if (gridOn) { gridOn = false; applyState(); }
    }
  });

  /* -- Menu labels ------------------------------------------------- */
  function updateMenuLabels() {
    var maxLabel = btnMaximum.querySelector('.menu-label');
    if (maxLabel) maxLabel.textContent = maximum ? 'Maximum off' : 'Maximum on';
    var gridLabel = btnGrid.querySelector('.menu-label');
    if (gridLabel) gridLabel.textContent = gridOn ? 'Grid off' : 'Grid on';
  }

  /* -- Slide scaling via ResizeObserver ----------------------------- */
  var SLIDE_W = 1200;
  var SLIDE_H = 675;

  function updateScale(outer) {
    var w = outer.clientWidth;
    var h = outer.clientHeight;
    if (w === 0 || h === 0) return;
    var s = Math.min(w / SLIDE_W, h / SLIDE_H);
    outer.style.setProperty('--s', s);
  }

  var ro = new ResizeObserver(function(entries) {
    entries.forEach(function(entry) { updateScale(entry.target); });
  });

  slides.forEach(function(s) { ro.observe(s); });

  /* -- State badges ------------------------------------------------ */
  var BADGE_LABELS = { generated: 'GEN', approved: 'APR', locked: 'LCK', derived: 'DER' };
  slides.forEach(function(s) {
    var state = s.getAttribute('data-state') || 'generated';
    var badge = document.createElement('span');
    badge.className = 'state-badge';
    badge.setAttribute('data-badge', state);
    badge.textContent = BADGE_LABELS[state] || state.toUpperCase().slice(0, 3);
    s.appendChild(badge);
  });

  /* -- Init -------------------------------------------------------- */
  applyState();
  showNav();
})();
`;
