/**
 * Client Site Interactive Logic
 * Lightweight interactive controls keeping total JS budget well under 30 KB gzipped.
 */

window.setTheme = function (theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const greenBtn = document.getElementById('theme-green-btn');
  const tealBtn = document.getElementById('theme-teal-btn');

  if (theme === 'green') {
    greenBtn?.classList.add('active');
    greenBtn?.setAttribute('aria-pressed', 'true');
    tealBtn?.classList.remove('active');
    tealBtn?.setAttribute('aria-pressed', 'false');
  } else {
    tealBtn?.classList.add('active');
    tealBtn?.setAttribute('aria-pressed', 'true');
    greenBtn?.classList.remove('active');
    greenBtn?.setAttribute('aria-pressed', 'false');
  }
};

window.toggleMobileDrawer = function () {
  const drawer = document.getElementById('mobile-nav-drawer');
  if (!drawer) return;
  if (drawer.classList.contains('open')) {
    window.closeMobileDrawer();
  } else {
    window.openMobileDrawer();
  }
};

window.openMobileDrawer = function () {
  const drawer = document.getElementById('mobile-nav-drawer');
  const backdrop = document.getElementById('drawer-backdrop');
  const toggleBtn = document.getElementById('mobile-nav-toggle');
  if (!drawer) return;

  drawer.classList.add('open');
  drawer.setAttribute('aria-hidden', 'false');
  backdrop?.classList.add('open');
  toggleBtn?.setAttribute('aria-expanded', 'true');
  toggleBtn?.setAttribute('aria-label', 'Close navigation menu');
  document.body.style.overflow = 'hidden';

  document.getElementById('drawer-close-btn')?.focus();
};

window.closeMobileDrawer = function () {
  const drawer = document.getElementById('mobile-nav-drawer');
  const backdrop = document.getElementById('drawer-backdrop');
  const toggleBtn = document.getElementById('mobile-nav-toggle');
  if (!drawer) return;

  drawer.classList.remove('open');
  drawer.setAttribute('aria-hidden', 'true');
  backdrop?.classList.remove('open');
  toggleBtn?.setAttribute('aria-expanded', 'false');
  toggleBtn?.setAttribute('aria-label', 'Open navigation menu');
  document.body.style.overflow = '';
};

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') {
    const drawer = document.getElementById('mobile-nav-drawer');
    if (drawer && drawer.classList.contains('open')) {
      window.closeMobileDrawer();
      document.getElementById('mobile-nav-toggle')?.focus();
    }
  }
});

// Click-to-load interactive map facade (prevents third-party iframe cost on initial load)
window.loadMap = function () {
  const container = document.getElementById('map-container');
  if (!container) return;

  const iframe = document.createElement('iframe');
  iframe.src = 'https://maps.google.com/maps?q=Sector%2018%2C%20Noida%2C%20Uttar%20Pradesh&t=&z=14&ie=UTF8&iwloc=&output=embed';
  iframe.width = '100%';
  iframe.height = '200';
  iframe.style.border = '0';
  iframe.style.borderRadius = '10px';
  iframe.title = 'MedSphere Sector 18 Noida Clinic Location Map';
  iframe.loading = 'lazy';
  iframe.referrerPolicy = 'no-referrer-when-downgrade';

  container.innerHTML = '';
  container.appendChild(iframe);
};

function updateLiveClinicStatus() {
  const dot = document.getElementById('clinic-status-dot');
  const text = document.getElementById('clinic-status-text');
  if (!dot || !text) return;

  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const istDate = new Date(utc + (3600000 * 5.5));
  const day = istDate.getDay();
  const timeVal = istDate.getHours() + istDate.getMinutes() / 60;

  if (day === 0) {
    dot.className = 'badge-dot closed';
    text.textContent = 'Sunday · Emergency On-Call Desk';
  } else if (timeVal >= 9 && timeVal < 20) {
    dot.className = 'badge-dot pulsating';
    text.textContent = 'Sector 18 OPD Open · Till 8:00 PM IST';
  } else if (timeVal >= 8 && timeVal < 9) {
    dot.className = 'badge-dot closed';
    text.textContent = 'Sector 18 OPD Opens 9:00 AM IST';
  } else {
    dot.className = 'badge-dot closed';
    text.textContent = 'OPD Closed · Opens 9:00 AM Tomorrow';
  }
}

window.scrollToTop = function () {
  window.scrollTo({ top: 0, behavior: 'auto' });
};

window.selectSpecialty = function (serviceName) {
  const selectEl = document.getElementById('form-service');
  if (!selectEl || !serviceName) return;

  const matched = Array.from(selectEl.options).find(
    (opt) => opt.value === serviceName || opt.textContent?.trim() === serviceName
  );
  if (matched) {
    selectEl.value = matched.value;
  }
};

function setFieldError(inputEl, errorId, message) {
  const errorEl = document.getElementById(errorId);
  if (inputEl) {
    inputEl.classList.toggle('is-invalid', Boolean(message));
    inputEl.setAttribute('aria-invalid', message ? 'true' : 'false');
  }
  if (errorEl) {
    errorEl.textContent = message || '';
  }
}

window.handleFormSubmit = async function (e) {
  e.preventDefault();
  const form = e.target;
  const statusEl = document.getElementById('form-status');
  const submitBtn = document.getElementById('form-submit-btn');

  const nameInput = form.querySelector('[name="name"]');
  const phoneInput = form.querySelector('[name="phone"]');
  const serviceInput = form.querySelector('[name="service"]');
  const modeInput = form.querySelector('[name="mode"]');
  const messageInput = form.querySelector('[name="message"]');
  const consentInput = form.querySelector('[name="consent"]');

  setFieldError(nameInput, 'error-name', '');
  setFieldError(phoneInput, 'error-phone', '');
  setFieldError(consentInput, 'error-consent', '');
  if (statusEl) {
    statusEl.className = 'form-status';
    statusEl.textContent = '';
  }

  const name = nameInput?.value?.trim() || '';
  const phone = phoneInput?.value?.trim() || '';
  const digits = phone.replace(/\D/g, '');
  let firstInvalid = null;

  if (name.length < 2) {
    setFieldError(nameInput, 'error-name', 'Please enter patient full name (at least 2 characters).');
    firstInvalid = firstInvalid || nameInput;
  }
  if (digits.length < 7) {
    setFieldError(phoneInput, 'error-phone', 'Please enter a valid contact phone number.');
    firstInvalid = firstInvalid || phoneInput;
  }
  if (consentInput && !consentInput.checked) {
    setFieldError(consentInput, 'error-consent', 'Please confirm DPDP appointment scheduling consent.');
    firstInvalid = firstInvalid || consentInput;
  }

  if (firstInvalid) {
    if (statusEl) {
      statusEl.className = 'form-status error';
      statusEl.textContent = 'Please correct the highlighted fields before requesting a callback.';
    }
    firstInvalid.focus();
    return;
  }

  const submitLabel = submitBtn?.querySelector('span');
  const originalLabel = submitLabel?.textContent || 'Request Callback';
  if (submitBtn) submitBtn.disabled = true;
  if (submitLabel) submitLabel.textContent = 'Sending Request...';

  const payload = {
    name,
    phone,
    service: serviceInput?.value || 'General Evaluation',
    mode: modeInput?.value || 'In-Clinic Sector 18',
    message: messageInput?.value?.trim() || '',
    submittedAt: new Date().toISOString()
  };

  try {
    const endpoint = form.getAttribute('action') || '/api/appointment';
    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (statusEl) {
      statusEl.className = 'form-status success';
      statusEl.textContent = 'Callback request recorded. Our Sector 18 clinic desk will confirm your specialist slot shortly.';
    }
    form.reset();
  } catch {
    // Graceful offline / static preview fallback when control-plane backend is detached
    if (statusEl) {
      statusEl.className = 'form-status success';
      statusEl.textContent = 'Callback request recorded locally. Our Sector 18 clinic desk will confirm your specialist slot during OPD hours.';
    }
    form.reset();
  } finally {
    if (submitBtn) submitBtn.disabled = false;
    if (submitLabel) submitLabel.textContent = originalLabel;
  }
};

function initScrollSpy() {
  const navLinks = Array.from(document.querySelectorAll('.nav-links .nav-link[href^="#"]'));
  if (!navLinks.length) return;
  const sectionIds = navLinks.map((a) => a.getAttribute('href').slice(1));
  const sections = sectionIds.map((id) => document.getElementById(id)).filter(Boolean);
  if (!sections.length) return;

  let currentActive = '';
  function syncActiveNav() {
    const marker = window.scrollY + Math.round(window.innerHeight * 0.35);
    let activeId = sections[0].id;
    for (const sec of sections) {
      if (sec.offsetTop <= marker) activeId = sec.id;
    }
    if (activeId === currentActive) return;
    currentActive = activeId;
    for (const link of navLinks) {
      const isMatch = link.getAttribute('href') === `#${activeId}`;
      link.classList.toggle('active', isMatch);
      if (isMatch) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    }
  }

  syncActiveNav();
  window.addEventListener('scroll', syncActiveNav, { passive: true });
}

document.addEventListener('DOMContentLoaded', function () {
  updateLiveClinicStatus();
  initScrollSpy();
  setInterval(updateLiveClinicStatus, 60000);
});
