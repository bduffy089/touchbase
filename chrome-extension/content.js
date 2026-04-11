(function () {
  'use strict';

  const BUTTON_ID = 'touchbase-import-btn';
  const TOAST_ID = 'touchbase-toast';

  function getSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(
        { touchbaseUrl: 'http://localhost:3000', apiKey: '' },
        resolve,
      );
    });
  }

  // --- Scraping ---

  function waitForSelector(selector, timeout = 5000) {
    return new Promise((resolve) => {
      const el = document.querySelector(selector);
      if (el) return resolve(el);

      const observer = new MutationObserver(() => {
        const found = document.querySelector(selector);
        if (found) {
          observer.disconnect();
          resolve(found);
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });

      setTimeout(() => {
        observer.disconnect();
        resolve(null);
      }, timeout);
    });
  }

  function scrapeProfile() {
    const parts = [];

    // Name
    const nameEl = document.querySelector('h1');
    if (nameEl) parts.push('Name: ' + nameEl.textContent.trim());

    // Headline
    const headlineEl = document.querySelector('.text-body-medium');
    if (headlineEl) parts.push('Headline: ' + headlineEl.textContent.trim());

    // Location
    const locationEl = document.querySelector('.text-body-small.inline.t-black--light.break-words');
    if (locationEl) parts.push('Location: ' + locationEl.textContent.trim());

    // About section
    const aboutSection = document.querySelector('#about');
    if (aboutSection) {
      const aboutContainer = aboutSection.closest('section');
      if (aboutContainer) {
        const aboutText = aboutContainer.querySelector('.display-flex .inline-show-more-text, .display-flex span[aria-hidden="true"]');
        if (aboutText) parts.push('About: ' + aboutText.textContent.trim());
      }
    }

    // Experience section
    const expSection = document.querySelector('#experience');
    if (expSection) {
      const expContainer = expSection.closest('section');
      if (expContainer) {
        const expItems = expContainer.querySelectorAll('li.artdeco-list__item');
        const experiences = [];
        expItems.forEach((item, i) => {
          if (i >= 3) return; // limit to 3 most recent
          const lines = [];
          const spans = item.querySelectorAll('span[aria-hidden="true"]');
          spans.forEach((s) => {
            const text = s.textContent.trim();
            if (text) lines.push(text);
          });
          if (lines.length > 0) experiences.push(lines.join(' | '));
        });
        if (experiences.length > 0) {
          parts.push('Experience:\n' + experiences.join('\n'));
        }
      }
    }

    // Education section
    const eduSection = document.querySelector('#education');
    if (eduSection) {
      const eduContainer = eduSection.closest('section');
      if (eduContainer) {
        const eduItems = eduContainer.querySelectorAll('li.artdeco-list__item');
        const educations = [];
        eduItems.forEach((item, i) => {
          if (i >= 2) return;
          const lines = [];
          const spans = item.querySelectorAll('span[aria-hidden="true"]');
          spans.forEach((s) => {
            const text = s.textContent.trim();
            if (text) lines.push(text);
          });
          if (lines.length > 0) educations.push(lines.join(' | '));
        });
        if (educations.length > 0) {
          parts.push('Education:\n' + educations.join('\n'));
        }
      }
    }

    return parts.join('\n\n');
  }

  // --- Toast ---

  function showToast(message, isError = false) {
    let toast = document.getElementById(TOAST_ID);
    if (toast) toast.remove();

    toast = document.createElement('div');
    toast.id = TOAST_ID;
    toast.className = 'touchbase-toast' + (isError ? ' touchbase-toast--error' : '');
    toast.textContent = message;
    document.body.appendChild(toast);

    // Trigger reflow for animation
    toast.offsetHeight;
    toast.classList.add('touchbase-toast--visible');

    setTimeout(() => {
      toast.classList.remove('touchbase-toast--visible');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // --- Import Logic ---

  async function handleImport() {
    const btn = document.getElementById(BUTTON_ID);
    if (!btn) return;

    const originalText = btn.textContent;
    btn.textContent = 'Scraping...';
    btn.disabled = true;

    try {
      const settings = await getSettings();
      if (!settings.apiKey) {
        showToast('Set your API key in the TouchBase extension popup', true);
        return;
      }

      const profileText = scrapeProfile();
      if (!profileText || profileText.length < 10) {
        showToast('Could not scrape profile. Make sure you are on a LinkedIn profile page.', true);
        return;
      }

      btn.textContent = 'Parsing...';

      // Step 1: Parse with AI
      const baseUrl = settings.touchbaseUrl.replace(/\/+$/, '');
      const headers = {
        'Content-Type': 'application/json',
        'X-API-Key': settings.apiKey,
      };

      const parseRes = await fetch(baseUrl + '/api/ai', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'parse-linkedin', text: profileText }),
      });

      if (!parseRes.ok) {
        const err = await parseRes.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to parse profile (HTTP ' + parseRes.status + ')');
      }

      const parsed = await parseRes.json();

      btn.textContent = 'Saving...';

      // Step 2: Create contact
      const contactData = {
        name: parsed.name || '',
        email: parsed.email || null,
        phone: parsed.phone || null,
        company: parsed.company || null,
        how_met: 'LinkedIn',
        notes: buildNotes(parsed),
        cadence_days: 30,
      };

      const createRes = await fetch(baseUrl + '/api/contacts', {
        method: 'POST',
        headers,
        body: JSON.stringify(contactData),
      });

      if (!createRes.ok) {
        const err = await createRes.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create contact (HTTP ' + createRes.status + ')');
      }

      showToast('Added ' + (parsed.name || 'contact') + ' to TouchBase!');
    } catch (err) {
      console.error('[TouchBase]', err);
      showToast(err.message || 'Import failed', true);
    } finally {
      btn.textContent = originalText;
      btn.disabled = false;
    }
  }

  function buildNotes(parsed) {
    const lines = [];
    if (parsed.headline) lines.push('Headline: ' + parsed.headline);
    if (parsed.location) lines.push('Location: ' + parsed.location);
    if (parsed.about) lines.push('About: ' + parsed.about);
    if (parsed.experience && parsed.experience.length > 0) {
      lines.push('Experience: ' + parsed.experience.map((e) =>
        [e.title, e.company, e.duration].filter(Boolean).join(' at ')
      ).join('; '));
    }
    if (parsed.education && parsed.education.length > 0) {
      lines.push('Education: ' + parsed.education.map((e) =>
        [e.school, e.degree].filter(Boolean).join(' - ')
      ).join('; '));
    }
    lines.push('Imported from LinkedIn on ' + new Date().toISOString().split('T')[0]);
    return lines.join('\n');
  }

  // --- Button Injection ---

  function injectButton() {
    if (document.getElementById(BUTTON_ID)) return;

    const btn = document.createElement('button');
    btn.id = BUTTON_ID;
    btn.className = 'touchbase-import-btn';
    btn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <line x1="19" y1="8" x2="19" y2="14"/>
        <line x1="16" y1="11" x2="22" y2="11"/>
      </svg>
      Add to TouchBase
    `;
    btn.addEventListener('click', handleImport);
    document.body.appendChild(btn);
  }

  // --- Init ---

  async function init() {
    await waitForSelector('h1', 5000);
    injectButton();
  }

  // Handle LinkedIn SPA navigation
  let lastUrl = location.href;
  const urlObserver = new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      if (location.pathname.startsWith('/in/')) {
        setTimeout(init, 1000);
      } else {
        const btn = document.getElementById(BUTTON_ID);
        if (btn) btn.remove();
      }
    }
  });
  urlObserver.observe(document.body, { childList: true, subtree: true });

  // Initial load
  if (location.pathname.startsWith('/in/')) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }
})();
