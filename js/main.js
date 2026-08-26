// ============================================================
//  Star Tailor — Main JavaScript
//  Handles: Nav, scroll animations, parallax, gallery,
//           lightbox, form submission
// ============================================================

(function () {
  'use strict';

  // ── Utility ─────────────────────────────────────────────────
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Navigation ───────────────────────────────────────────────
  const nav         = $('#site-nav');
  const hamburger   = $('#nav-hamburger');
  const mobileMenu  = $('#nav-mobile-menu');

  // Sticky nav shadow on scroll
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });

  // Hamburger toggle
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const isOpen = hamburger.classList.toggle('open');
      mobileMenu.classList.toggle('open', isOpen);
      hamburger.setAttribute('aria-expanded', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
  }

  // Close mobile menu on link click
  $$('#nav-mobile-menu a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      mobileMenu.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  // Smooth scroll for all anchor links
  $$('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const target = $(link.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const offset = nav ? nav.offsetHeight + 8 : 0;
      window.scrollTo({
        top: target.getBoundingClientRect().top + window.scrollY - offset,
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      });
    });
  });

  // ── Scroll Reveal (IntersectionObserver) ─────────────────────
  if (!prefersReducedMotion) {
    const revealObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    $$('.reveal').forEach(el => revealObserver.observe(el));
  } else {
    $$('.reveal').forEach(el => el.classList.add('visible'));
  }

  // ── Parallax (hero) ──────────────────────────────────────────
  if (!prefersReducedMotion) {
    const heroBg = $('#hero-parallax');
    if (heroBg) {
      window.addEventListener('scroll', () => {
        const y = window.scrollY;
        heroBg.style.transform = `translateY(${y * 0.3}px)`;
      }, { passive: true });
    }
  }

  // ── Gallery Filter ───────────────────────────────────────────
  const filterBtns  = $$('.filter-btn');
  const galleryItems = $$('.gallery-item');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;

      galleryItems.forEach(item => {
        if (filter === 'all' || item.dataset.category === filter) {
          item.style.display = '';
          requestAnimationFrame(() => {
            item.style.opacity = '1';
            item.style.transform = '';
          });
        } else {
          item.style.opacity = '0';
          item.style.transform = 'scale(0.95)';
          setTimeout(() => {
            if (item.style.opacity === '0') item.style.display = 'none';
          }, 300);
        }
      });
    });
  });

  // ── Lightbox ─────────────────────────────────────────────────
  const lightbox     = $('#lightbox');
  const lightboxImg  = $('#lightbox-img-area');
  const lightboxClose = $('#lightbox-close');

  function openLightbox(item) {
    if (!lightbox) return;
    const label = item.querySelector('.gallery-item-ph .ph-label')?.textContent || 'Photo';
    if (lightboxImg) {
      lightboxImg.innerHTML = `<div style="text-align:center;color:rgba(255,255,255,0.5);font-size:0.9rem;padding:2rem;">
        <div style="font-size:2rem;margin-bottom:1rem;">🖼</div>
        <p style="font-weight:600;color:rgba(255,255,255,0.7);margin-bottom:0.5rem;">${label}</p>
        <p style="font-size:0.8rem;">Replace placeholders with real photos</p>
      </div>`;
    }
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
    lightboxClose.focus();
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }

  galleryItems.forEach(item => {
    item.addEventListener('click', () => openLightbox(item));
    item.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') openLightbox(item); });
    item.setAttribute('tabindex', '0');
    item.setAttribute('role', 'button');
  });

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightbox) {
    lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeLightbox();
  });

  // ── Shared Validation Helpers ─────────────────────────────────
  function isValidPhone(val) {
    const digits = val.replace(/\D/g, '');
    return digits.length === 10;
  }
  function isValidEmail(val) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val.trim());
  }
  function setFieldError(input, msg) {
    input.classList.add('field-error');
    let hint = input.parentElement.querySelector('.field-hint');
    if (!hint) {
      hint = document.createElement('span');
      hint.className = 'field-hint';
      input.parentElement.appendChild(hint);
    }
    hint.textContent = msg;
    hint.classList.add('show');
  }
  function clearFieldError(input) {
    input.classList.remove('field-error');
    const hint = input.parentElement.querySelector('.field-hint');
    if (hint) hint.classList.remove('show');
  }
  function attachFieldValidation(phoneInput, emailInput) {
    if (phoneInput) {
      phoneInput.addEventListener('input', () => {
        const digits = phoneInput.value.replace(/\D/g, '');
        if (digits.length > 0 && digits.length < 10) {
          setFieldError(phoneInput, `⚠ Phone must be 10 digits — you entered ${digits.length}`);
        } else if (digits.length > 10) {
          setFieldError(phoneInput, '⚠ Phone number cannot be more than 10 digits');
        } else {
          clearFieldError(phoneInput);
        }
      });
      phoneInput.addEventListener('blur', () => {
        const digits = phoneInput.value.replace(/\D/g, '');
        if (phoneInput.value && digits.length !== 10) {
          setFieldError(phoneInput, `⚠ Invalid phone — must be exactly 10 digits (you entered ${digits.length})`);
        } else if (phoneInput.value) {
          clearFieldError(phoneInput);
        }
      });
    }
    if (emailInput) {
      emailInput.addEventListener('blur', () => {
        if (emailInput.value && !isValidEmail(emailInput.value)) {
          setFieldError(emailInput, '⚠ Invalid email address — please re-enter (e.g. name@gmail.com)');
        } else {
          clearFieldError(emailInput);
        }
      });
      emailInput.addEventListener('input', () => {
        if (isValidEmail(emailInput.value)) clearFieldError(emailInput);
      });
    }
  }

  // ── Requirement Form ──────────────────────────────────────────
  const reqForm = $('#requirement-form-el');
  if (reqForm) {
    attachFieldValidation($('#req-phone'), $('#req-email'));

    reqForm.addEventListener('submit', async e => {
      e.preventDefault();
      const btn = reqForm.querySelector('.form-submit-btn');
      const successMsg = $('#req-success');
      const errorMsg   = $('#req-error');

      // ── Validate before submit
      const phoneVal = $('#req-phone').value;
      const emailVal = $('#req-email').value;
      let hasError = false;

      if (phoneVal.replace(/\D/g, '').length !== 10) {
        setFieldError($('#req-phone'), `⚠ Phone must be exactly 10 digits (you entered ${phoneVal.replace(/\D/g, '').length})`);
        hasError = true;
      }
      if (emailVal && !isValidEmail(emailVal)) {
        setFieldError($('#req-email'), '⚠ Invalid email address — please re-enter (e.g. name@gmail.com)');
        hasError = true;
      }
      if (hasError) {
        reqForm.querySelector('.field-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Sending…';
      if (errorMsg) errorMsg.classList.remove('show');

      try {
        const formData = new FormData(reqForm);
        const res  = await fetch('/api/requirement', { method: 'POST', body: formData });
        const data = await res.json();

        if (data.success) {
          reqForm.reset();
          $$('.field-hint', reqForm).forEach(h => h.classList.remove('show'));
          $$('.field-error', reqForm).forEach(f => f.classList.remove('field-error'));
          if (successMsg) {
            successMsg.classList.add('show');
            successMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        } else {
          throw new Error(data.message || 'Submission failed');
        }
      } catch (err) {
        if (errorMsg) {
          errorMsg.textContent = err.message || 'Something went wrong. Please try again.';
          errorMsg.classList.add('show');
        }
      } finally {
        btn.disabled = false;
        btn.textContent = 'Send My Requirement';
      }
    });
  }

  // ── Appointment Form ─────────────────────────────────────────
  const apptForm = $('#appointment-form-el');
  if (apptForm) {
    attachFieldValidation($('#appt-phone'), $('#appt-email'));

    apptForm.addEventListener('submit', async e => {
      e.preventDefault();
      const btn = apptForm.querySelector('.form-submit-btn');
      const successMsg = $('#appt-success');
      const errorMsg   = $('#appt-error');

      // ── Validate before submit
      const phoneVal = $('#appt-phone')?.value || '';
      const emailVal = $('#appt-email')?.value || '';
      let hasError = false;

      if (phoneVal.replace(/\D/g, '').length !== 10) {
        setFieldError($('#appt-phone'), `⚠ Phone must be exactly 10 digits (you entered ${phoneVal.replace(/\D/g, '').length})`);
        hasError = true;
      }
      if (emailVal && !isValidEmail(emailVal)) {
        setFieldError($('#appt-email'), '⚠ Invalid email address — please re-enter (e.g. name@gmail.com)');
        hasError = true;
      }
      if (hasError) {
        apptForm.querySelector('.field-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Sending…';
      if (errorMsg) errorMsg.classList.remove('show');

      try {
        const formData = new FormData(apptForm);
        const body = {};
        formData.forEach((v, k) => { body[k] = v; });
        const res  = await fetch('/api/appointment', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(body),
        });
        const data = await res.json();

        if (data.success) {
          apptForm.reset();
          $$('.field-hint', apptForm).forEach(h => h.classList.remove('show'));
          $$('.field-error', apptForm).forEach(f => f.classList.remove('field-error'));
          if (successMsg) {
            successMsg.classList.add('show');
            successMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        } else {
          throw new Error(data.message || 'Submission failed');
        }
      } catch (err) {
        if (errorMsg) {
          errorMsg.textContent = err.message || 'Something went wrong. Please try again.';
          errorMsg.classList.add('show');
        }
      } finally {
        btn.disabled = false;
        btn.textContent = 'Request Appointment';
      }
    });
  }

  // ── File Upload Label ────────────────────────────────────────
  const fileInput = $('#reference-image-input');
  const fileLabel = $('#file-upload-label-text');
  if (fileInput && fileLabel) {
    fileInput.addEventListener('change', () => {
      fileLabel.textContent = fileInput.files.length
        ? fileInput.files[0].name
        : 'Click to upload a reference image (JPG, PNG — max 5 MB)';
    });
  }

  // ── Custom Clock Time Picker ──────────────────────────────────
  (function initClockPicker() {
    const trigger   = $('#clock-picker-trigger');
    const dropdown  = $('#clock-dropdown');
    const display   = $('#clock-display');
    const hiddenInput = $('#appt-time');
    const slotsWrap = $('#clock-slots');
    const selectedLabel = $('#clock-selected-label');
    const hourHand  = $('#clock-hour-hand');
    const minHand   = $('#clock-min-hand');
    const amBtn     = $('#ampm-am');
    const pmBtn     = $('#ampm-pm');

    if (!trigger || !dropdown) return;

    let currentPeriod = 'AM';
    let selectedTime  = null;

    // ── Generate time slots: 9:00 AM – 8:00 PM, every 30 min
    const AM_SLOTS = ['9:00','9:30','10:00','10:30','11:00','11:30'];
    const PM_SLOTS = ['12:00','12:30','1:00','1:30','2:00','2:30',
                      '3:00','3:30','4:00','4:30','5:00','5:30',
                      '6:00','6:30','7:00','7:30','8:00'];

    function buildSlots(period) {
      slotsWrap.innerHTML = '';
      const slots = period === 'AM' ? AM_SLOTS : PM_SLOTS;
      slots.forEach(t => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'clock-slot';
        btn.textContent = t + ' ' + period;
        btn.setAttribute('role', 'option');
        if (selectedTime === t + ' ' + period) {
          btn.classList.add('selected');
          btn.setAttribute('aria-selected', 'true');
        }
        btn.addEventListener('click', () => selectTime(t, period, btn));
        slotsWrap.appendChild(btn);
      });
    }

    // ── Animate clock hands for a given h:mm string
    function updateClockHands(timeStr, period) {
      const [hStr, mStr] = timeStr.split(':');
      let h = parseInt(hStr, 10);
      const m = parseInt(mStr, 10);
      // Convert to 24h for angle calc
      if (period === 'PM' && h !== 12) h += 12;
      if (period === 'AM' && h === 12) h = 0;

      const hourAngle = ((h % 12) / 12) * 360 + (m / 60) * 30;
      const minAngle  = (m / 60) * 360;

      function handEndpoint(angleDeg, length) {
        const rad = (angleDeg - 90) * Math.PI / 180;
        return { x: 60 + Math.cos(rad) * length, y: 60 + Math.sin(rad) * length };
      }

      const hEnd = handEndpoint(hourAngle, 22);
      const mEnd = handEndpoint(minAngle, 30);

      if (hourHand) { hourHand.setAttribute('x2', hEnd.x); hourHand.setAttribute('y2', hEnd.y); }
      if (minHand)  { minHand.setAttribute('x2', mEnd.x);  minHand.setAttribute('y2', mEnd.y); }
    }

    function selectTime(t, period, btn) {
      selectedTime = t + ' ' + period;
      // Update hidden input & display
      if (hiddenInput) hiddenInput.value = selectedTime;
      if (display) {
        display.textContent = selectedTime;
        trigger.classList.add('has-value');
      }
      if (selectedLabel) selectedLabel.textContent = selectedTime;
      updateClockHands(t, period);
      // Highlight slot
      $$('.clock-slot', slotsWrap).forEach(b => {
        b.classList.toggle('selected', b === btn);
        b.setAttribute('aria-selected', b === btn ? 'true' : 'false');
      });
      // Close after short delay
      setTimeout(closeDropdown, 320);
    }

    // ── AM/PM toggle
    function setPeriod(period) {
      currentPeriod = period;
      amBtn.classList.toggle('active', period === 'AM');
      pmBtn.classList.toggle('active', period === 'PM');
      buildSlots(period);
    }

    if (amBtn) amBtn.addEventListener('click', () => setPeriod('AM'));
    if (pmBtn) pmBtn.addEventListener('click', () => setPeriod('PM'));

    // ── Open / close
    function openDropdown() {
      buildSlots(currentPeriod);
      dropdown.classList.add('open');
      trigger.setAttribute('aria-expanded', 'true');
    }
    function closeDropdown() {
      dropdown.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
    }
    function toggleDropdown() {
      dropdown.classList.contains('open') ? closeDropdown() : openDropdown();
    }

    trigger.addEventListener('click', toggleDropdown);
    trigger.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleDropdown(); }
      if (e.key === 'Escape') closeDropdown();
    });

    // Close on outside click
    document.addEventListener('click', e => {
      const wrap = $('#clock-picker-wrap');
      if (wrap && !wrap.contains(e.target)) closeDropdown();
    });

    // Init clock hands at 9:00 AM
    updateClockHands('9:00', 'AM');
  })();

  // ── Dot grid in hero ─────────────────────────────────────────
  const dotsContainer = $('#hero-dots');
  if (dotsContainer) {
    for (let i = 0; i < 30; i++) {
      const span = document.createElement('span');
      dotsContainer.appendChild(span);
    }
  }

  // ── Step hover highlight ──────────────────────────────────────
  const stepItems = $$('.step-item');
  stepItems.forEach((step, i) => {
    step.addEventListener('mouseenter', () => stepItems.forEach((s, j) => {
      s.classList.toggle('active', j <= i);
    }));
  });
  const stepsGrid = $('.steps-grid');
  if (stepsGrid) {
    stepsGrid.addEventListener('mouseleave', () => {
      stepItems.forEach(s => s.classList.remove('active'));
    });
  }

  // ── Current year in footer ───────────────────────────────────
  const yearEl = $('#current-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ── Flatpickr Date Pickers ────────────────────────────────────
  if (typeof flatpickr !== 'undefined') {
    flatpickr('.datepicker', {
      dateFormat: 'j M Y',
      minDate: 'today',
      disableMobile: false,
      animate: !prefersReducedMotion,
    });
  }

  // ── Hero Canvas — Sewing Machine Animation ────────────────────
  (function initHeroCanvas() {
    const canvas = $('#hero-canvas');
    if (!canvas || prefersReducedMotion) return;
    const ctx = canvas.getContext('2d');
    let W, H, raf, tick = 0;

    function resize() {
      const rect = canvas.parentElement.getBoundingClientRect();
      W = canvas.width  = Math.round(rect.width);
      H = canvas.height = Math.round(rect.height);
    }
    resize();
    window.addEventListener('resize', () => { resize(); buildParticles(); }, { passive: true });

    // ── Color palette
    const C = {
      gold:      'rgba(184,150,62,',
      rose:      'rgba(201,140,140,',
      cream:     'rgba(245,238,225,',
      charcoal:  'rgba(44,44,44,',
      thread:    'rgba(180,148,60,',
    };

    // ── Floating fabric particles ──────────────────────────────
    class Particle {
      constructor() { this.reset(true); }
      reset(init) {
        this.x  = Math.random() * W;
        this.y  = init ? Math.random() * H : H + 20;
        this.vy = -(0.18 + Math.random() * 0.32);
        this.vx = (Math.random() - 0.5) * 0.25;
        this.r  = 1.2 + Math.random() * 2.5;
        this.a  = 0;
        this.maxA = 0.07 + Math.random() * 0.1;
        this.col = Math.random() > 0.5 ? C.gold : C.rose;
        this.phase = init ? 'alive' : 'fadein';
        if (init) this.a = this.maxA;
      }
      update() {
        this.y += this.vy;
        this.x += this.vx;
        if (this.phase === 'fadein') {
          this.a += 0.005;
          if (this.a >= this.maxA) { this.a = this.maxA; this.phase = 'alive'; }
        }
        if (this.phase === 'alive' && this.y < H * 0.1) this.phase = 'fadeout';
        if (this.phase === 'fadeout') {
          this.a -= 0.003;
          if (this.a <= 0) this.reset(false);
        }
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = this.col + this.a + ')';
        ctx.fill();
      }
    }

    let particles = [];
    function buildParticles() {
      const count = Math.round(W * H / 14000);
      particles = Array.from({ length: Math.max(18, count) }, () => new Particle());
    }
    buildParticles();

    // ── Thread stitch line ─────────────────────────────────────
    class StitchLine {
      constructor(delay) { this.delay = delay; this._init(); }
      _init() {
        // horizontal stitch line at random height
        this.y     = H * (0.25 + Math.random() * 0.55);
        this.x     = -60;
        this.speed = 0.55 + Math.random() * 0.45;
        this.a     = 0;
        this.maxA  = 0.10 + Math.random() * 0.10;
        this.dash  = 8 + Math.random() * 6;
        this.gap   = 5 + Math.random() * 5;
        this.col   = Math.random() > 0.5 ? C.gold : C.rose;
        this.lw    = 0.8 + Math.random() * 0.8;
        this.phase = 'fadein';
        this.done  = false;
        this.delay = Math.random() * 180;
      }
      update() {
        if (this.delay > 0) { this.delay--; return; }
        if (this.phase === 'fadein') {
          this.a += 0.006;
          if (this.a >= this.maxA) { this.a = this.maxA; this.phase = 'draw'; }
        }
        if (this.phase === 'draw') {
          this.x += this.speed;
          if (this.x > W + 60) this.phase = 'fadeout';
        }
        if (this.phase === 'fadeout') {
          this.a -= 0.004;
          if (this.a <= 0) this._init();
        }
      }
      draw() {
        if (this.a <= 0 || this.delay > 0) return;
        ctx.save();
        ctx.setLineDash([this.dash, this.gap]);
        ctx.lineDashOffset = -tick * this.speed * 0.5;
        ctx.beginPath();
        ctx.moveTo(-60, this.y);
        ctx.lineTo(this.x, this.y);
        ctx.strokeStyle = this.col + this.a + ')';
        ctx.lineWidth = this.lw;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.restore();
        // needle tip glow at end
        if (this.phase === 'draw') {
          const grd = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, 5);
          grd.addColorStop(0, this.col + Math.min(this.a * 5, 0.7) + ')');
          grd.addColorStop(1, this.col + '0)');
          ctx.beginPath(); ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
          ctx.fillStyle = grd; ctx.fill();
        }
      }
    }

    const stitches = Array.from({ length: 5 }, (_, i) => new StitchLine(i * 70));

    // ── Sewing machines ────────────────────────────────────────
    // Draw one stylised sewing machine silhouette centred on (cx, cy)
    // scale: e.g. 1.0 = full size (~260×200 px)
    function drawMachine(cx, cy, scale, alpha, wheelAngle) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(cx, cy);
      ctx.scale(scale, scale);

      const gc = C.cream;   // body color
      const ga = C.gold;    // accent
      const rc = C.charcoal;

      // ── Machine base / table ──
      ctx.beginPath();
      ctx.roundRect(-130, 60, 260, 22, 4);
      ctx.fillStyle = gc + '0.55)';
      ctx.fill();
      ctx.strokeStyle = ga + '0.25)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // ── Machine body (main block) ──
      ctx.beginPath();
      ctx.roundRect(-110, -60, 200, 122, 12);
      ctx.fillStyle = gc + '0.4)';
      ctx.fill();
      ctx.strokeStyle = ga + '0.2)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // ── Head (upper right curved bump) ──
      ctx.beginPath();
      ctx.moveTo(50, -60);
      ctx.quadraticCurveTo(105, -60, 105, -10);
      ctx.lineTo(105, 45);
      ctx.lineTo(50, 45);
      ctx.closePath();
      ctx.fillStyle = gc + '0.45)';
      ctx.fill();
      ctx.strokeStyle = ga + '0.2)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // ── Arm (top horizontal bar) ──
      ctx.beginPath();
      ctx.roundRect(-110, -85, 215, 28, 8);
      ctx.fillStyle = gc + '0.5)';
      ctx.fill();
      ctx.strokeStyle = ga + '0.22)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // ── Bobbin wheel (right side) ──
      const wx = 90, wy = -70;
      // outer ring
      ctx.beginPath();
      ctx.arc(wx, wy, 28, 0, Math.PI * 2);
      ctx.strokeStyle = ga + '0.35)';
      ctx.lineWidth = 3;
      ctx.stroke();
      // spokes
      for (let s = 0; s < 6; s++) {
        const ang = wheelAngle + (s / 6) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(wx + Math.cos(ang) * 6, wy + Math.sin(ang) * 6);
        ctx.lineTo(wx + Math.cos(ang) * 26, wy + Math.sin(ang) * 26);
        ctx.strokeStyle = ga + '0.30)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      // hub
      ctx.beginPath();
      ctx.arc(wx, wy, 6, 0, Math.PI * 2);
      ctx.fillStyle = ga + '0.5)';
      ctx.fill();

      // ── Thread spool on top ──
      ctx.beginPath();
      ctx.ellipse(-60, -96, 14, 7, 0, 0, Math.PI * 2);
      ctx.fillStyle = ga + '0.25)';
      ctx.fill();
      ctx.beginPath();
      ctx.roundRect(-68, -100, 16, 10, 2);
      ctx.fillStyle = C.rose + '0.30)';
      ctx.fill();
      ctx.strokeStyle = ga + '0.18)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // ── Thread line from spool to needle ──
      ctx.beginPath();
      ctx.moveTo(-60, -90);
      ctx.quadraticCurveTo(20, -60, 90, 30);
      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = ga + '0.22)';
      ctx.lineWidth = 0.8;
      ctx.stroke();
      ctx.setLineDash([]);

      // ── Needle arm + needle ──
      const needleX = 90;
      const needleTopY = 20;
      // vertical needle bar
      ctx.beginPath();
      ctx.roundRect(needleX - 2, needleTopY, 4, 50, 2);
      ctx.fillStyle = ga + '0.4)';
      ctx.fill();
      // needle tip
      ctx.beginPath();
      ctx.moveTo(needleX - 1.5, needleTopY + 50);
      ctx.lineTo(needleX,       needleTopY + 62);
      ctx.lineTo(needleX + 1.5, needleTopY + 50);
      ctx.fillStyle = C.cream + '0.7)';
      ctx.fill();
      // needle eye
      ctx.beginPath();
      ctx.ellipse(needleX, needleTopY + 55, 1.5, 3, 0, 0, Math.PI * 2);
      ctx.strokeStyle = ga + '0.5)';
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // ── Presser foot ──
      ctx.beginPath();
      ctx.roundRect(needleX - 10, needleTopY + 60, 20, 5, 2);
      ctx.fillStyle = C.charcoal + '0.20)';
      ctx.fill();

      // ── Decorative panel lines ──
      for (let li = 0; li < 3; li++) {
        ctx.beginPath();
        ctx.moveTo(-100, -40 + li * 22);
        ctx.lineTo(40, -40 + li * 22);
        ctx.strokeStyle = ga + '0.08)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      ctx.restore();
    }

    // ── Place machines at fixed positions ─────────────────────
    // [ cx_frac, cy_frac, scale, maxAlpha ]
    const MACHINES = [
      [0.82, 0.52, 0.90, 0.13],
      [0.08, 0.60, 0.65, 0.08],
      [0.55, 0.88, 0.50, 0.06],
    ];

    // ── Animate ───────────────────────────────────────────────
    function animate() {
      tick++;
      ctx.clearRect(0, 0, W, H);

      // fabric particles
      particles.forEach(p => { p.update(); p.draw(); });

      // stitch lines
      stitches.forEach(s => { s.update(); s.draw(); });

      // sewing machines
      const wheelAngle = tick * 0.022; // rotating wheel
      MACHINES.forEach(([xf, yf, sc, al]) => {
        drawMachine(W * xf, H * yf, sc, al, wheelAngle);
      });

      raf = requestAnimationFrame(animate);
    }
    animate();

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else animate();
    });
  })();

})();
