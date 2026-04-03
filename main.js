/* ============================================================
   A PAW AFFAIR — main.js
   Nav · Reveal · Carousel (auto + drag/swipe) · Form
============================================================ */
(function () {
  'use strict';

  /* ── Nav scroll ── */
  var nav = document.getElementById('nav');
  function onScroll() {
    nav.classList.toggle('solid', window.pageYOffset > 60);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ── Reveal animations ── */
  var revealEls = document.querySelectorAll('.reveal');
  var ro = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); ro.unobserve(e.target); }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  revealEls.forEach(function (el) { ro.observe(el); });

  /* Immediate hero reveals */
  var heroReveals = document.querySelectorAll('.hero .reveal');
  heroReveals.forEach(function (el) {
    setTimeout(function () { el.classList.add('in'); }, 80);
  });

  /* ── Smooth scroll ── */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var hash = a.getAttribute('href');
      if (hash === '#') return;
      var target = document.querySelector(hash);
      if (!target) return;
      e.preventDefault();
      var offset = nav.offsetHeight + 16;
      var top = target.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top: top, behavior: 'smooth' });
    });
  });

  /* ═══════════════════════════════════════
     CAROUSEL
  ═══════════════════════════════════════ */
  var viewport  = document.getElementById('carouselViewport');
  var track     = document.getElementById('carouselTrack');
  var dotsWrap  = document.getElementById('carouselDots');
  var prevBtn   = document.getElementById('prevBtn');
  var nextBtn   = document.getElementById('nextBtn');

  if (!track) return;

  var cards      = track.querySelectorAll('.review-card');
  var total      = cards.length;
  var current    = 0;
  var autoTimer  = null;
  var AUTO_MS    = 4500;

  /* Build dots */
  var dots = [];
  for (var i = 0; i < total; i++) {
    var d = document.createElement('button');
    d.className = 'carousel-dot';
    d.setAttribute('aria-label', 'Review ' + (i + 1));
    (function (idx) { d.addEventListener('click', function () { goTo(idx); resetAuto(); }); }(i));
    dotsWrap.appendChild(d);
    dots.push(d);
  }

  function getCardWidth() {
    if (!cards[0]) return 0;
    var style = window.getComputedStyle(track);
    var gap = parseFloat(style.gap) || 20;
    return cards[0].offsetWidth + gap;
  }

  function goTo(idx) {
    current = (idx + total) % total;
    var pad = parseFloat(window.getComputedStyle(track).paddingLeft) || 0;
    track.style.transform = 'translateX(calc(-' + (getCardWidth() * current) + 'px))';
    dots.forEach(function (d, i) { d.classList.toggle('active', i === current); });
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  function startAuto() {
    autoTimer = setInterval(next, AUTO_MS);
  }
  function resetAuto() {
    clearInterval(autoTimer);
    startAuto();
  }

  nextBtn.addEventListener('click', function () { next(); resetAuto(); });
  prevBtn.addEventListener('click', function () { prev(); resetAuto(); });

  /* Drag/swipe */
  var dragStart = null;
  var dragging  = false;

  function onDragStart(x) { dragStart = x; dragging = false; }
  function onDragEnd(x) {
    if (dragStart === null) return;
    var diff = dragStart - x;
    if (Math.abs(diff) > 40) { diff > 0 ? next() : prev(); resetAuto(); }
    dragStart = null; dragging = false;
  }

  viewport.addEventListener('mousedown',  function (e) { onDragStart(e.clientX); });
  viewport.addEventListener('mouseup',    function (e) { onDragEnd(e.clientX); });
  viewport.addEventListener('mouseleave', function (e) { onDragEnd(e.clientX); });
  viewport.addEventListener('touchstart', function (e) { onDragStart(e.touches[0].clientX); }, { passive: true });
  viewport.addEventListener('touchend',   function (e) { onDragEnd(e.changedTouches[0].clientX); });

  /* Pause on hover */
  viewport.addEventListener('mouseenter', function () { clearInterval(autoTimer); });
  viewport.addEventListener('mouseleave', function () { startAuto(); });

  /* Init */
  goTo(0);
  startAuto();

  /* Recalc on resize */
  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { goTo(current); }, 150);
  });

  /* ═══════════════════════════════════════
     FORM
  ═══════════════════════════════════════ */
  var form      = document.getElementById('contactForm');
  var success   = document.getElementById('formSuccess');
  var submitBtn = document.getElementById('submitBtn');
  if (!form) return;

  function showErr(fId, eId) {
    document.getElementById(fId).classList.add('error');
    document.getElementById(eId).classList.add('show');
  }
  function clearErr(fId, eId) {
    document.getElementById(fId).classList.remove('error');
    document.getElementById(eId).classList.remove('show');
  }

  [['name','nameErr'],['email','emailErr'],['message','msgErr']].forEach(function (p) {
    var el = document.getElementById(p[0]);
    if (el) el.addEventListener('input', function () { clearErr(p[0], p[1]); });
  });

  function validate() {
    var ok = true;
    var name  = document.getElementById('name');
    var email = document.getElementById('email');
    var msg   = document.getElementById('message');
    if (!name.value.trim())  { showErr('name', 'nameErr');  ok = false; } else { clearErr('name', 'nameErr'); }
    var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.value.trim() || !re.test(email.value.trim())) { showErr('email', 'emailErr'); ok = false; } else { clearErr('email', 'emailErr'); }
    if (!msg.value.trim())   { showErr('message', 'msgErr'); ok = false; } else { clearErr('message', 'msgErr'); }
    return ok;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate()) return;
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');
    fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { 'Accept': 'application/json' }
    })
    .then(function (res) {
      if (res.ok) {
        form.style.display = 'none';
        success.classList.add('show');
        success.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        res.json().then(function (data) {
          var msg = (data && data.errors) ? data.errors.map(function (e) { return e.message; }).join(', ') : 'Something went wrong. Please call us at 603-391-6559.';
          showServerErr(msg);
        }).catch(function () { showServerErr('Something went wrong. Please call us at 603-391-6559.'); });
      }
    })
    .catch(function () { showServerErr('Network error. Please call or text 603-391-6559.'); })
    .finally(function () { submitBtn.disabled = false; submitBtn.classList.remove('loading'); });
  });

  function showServerErr(msg) {
    var ex = form.querySelector('.srv-err');
    if (ex) ex.remove();
    var p = document.createElement('p');
    p.className = 'srv-err';
    p.style.cssText = 'color:#c0392b;font-size:0.85rem;text-align:center;margin-top:0.5rem;';
    p.textContent = msg;
    form.appendChild(p);
  }

}());
