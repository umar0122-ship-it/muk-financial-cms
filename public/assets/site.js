/* ══════════════════════════════════════════════════════════════
   MUK FINANCIAL — shared site script (multi-page)
   Reads CMS content (injected by server or fetched from /api/content)
   and renders the parts of the current page marked with data hooks.
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const PAGE = document.body.dataset.page || 'home';

  const NAV = [
    { href: '/',             label: 'Home',         key: 'home' },
    { href: '/services',     label: 'Services',     key: 'services' },
    { href: '/industries',   label: 'Industries',   key: 'industries' },
    { href: '/case-studies', label: 'Case Studies', key: 'cases' },
    { href: '/pricing',      label: 'Pricing',      key: 'pricing' },
    { href: '/about',        label: 'About',        key: 'about' },
    { href: '/contact',      label: 'Contact',      key: 'contact' }
  ];

  const esc = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  /* ── Content loading ─────────────────────────────────────── */
  async function getContent() {
    if (window.__SITE_CONTENT__) return window.__SITE_CONTENT__;
    const r = await fetch('/api/content');
    return r.json();
  }

  /* ── Header / footer ─────────────────────────────────────── */
  function renderChrome(c) {
    const site = c.site || {};
    const header = document.getElementById('site-header');
    if (header) {
      header.innerHTML = `
        <div class="topbar">
          <div class="topbar-inner">
            <div class="tb-left">
              ${site.email ? `<a href="mailto:${esc(site.email)}">✉ ${esc(site.email)}</a>` : ''}
              ${site.phone ? `<a href="tel:${esc(site.phone)}">☎ ${esc(site.phone)}</a>` : ''}
              <span class="tb-hide">Serving US businesses remotely · Mon–Sat</span>
            </div>
            <div class="tb-right">
              ${site.linkedin ? `<a href="${esc(site.linkedin)}" target="_blank" rel="noopener">LinkedIn ↗</a>` : ''}
            </div>
          </div>
        </div>
        <nav class="nav" aria-label="Main">
          <div class="nav-inner">
            <a class="brand" href="/">
              <span class="brand-mark">M</span>
              <span>
                <span class="brand-name">${esc(site.name || 'MUK Financial')}</span><br>
                <span class="brand-sub">${esc(site.tagline || '')}</span>
              </span>
            </a>
            <button class="nav-toggle" aria-expanded="false" aria-label="Open menu" aria-controls="nav-links">
              <span></span><span></span><span></span>
            </button>
            <ul class="nav-links" id="nav-links">
              ${NAV.map(n => `<li><a href="${n.href}" ${n.key === PAGE ? 'class="active" aria-current="page"' : ''}>${n.label}</a></li>`).join('')}
              <li><a class="btn btn-gold nav-cta" href="/contact">Book a Free Consultation</a></li>
            </ul>
          </div>
        </nav>`;

      const toggle = header.querySelector('.nav-toggle');
      const links  = header.querySelector('.nav-links');
      toggle.addEventListener('click', () => {
        const open = links.classList.toggle('open');
        toggle.setAttribute('aria-expanded', open);
      });
      links.addEventListener('click', e => { if (e.target.tagName === 'A') { links.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); } });

      const nav = header.querySelector('.nav');
      window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 8), { passive: true });
    }

    const footer = document.getElementById('site-footer');
    if (footer) {
      const year = new Date().getFullYear();
      footer.innerHTML = `
        <div class="footer-top">
          <div class="f-about">
            <a class="brand" href="/">
              <span class="brand-mark">M</span>
              <span>
                <span class="brand-name" style="color:#fff">${esc(site.name || 'MUK Financial')}</span><br>
                <span class="brand-sub">${esc(site.tagline || '')}</span>
              </span>
            </a>
            <p>Institutional-grade bookkeeping, tax strategy, and financial intelligence for US small and mid-sized businesses — delivered remotely, without the overhead.</p>
            ${site.linkedin ? `<a class="btn btn-ghost" style="padding:10px 18px;font-size:.8rem" href="${esc(site.linkedin)}" target="_blank" rel="noopener">Connect on LinkedIn ↗</a>` : ''}
          </div>
          <div>
            <h5>Company</h5>
            <ul>
              <li><a href="/about">About</a></li>
              <li><a href="/case-studies">Case Studies</a></li>
              <li><a href="/pricing">Pricing</a></li>
              <li><a href="/contact">Contact</a></li>
            </ul>
          </div>
          <div>
            <h5>Services</h5>
            <ul>
              ${(c.services || []).slice(0, 6).map(s => `<li><a href="/services#svc-${s.id}">${esc(s.title)}</a></li>`).join('')}
            </ul>
          </div>
          <div>
            <h5>Get in touch</h5>
            <ul>
              ${site.email ? `<li><a href="mailto:${esc(site.email)}">${esc(site.email)}</a></li>` : ''}
              ${site.phone ? `<li><a href="tel:${esc(site.phone)}">${esc(site.phone)}</a></li>` : ''}
              <li><span style="font-size:.85rem">Fully remote financial operations</span></li>
            </ul>
            <a class="btn btn-gold" style="margin-top:1rem;padding:11px 20px;font-size:.82rem" href="/contact">Schedule a Call</a>
          </div>
        </div>
        <div class="footer-bottom">
          <div class="footer-bottom-inner">
            <span>© ${year} ${esc(site.name || 'MUK Financial Operations')}. All rights reserved.</span>
            <span>Tax returns reviewed &amp; signed off by licensed CPA partners.</span>
          </div>
        </div>`;
    }
  }

  /* ── Small helpers ───────────────────────────────────────── */
  function fill(id, html) { const el = document.getElementById(id); if (el) el.innerHTML = html; }

  function serviceCard(s, linked) {
    const inner = `
      <span class="svc-num">${esc(s.num || '')}</span>
      <h3>${esc(s.title)}</h3>
      <p>${esc(s.description)}</p>
      <div class="tags">${(s.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>
      ${linked ? `<span class="more">Learn more <span class="arr">→</span></span>` : ''}`;
    return linked
      ? `<a class="card reveal" href="/services#svc-${s.id}">${inner}</a>`
      : `<article class="card reveal" id="svc-${s.id}">${inner}</article>`;
  }

  function caseCard(cs) {
    const hasImg = !!cs.image;
    return `
      <article class="case reveal">
        <div class="c-media ${hasImg ? 'has-img' : ''}" ${hasImg ? `style="background-image:url('${esc(cs.image)}')"` : ''} role="img" aria-label="${esc(cs.tag)}"></div>
        <div class="c-body">
          <span class="c-tag">${esc(cs.tag)}</span>
          <h3>${esc(cs.title)}</h3>
          <p>${esc(cs.body)}</p>
          <div class="c-stats">
            <div><b>${esc(cs.stat1_value)}</b><span>${esc(cs.stat1_label)}</span></div>
            <div><b>${esc(cs.stat2_value)}</b><span>${esc(cs.stat2_label)}</span></div>
          </div>
        </div>
      </article>`;
  }

  function planCard(p) {
    return `
      <article class="plan reveal ${p.featured ? 'featured' : ''}">
        ${p.featured ? '<span class="flag">Most popular</span>' : ''}
        <h3>${esc(p.name)}</h3>
        <div class="price">${esc(p.price)}<small>${esc(p.period || '')}</small></div>
        <p class="p-desc">${esc(p.description)}</p>
        <ul>${(p.features || []).map(f => `<li>${esc(f)}</li>`).join('')}</ul>
        <a class="btn ${p.featured ? 'btn-gold' : 'btn-outline'} btn-block" href="/contact?plan=${encodeURIComponent(p.name || '')}">${esc(p.cta || 'Get started')}</a>
      </article>`;
  }

  /* ── Page renderers ──────────────────────────────────────── */
  const renderers = {
    home(c) {
      const h = c.hero || {};
      fill('hero-eyebrow', esc(h.eyebrow || ''));
      const hl = esc(h.headline || '');
      // italicize the last two words in gold for the editorial serif look
      const parts = hl.split(' ');
      const tail = parts.splice(-3).join(' ');
      fill('hero-headline', parts.length ? `${parts.join(' ')} <em>${tail}</em>` : hl);
      fill('hero-sub', esc(h.subheadline || ''));
      const ctas = document.getElementById('hero-ctas');
      if (ctas) ctas.innerHTML = `
        <a class="btn btn-gold" href="/contact">${esc(h.cta_primary || 'Schedule a Free Consultation')} <span class="arr">→</span></a>
        <a class="btn btn-ghost" href="/services">${esc(h.cta_secondary || 'Explore Services')}</a>`;

      // Ledger card: recent client outcomes pulled from case studies
      const rows = (c.cases || []).slice(0, 4).map(cs => ({ label: cs.stat1_label, value: cs.stat1_value }));
      fill('ledger-rows', rows.map((s, i) => `
        <div class="ledger-row">
          <span class="lr-label">${esc(s.label)}</span>
          <span class="lr-value ${i % 2 ? '' : 'gold'}" data-count>${esc(s.value)}</span>
        </div>`).join(''));
      // Stat band: firm credentials from hero stats
      fill('stat-band', (h.stats || []).map(s => `<div class="stat"><b data-count>${esc(s.value)}</b><span>${esc(s.label)}</span></div>`).join(''));

      fill('home-services', (c.services || []).slice(0, 6).map(s => serviceCard(s, true)).join(''));
      fill('home-industries', (c.industries || []).slice(0, 8).map(i => `
        <a class="ind-tile reveal" href="/industries"><span class="ico">${esc(i.icon)}</span><b>${esc(i.name)}</b></a>`).join(''));
      fill('home-case', (c.cases || []).slice(0, 1).map(caseCard).join(''));
      fill('home-plans', (c.pricing || []).map(planCard).join(''));
    },

    services(c) {
      fill('services-grid', (c.services || []).map(s => serviceCard(s, false)).join(''));
      fill('services-process', (c.process || []).map(p => `
        <div class="tl-step reveal">
          <span class="dot"></span>
          <span class="tl-when">${esc(p.step)}</span>
          <h4>${esc(p.title)}</h4>
          <p>${esc(p.description)}</p>
        </div>`).join(''));
    },

    industries(c) {
      fill('industries-grid', (c.industries || []).map(i => `
        <div class="ind-tile reveal"><span class="ico">${esc(i.icon)}</span><b>${esc(i.name)}</b></div>`).join(''));
      fill('industries-cases', (c.cases || []).slice(0, 2).map(caseCard).join(''));
    },

    cases(c) {
      fill('cases-list', (c.cases || []).map(caseCard).join(''));
    },

    pricing(c) {
      fill('pricing-grid', (c.pricing || []).map(planCard).join(''));
    },

    about(c) {
      fill('about-process', (c.process || []).map(p => `
        <div class="tl-step reveal">
          <span class="dot"></span>
          <span class="tl-when">${esc(p.step)}</span>
          <h4>${esc(p.title)}</h4>
          <p>${esc(p.description)}</p>
        </div>`).join(''));
      fill('about-tech', (c.tech || []).map(t => `
        <div class="tech reveal"><span class="dot" style="background:${esc(t.color || '#888')}"></span>${esc(t.name)}</div>`).join(''));
      const h = c.hero || {};
      fill('about-stats', (h.stats || []).map(s => `<div class="stat"><b>${esc(s.value)}</b><span>${esc(s.label)}</span></div>`).join(''));
    },

    contact(c) {
      const site = c.site || {};
      fill('contact-email', site.email ? `<a href="mailto:${esc(site.email)}">${esc(site.email)}</a>` : '<span>—</span>');
      const cal = (site.calendar_url || '').trim();
      const calHref = cal || `mailto:${site.email || ''}?subject=${encodeURIComponent('Virtual call request')}`;
      fill('contact-calendar', `<a class="btn btn-gold" style="margin-top:.55rem;padding:11px 22px;font-size:.84rem;color:#0a1628;font-weight:700" href="${esc(calHref)}" ${cal ? 'target="_blank" rel="noopener"' : ''}>Schedule a 30-minute call <span class="arr" style="color:#0a1628;font-weight:700">→</span></a>`);
      const sel0 = document.getElementById('cf-interest');
      if (sel0) {
        const opts = ['Free consultation']
          .concat((c.services || []).map(sv => sv.title))
          .concat(['Something else']);
        sel0.innerHTML = opts.map(o => `<option value="${esc(o)}">${esc(o)}</option>`).join('');
      }
      fill('contact-li', site.linkedin ? `<a href="${esc(site.linkedin)}" target="_blank" rel="noopener">View profile ↗</a>` : '<span>—</span>');

      const form = document.getElementById('contact-form');
      if (!form) return;

      // Pre-select plan if arriving from a pricing CTA
      const plan = new URLSearchParams(location.search).get('plan');
      const svcSel = form.querySelector('[name="interest"]');
      if (plan && svcSel) {
        const want = plan.toLowerCase();
        const opt = [...svcSel.options].find(o => o.value.toLowerCase() === want || o.value.toLowerCase() === want + ' plan');
        if (opt) opt.selected = true;
      }

      const status = document.getElementById('form-status');
      form.addEventListener('submit', async e => {
        e.preventDefault();
        const fid = (site.formspree_id || '').trim();
        status.className = 'form-status';
        if (!fid || fid === 'YOUR_FORM_ID') {
          // Fall back to a prefilled email if Formspree isn't configured yet
          const d = new FormData(form);
          const body = encodeURIComponent(
            `Name: ${d.get('name')}\nEmail: ${d.get('email')}\nCompany: ${d.get('company') || '-'}\nInterested in: ${d.get('interest')}\n\n${d.get('message')}`
          );
          location.href = `mailto:${site.email || ''}?subject=${encodeURIComponent('Consultation request — ' + (d.get('name') || ''))}&body=${body}`;
          status.textContent = 'Your email app should open with the message pre-filled. You can also write to us directly at ' + (site.email || 'our email') + '.';
          status.classList.add('ok');
          return;
        }
        const btn = form.querySelector('button[type="submit"]');
        btn.disabled = true; btn.textContent = 'Sending…';
        try {
          const r = await fetch(`https://formspree.io/f/${fid}`, {
            method: 'POST',
            headers: { Accept: 'application/json' },
            body: new FormData(form)
          });
          if (!r.ok) throw new Error();
          form.reset();
          status.textContent = 'Message sent. We reply to every enquiry within one business day.';
          status.classList.add('ok');
        } catch {
          status.textContent = 'The message could not be sent. Please email us directly at ' + (site.email || 'our address') + '.';
          status.classList.add('err');
        } finally {
          btn.disabled = false; btn.textContent = 'Send message';
        }
      });
    }
  };

  /* ── Animations ──────────────────────────────────────────── */
  function reveals() {
    const els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) { els.forEach(el => el.classList.add('in')); return; }
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.12 });
    els.forEach(el => io.observe(el));
  }

  function counters() {
    const reduce = typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.querySelectorAll('[data-count]').forEach(el => {
      const raw = el.textContent.trim();
      const m = raw.match(/^([^0-9]*)(\d[\d,\.]*)(.*)$/);
      if (!m || reduce) return;
      const target = parseFloat(m[2].replace(/,/g, ''));
      if (!isFinite(target) || target === 0) return;
      const prefix = m[1], suffix = m[3];
      const dur = 1200, t0 = performance.now();
      function tick(t) {
        const p = Math.min(1, (t - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = prefix + Math.round(target * eased).toLocaleString('en-US') + suffix;
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = raw;
      }
      const io = new IntersectionObserver(en => {
        if (en[0].isIntersecting) { requestAnimationFrame(tick); io.disconnect(); }
      }, { threshold: 0.4 });
      io.observe(el);
    });
  }

  function backToTop() {
    const btn = document.createElement('button');
    btn.className = 'to-top'; btn.setAttribute('aria-label', 'Back to top'); btn.textContent = '↑';
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    document.body.appendChild(btn);
    window.addEventListener('scroll', () => btn.classList.toggle('show', window.scrollY > 500), { passive: true });
  }

  /* ── Boot ────────────────────────────────────────────────── */
  getContent().then(c => {
    renderChrome(c);
    (renderers[PAGE] || function () {})(c);
    try { reveals(); counters(); backToTop(); } catch (e) { console.warn('Enhancements skipped:', e); }
  }).catch(err => {
    console.error('Content load failed:', err);
  }).finally(() => {
    document.body.classList.add('ready');
  });
})();
