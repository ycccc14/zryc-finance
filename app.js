
(function () {
  'use strict';

  const E = Engine;
  const BOOT = window.__BOOT__ || {};
  const $ = sel => document.querySelector(sel);
  const $view = $('#view');
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const WEEKDAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const SCALES = ['Auto', '1', '2', '3', '5', '6', 'WHM'];
  const SCALE_NAMES = { 1: 'Scale 1 (no tax-free threshold)', 2: 'Scale 2 (tax-free threshold)', 3: 'Scale 3 (foreign resident)', 5: 'Scale 5 (full Medicare exemption)', 6: 'Scale 6 (half Medicare exemption)', WHM: 'Working holiday maker' };
  const RESIDENCIES = ['Resident', 'Foreign resident', 'Working holiday maker'];
  const KIND_LABEL = { income: 'Pay', expenses: 'Expense', adjustments: 'Adjustment', interest: 'Interest', paybacks: 'Payback', wallets: 'Account', walletChecks: 'Balance', walletTransfers: 'Transfer' };

  // Icons used when a fund or category has none set in Settings.
  const ICON_FALLBACK = {
    'Living Expenses': '🏠', 'Savings': '🐷', 'Tuition Fund': '🎓', 'Family': '👨‍👩‍👧', 'GPGZ': '✨', 'Shopping/Travel': '✈️', 'Emergency Fund': '🛟',
    'Food/Snack': '🍜', 'Grocery': '🛒', 'Daily Essentials': '🧴', 'Transport': '🚌', 'Phone': '📱', 'Study': '📚', 'Other': '📦',
    'Shopping': '🛍️', 'Tuition Fee': '🎓', 'Emergency': '🩺',
  };
  // Colour-blind-safe fund colours, in fund order (see README).
  const RECOMMENDED_FUNDS = {
    'Living Expenses': ['#2A78D6', '🏠', 'Everyday Account'], 'Savings': ['#1BAF7A', '🐷', 'Self Saving'],
    'Tuition Fund': ['#EDA100', '🎓', 'Shared Saving'], 'Family': ['#E87BA4', '👨‍👩‍👧', 'Self Saving'],
    'GPGZ': ['#008300', '✨', 'Shared Saving'], 'Shopping/Travel': ['#0891B2', '✈️', 'Self Saving'], 'Emergency Fund': ['#A16207', '🛟', 'Self Saving'],
  };
  // Bank accounts: icon + colour (colour-blind-safe order, same as the first fund colours).
  const ACCOUNT_STYLE = { 'Everyday Account': ['💳', '#2A78D6'], 'Self Saving': ['🏦', '#1BAF7A'], 'Shared Saving': ['🤝', '#EDA100'] };
  const ACCOUNT_COLOURS = ['#2A78D6', '#1BAF7A', '#EDA100', '#E87BA4', '#008300'];
  // Wallet page: [country, currency, flag, name], and quick picks [name, card colour, badge, logo in assets/logos].
  const WALLET_PLACES = [['AU', 'AUD', '🇦🇺', 'Australia'], ['MY', 'MYR', '🇲🇾', 'Malaysia']];
  const WALLET_COLOUR = '#475569';
  const WALLET_BRANDS = {
    AU: [['CommBank', '#FFCC00', 'CBA', 'commbank'], ['NAB', '#C8102E', 'NAB', 'nab'], ['Westpac', '#D5002B', 'W', 'westpac'], ['ANZ', '#007DBA', 'ANZ', 'anz'], ['ING', '#FF6200', 'ING', 'ing'],
      ['Macquarie', '#1A1A1A', 'M', 'macquarie'], ['Bankwest', '#F7B500', 'BW', 'bankwest'], ['St.George', '#78BE20', 'SG', 'stgeorge'], ['Up', '#FF7A64', 'Up', 'up'], ['Wise', '#9FE870', 'W', 'wise'],
      ['Revolut', '#191C1F', 'R', 'revolut'], ['PayPal', '#003087', 'PP', 'paypal'], ['Afterpay', '#B2FCE4', 'AP', 'afterpay']],
    MY: [['Maybank', '#FFC83D', 'MB', 'maybank'], ['CIMB', '#D7141A', 'C', 'cimb'], ['Public Bank', '#C8102E', 'PB', 'pbb'], ['RHB', '#005DAA', 'RHB', 'rhb'], ['Hong Leong', '#003A79', 'HL', 'hlb'],
      ['AmBank', '#E31837', 'Am', 'ambank'], ['GXBank', '#5B2DE1', 'GX', 'gxbank'], ['Touch ’n Go eWallet', '#005BAA', 'TNG', 'tng'], ['GrabPay', '#00B14F', 'G', 'grab'], ['ShopeePay', '#EE4D2D', 'S', 'shopee'],
      ['Boost', '#E1251B', 'B', 'boost'], ['ASB', '#C8102E', 'ASB', 'asb'], ['EPF (KWSP)', '#003D7D', 'EPF', 'kwsp'], ['Tabung Haji', '#00703C', 'TH', 'th'], ['Atome', '#F0FF5F', 'At', 'atome']],
  };

  // Stroke icons (24×24).
  const PATHS = {
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
    income: '<rect x="2.5" y="6" width="19" height="12" rx="2.5"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>',
    receipt: '<path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
    wallet: '<path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2H5"/><circle cx="16.5" cy="14" r="1.3"/>',
    pie: '<path d="M21 12A9 9 0 1 1 12 3v9z"/><path d="M15 3.5A9 9 0 0 1 20.5 9H15z"/>',
    file: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
    sliders: '<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
    more: '<circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    bank: '<path d="M3 10 12 4l9 6"/><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 21h18"/>',
    chart: '<path d="M4 4v16h16"/><path d="m8 14 3.5-4 3 3L20 7"/>',
    split: '<path d="M4 8h13l-3-3M20 16H7l3 3"/>',
    coin: '<circle cx="12" cy="12" r="9"/><path d="M14.8 9.2c-.5-.8-1.5-1.2-2.8-1.2-1.7 0-2.8.8-2.8 2s1.1 1.7 2.8 2 2.8.8 2.8 2-1.1 2-2.8 2c-1.3 0-2.3-.4-2.8-1.2M12 6.5V8M12 16v1.5"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    card: '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19M6.5 15h3"/>',
  };
  /** The app icon (same artwork as assets/icon.svg). */
  let iconSeq = 0;
  const appIcon = size => {
    const id = 'appbg' + (++iconSeq);
    return `<svg viewBox="0 0 512 512" width="${size}" height="${size}" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFE27A"/><stop offset="1" stop-color="#FFC21A"/></linearGradient></defs>
    <rect width="512" height="512" rx="116" fill="url(#${id})"/><circle cx="196" cy="168" r="66" fill="#F97316" stroke="#fff" stroke-width="12"/><circle cx="196" cy="168" r="36" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="9"/>
    <circle cx="300" cy="142" r="66" fill="#8B5CF6" stroke="#fff" stroke-width="12"/><circle cx="300" cy="142" r="36" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="9"/>
    <rect x="84" y="200" width="344" height="228" rx="52" fill="#2B2B2B"/><rect x="84" y="200" width="344" height="40" rx="20" fill="#4A4A4A"/>
    <rect x="300" y="276" width="150" height="92" rx="46" fill="#FFD43B"/><circle cx="346" cy="322" r="17" fill="#2B2B2B"/></svg>`;
  };
  const ico = (name, size) => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true"${size ? ` style="width:${size}px;height:${size}px"` : ''}>${PATHS[name]}</svg>`;

  // ---------- helpers ----------

  const store = {
    get(k) { try { return localStorage.getItem('tracker.' + k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem('tracker.' + k, v); } catch (e) { /* private mode: not remembered */ } },
  };
  const AUD = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' });
  const DEC = new Intl.NumberFormat('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const money = n => (n < -0.004 ? '−' : '') + AUD.format(Math.abs(n || 0));
  const signed = n => (n > 0.004 ? '+' : '') + money(n);
  const myr = n => (n < -0.004 ? '−' : '') + 'RM ' + DEC.format(Math.abs(n || 0));
  const pctf = (n, d) => ((n || 0) * 100).toFixed(d === undefined ? 0 : d) + '%';
  const hrs = n => (Math.round((n || 0) * 100) / 100) + ' h';
  const fmtMonth = ym => MONTHS[+ym.slice(5, 7) - 1] + ' ' + ym.slice(0, 4);
  const monthLong = ym => MONTHS_LONG[+ym.slice(5, 7) - 1];
  const fmtDate = s => (s ? +s.slice(8, 10) + ' ' + MONTHS[+s.slice(5, 7) - 1] + ' ' + s.slice(0, 4) : '');
  const dayMonth = s => +s.slice(8, 10) + '&nbsp;' + MONTHS[+s.slice(5, 7) - 1];
  const utc = s => new Date(Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10)));
  const esc = v => String(v === null || v === undefined ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const neg = n => (n < -0.004 ? ' neg' : '');
  const sumOf = (list, f) => list.reduce((s, x) => s + f(x), 0);
  const blank = v => v === '' || v === null || v === undefined;
  const dash = n => (Math.abs(n) < 0.005 ? '<span class="muted">–</span>' : money(n));
  const clamp01 = n => Math.min(1, Math.max(0, n || 0));

  function dayLabel(s) {
    const t = state.M.today;
    if (s === t) return 'Today';
    if (s === E.addDays(t, -1)) return 'Yesterday';
    return WEEKDAYS[utc(s).getUTCDay()] + ' ' + +s.slice(8, 10) + ' ' + MONTHS[+s.slice(5, 7) - 1] + (s.slice(0, 4) !== t.slice(0, 4) ? ' ' + s.slice(0, 4) : '');
  }

  const state = {
    app: BOOT,
    M: null,
    view: store.get('view') || 'dashboard',
    person: store.get('person') || 'All',
    month: null,
    fy: null,
    taxFy: null,
    cat: '',
    billTab: 'All',
    q: '',
    walletId: null, // the account open on the Wallet page
    charts: [],
    after: [],
    form: null,
    importer: { kind: 'expenses', headers: [], rows: [], map: {} },
    loadedAt: Date.now(),
  };

  function call(fn) {
    const args = Array.prototype.slice.call(arguments, 1);
    return new Promise((resolve, reject) => {
      if (!(window.google && google.script && google.script.run)) {
        reject(new Error('Not connected to Google Apps Script.'));
        return;
      }
      const runner = google.script.run.withSuccessHandler(resolve).withFailureHandler(reject);
      runner[fn].apply(runner, args);
    });
  }

  /** Runs a server function that returns fresh app data, then redraws. */
  async function serverUpdate(fn, args, okMsg) {
    const app = await call.apply(null, [fn].concat(args));
    state.app = app;
    state.loadedAt = Date.now();
    cacheApp();
    recompute();
    render();
    if (okMsg) toast(okMsg);
  }

  let toastTimer;
  function toast(msg, isError) {
    const t = $('#toast');
    t.textContent = msg;
    t.className = 'toast show' + (isError ? ' error' : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.className = 'toast'; }, isError ? 6000 : 2200);
  }

  const errText = err => String(err && err.message || err).replace(/^Exception: /, '');

  // ---------- people / funds / categories ----------

  const personOf = code => state.M.people.find(p => p.code === code);
  const pColour = code => (code === 'Shared' ? '#64748B' : (personOf(code) || {}).colour || '#888');
  const pName = code => (code === 'All' ? 'Both' : code === 'Shared' ? 'Shared' : (personOf(code) || {}).name || code);
  const initials = code => (code === 'Shared' ? '⇄' : pName(code).slice(0, 2).toUpperCase());
  const avatar = (code, cls) => (code === 'All'
    ? `<span class="av duo${cls ? ' ' + cls : ''}" aria-hidden="true"></span>`
    : `<span class="av${cls ? ' ' + cls : ''}" style="--pc:${pColour(code)}" aria-hidden="true">${esc(initials(code))}</span>`);
  const chip = code => `<span class="chip">${avatar(code)}${esc(pName(code))}</span>`;
  const fundOf = name => state.M.funds.find(f => f.name === name);
  const fColour = name => (fundOf(name) || {}).colour || '#94A3B8';
  const fIcon = name => (fundOf(name) || {}).icon || ICON_FALLBACK[name] || String(name || '?').charAt(0);
  const catOf = name => state.M.categories.find(c => c.name === name) || {};
  const cIcon = name => catOf(name).icon || ICON_FALLBACK[name] || String(name || '?').charAt(0);
  const cColour = name => fColour(catOf(name).fund);
  const tile = (emoji, colour, cls) => `<span class="ico${cls ? ' ' + cls : ''}" style="--c:${colour}" aria-hidden="true">${esc(emoji)}</span>`;
  const aIcon = name => (ACCOUNT_STYLE[name] || ['🏦'])[0];
  const aColour = name => (ACCOUNT_STYLE[name] || [])[1] || ACCOUNT_COLOURS[Math.max(0, state.M.accounts.indexOf(name)) % ACCOUNT_COLOURS.length];
  const fundsIn = account => state.M.fundNames.filter(f => fundOf(f).account === account);
  /** Accounts that earn interest: all except the everyday spending account. */
  const interestAccounts = () => {
    const everyday = (fundOf('Living Expenses') || {}).account;
    return state.M.accounts.filter(a => a !== everyday);
  };
  const fyName = fy => E.fyName(fy);
  const sameFy = (a, b) => E.normFy(a) === E.normFy(b);
  const fundLabel = name => `<span class="row" style="gap:6px;flex-wrap:nowrap"><span class="dot" style="--c:${fColour(name)}"></span>${esc(name)}</span>`;
  const showCodes = () => (state.person === 'All' ? state.M.codes : [state.person]);

  function personByText(text) {
    const t = String(text || '').trim().toLowerCase();
    if (t === 'shared') return 'Shared';
    const p = state.M.people.find(x => x.code.toLowerCase() === t || x.name.toLowerCase() === t);
    return p ? p.code : String(text || '').trim();
  }

  /** Sums pay rows the same way the engine's totals do. */
  function agg(rows) {
    const t = { count: rows.length, hours: 0, gross: 0, tax: 0, net: 0, superAmt: 0, alloc: {} };
    state.M.fundNames.forEach(f => { t.alloc[f] = 0; });
    rows.forEach(r => {
      t.hours += r.hours; t.gross += r.gross; t.tax += r.tax; t.net += r.net; t.superAmt += r.superAmt;
      state.M.fundNames.forEach(f => { t.alloc[f] += r.alloc[f]; });
    });
    return t;
  }

  // ---------- model & chrome ----------

  function recompute() {
    state.M = E.compute(state.app.data, { today: E.todayISO() });
    const M = state.M;
    if (!state.month || M.months.indexOf(state.month) < 0) state.month = E.monthOf(M.today);
    if (state.person !== 'All' && M.codes.indexOf(state.person) < 0) state.person = 'All';
    if (!state.fy || M.fys.indexOf(state.fy) < 0) state.fy = E.fyOf(state.month + '-01');
    if (!state.taxFy) state.taxFy = M.currentFY;
  }

  // [id, label, icon, render]
  const VIEWS = [
    ['dashboard', 'Home', 'home', viewDashboard],
    ['split', 'Split bills', 'split', viewSplit],
    ['wallet', 'Wallet', 'card', viewWallet],
    ['accounts', 'Accounts', 'bank', viewAccounts],
    ['balances', 'Funds', 'wallet', viewBalances],
    ['interest', 'Interest', 'coin', viewInterest],
    ['expenses', 'Spending', 'receipt', viewExpenses],
    ['income', 'Income', 'income', viewIncome],
    ['super', 'Super', 'spark', viewSuper],
    ['tax', 'Tax', 'file', viewTax],
    ['me', 'Me', 'user', viewMe],
    ['budget', 'Budget', 'pie', viewBudget],
    ['settings', 'Settings', 'sliders', viewSettings],
  ];
  // Bottom-bar sections: [id, label, icon, pages]. Pages in a section share a tab row in the header.
  const GROUPS = [
    ['home', 'Home', 'home', ['dashboard', 'split']],
    ['money', 'Savings', 'wallet', ['wallet', 'accounts', 'balances', 'interest']],
    ['reports', 'Reports', 'chart', ['expenses', 'income', 'super', 'tax']],
    ['me', 'Me', 'user', ['me', 'budget', 'settings']],
  ];
  const groupOf = view => GROUPS.find(g => g[3].indexOf(view) >= 0) || GROUPS[0];
  const MONTH_VIEWS = ['expenses', 'budget'];

  function render() {
    state.charts.forEach(c => c.destroy());
    state.charts = [];
    state.stale = false;
    state.viewEdited = false;
    renderChrome();
    const v = VIEWS.find(x => x[0] === state.view) || VIEWS[0];
    const M = state.M;
    const warnings = M.warnings.length
      ? `<div class="notice"><strong>⚠️ Check your settings</strong><ul>${M.warnings.map(w => `<li>${esc(w)}</li>`).join('')}</ul></div>` : '';
    $view.innerHTML = warnings + accountFixNotice() + v[3]();
    const hooks = state.after;
    state.after = [];
    hooks.forEach(fn => fn());
  }

  /** Funds still on the old "Self Account / Shared Account" names (set up before the three accounts). */
  function needsAccountFix() {
    const M = state.M;
    const living = fundOf('Living Expenses');
    return M.funds.some(f => f.account === 'Self Account' || f.account === 'Shared Account') || (living && living.account !== 'Everyday Account' && !M.accounts.includes('Everyday Account'));
  }

  function accountFixNotice() {
    if (!needsAccountFix() || ['dashboard', 'accounts', 'balances', 'me'].indexOf(state.view) < 0) return '';
    return `<section class="card" style="border:2px solid var(--brand-deep)"><div class="row" style="flex-wrap:nowrap;align-items:flex-start">${tile('🏦', 'var(--brand-deep)')}
      <div style="flex:1"><strong>Set up your three accounts</strong><div class="muted small">Your funds still use the old “Self Account / Shared Account”. Switch to 💳 Everyday Account (Living Expenses), 🏦 Self Saving (Savings, Family, Shopping/Travel, Emergency) and 🤝 Shared Saving (Tuition, GPGZ)?</div>
      <button class="btn primary" data-act="fix-accounts" style="margin-top:10px">Switch now</button></div></div></section>`;
  }

  function monthNav() {
    const M = state.M;
    const months = M.months.indexOf(state.month) < 0 ? M.months.concat(state.month).sort() : M.months;
    const i = months.indexOf(state.month);
    return `<div class="month-nav"><button type="button" data-act="month" data-key="-1" aria-label="Previous month"${i <= 0 ? ' disabled' : ''}>‹</button>
      <label class="mn-pill">${monthLong(state.month)} ${state.month.slice(0, 4)} ▾<select id="f-month" aria-label="Choose month">${months.slice().reverse()
        .map(m => `<option value="${m}"${m === state.month ? ' selected' : ''}>${monthLong(m)} ${m.slice(0, 4)}</option>`).join('')}</select></label>
      <button type="button" data-act="month" data-key="1" aria-label="Next month"${i >= months.length - 1 ? ' disabled' : ''}>›</button></div>`;
  }

  /** When the data was last loaded, e.g. "2:46 pm", shown on the refresh button. */
  function loadedTime() {
    const d = new Date(state.loadedAt);
    const h = d.getHours();
    return (h % 12 || 12) + ':' + String(d.getMinutes()).padStart(2, '0') + (h < 12 ? ' am' : ' pm');
  }

  function renderChrome() {
    const M = state.M;
    if (M.people[0]) document.documentElement.style.setProperty('--zr', M.people[0].colour);
    if (M.people[1]) document.documentElement.style.setProperty('--yc', M.people[1].colour);
    $('#brand-logo').innerHTML = appIcon(34);
    const g = groupOf(state.view);
    const sel = state.person;
    const wallet = `<div class="wallet"><button type="button" data-act="wallet" data-key="-1" aria-label="Previous wallet">◀</button>${avatar(sel)}<span>${sel === 'All' ? 'Our wallet' : esc(pName(sel)) + '’s wallet'}</span><button type="button" data-act="wallet" data-key="1" aria-label="Next wallet">▶</button></div>`;
    const search = state.view === 'dashboard'
      ? `<label class="search">${ico('search')}<span class="sr">Search bills</span><input id="search" type="search" placeholder="Search" autocomplete="off" value="${esc(state.q)}"></label>` : '';
    const tabs = g[3].length > 1 ? `<nav class="band-tabs" aria-label="${g[1]}">${g[3].map(id =>
      `<button type="button" data-act="view" data-key="${id}"${id === state.view ? ' aria-current="page"' : ''}>${VIEWS.find(v => v[0] === id)[1]}</button>`).join('')}</nav>` : '';
    $('#band').innerHTML = `<div class="band-inner">
      <div class="band-row">${wallet}<div class="band-tools">${search}${search
        ? `<button class="icon-btn" data-act="reload" aria-label="Refresh" title="Load the latest entries">${ico('refresh', 18)}</button>`
        : `<button class="sync-pill" data-act="reload" title="Load the latest entries from the Sheet">${ico('refresh', 16)}<span>${loadedTime()}</span></button>`}</div></div>
      ${g[0] !== 'home' ? `<div class="band-title">${g[1]}</div>` : ''}${tabs}
      ${MONTH_VIEWS.indexOf(state.view) >= 0 ? `<div style="text-align:center">${monthNav()}</div>` : ''}</div>`;
    $('#nav-side').innerHTML = VIEWS.map(([id, label, icon]) =>
      `<button type="button" data-act="view" data-key="${id}"${id === state.view ? ' aria-current="page"' : ''}>${ico(icon)}${label}</button>`).join('');
    const tab = gr => `<button type="button" data-act="group" data-key="${gr[0]}"${gr === g ? ' aria-current="page"' : ''}>${ico(gr[2], 22)}<span>${gr[1]}</span></button>`;
    $('#nav-bottom').innerHTML = tab(GROUPS[0]) + tab(GROUPS[1]) +
      `<div class="fab-slot"><button type="button" class="fab" id="fab" data-act="add-new" aria-label="Add an entry">${ico('plus')}</button></div>` +
      tab(GROUPS[2]) + tab(GROUPS[3]);
    $('#side-foot').textContent = state.app.user ? 'Signed in as ' + state.app.user : '';
  }

  /** Everyday budget: this month's pay put into the Everyday Account's funds, and what was spent from them. */
  // Worked out in Engine.gs, so the Home Screen widgets show exactly the same numbers.
  const budgetFor = (k, m) => E.monthSummary(state.M, k, m).budget;

  function fySelect(value, change) {
    const fys = state.M.fys.slice().reverse();
    if (fys.indexOf(value) < 0) fys.unshift(value);
    return `<select class="pill-select" data-change="${change}" aria-label="Financial year">${fys.map(f => `<option value="${f}"${f === value ? ' selected' : ''}>${fyName(f)}</option>`).join('')}</select>`;
  }

  function chart(id, config) {
    state.after.push(() => {
      const el = document.getElementById(id);
      if (!el) return;
      if (!window.Chart) {
        // Still downloading (or blocked): draw the charts when it arrives.
        el.parentNode.insertAdjacentHTML('beforeend', '<p class="muted small" style="position:absolute;inset:0;display:grid;place-items:center">Loading chart…</p>');
        window.__chartReady = () => { window.__chartReady = null; if (state.M && !state.form) render(); };
        return;
      }
      const css = getComputedStyle(document.documentElement);
      Chart.defaults.color = css.getPropertyValue('--muted').trim();
      Chart.defaults.borderColor = css.getPropertyValue('--line').trim();
      Chart.defaults.font.family = css.getPropertyValue('--font').trim();
      if (state.quiet) config.options = Object.assign({}, config.options, { animation: false }); // background update: no replay
      state.charts.push(new Chart(el, config));
    });
  }

  const cssVar = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const table = (head, body, foot) =>
    `<div class="table-wrap"><table><thead>${head}</thead><tbody>${body}</tbody>${foot ? `<tfoot>${foot}</tfoot>` : ''}</table></div>`;
  const empty = (emoji, text, action) => `<div class="empty"><span class="e">${emoji}</span>${text}${action ? `<div style="margin-top:12px">${action}</div>` : ''}</div>`;
  const stat = (k, v, s, cls) => `<div class="stat"><div class="k">${k}</div><div class="v${cls || ''}">${v}</div>${s ? `<div class="s">${s}</div>` : ''}</div>`;
  const addBtn = (kind, label) => `<button class="btn primary" data-act="add" data-key="${kind}">${ico('plus', 18)}${label}</button>`;

  // ---------- shared components ----------

  /** Pay, expense and adjustment rows as one activity feed. */
  function activity(filter) {
    const M = state.M;
    const sel = state.person;
    const items = [];
    if (!filter || filter.income) {
      M.income.filter(r => sel === 'All' || r.person === sel).forEach(r => items.push({
        date: r.date, kind: 'income', id: r.id, icon: tile('💼', pColour(r.person)),
        title: `${esc(pName(r.person))} · ${!r.hours && r.otherNet ? esc(r.note || 'other income') : 'pay'}`,
        sub: `${hrs(r.hours)} @ ${money(r.rate)} · gross ${money(r.gross)} · tax ${money(r.tax)}`,
        amt: `<span class="pos">${signed(r.net)}</span>`,
        small: r.actualTax !== null && Math.abs(r.taxDiff) > 0.004 ? '<span class="flag">payslip differs</span>' : 'net',
        value: r.net,
      }));
    }
    if (!filter || filter.expenses) {
      M.expenses.filter(r => sel === 'All' || r.shares[sel] !== undefined)
        .filter(r => !filter || !filter.month || r.month === filter.month)
        .filter(r => !filter || !filter.cat || r.category === filter.cat)
        .forEach(r => {
          const share = sel === 'All' ? r.amount : r.shares[sel];
          items.push({
            date: r.date, kind: 'expenses', id: r.id, icon: tile(cIcon(r.category), cColour(r.category)),
            title: esc(r.category) + (r.person === 'Shared' ? ' <span class="tag">Shared</span>' : ''),
            sub: [r.description ? esc(r.description) : '', r.person === 'Shared' ? M.codes.map(c => esc(pName(c)) + ' ' + money(r.shares[c])).join(' / ') : esc(pName(r.person)), r.fund ? esc(r.fund) : '<span class="flag">no fund</span>'].filter(Boolean).join(' · '),
            amt: '−' + money(share),
            small: sel !== 'All' && r.person === 'Shared' ? 'your share' : '',
            value: -share,
          });
        });
    }
    if (!filter || filter.adjustments) {
      M.adjustments.filter(r => sel === 'All' || r.person === sel).forEach(r => items.push({
        date: r.date, kind: 'adjustments', id: r.id,
        icon: r.betweenAccounts ? tile('🏦', aColour(r.toAccount)) : tile(r.type === 'Transfer' ? '🔁' : r.type === 'Add' ? '➕' : '➖', r.type === 'Transfer' ? '#64748B' : fColour(r.toFund || r.fromFund)),
        title: `${esc(pName(r.person))} · ${r.betweenAccounts ? 'account transfer' : r.type === 'Transfer' ? 'fund transfer' : r.type === 'Add' ? 'money added' : 'money taken out'}`,
        sub: (r.betweenAccounts ? `${esc(r.fromAccount)} → ${esc(r.toAccount)} (${esc(r.fromFund)} → ${esc(r.toFund)})`
          : r.type === 'Transfer' ? `${esc(r.fromFund)} → ${esc(r.toFund)}` : `${esc(r.toFund || r.fromFund)} · ${esc(r.toAccount || r.fromAccount)}`) + (r.note ? ' · ' + esc(r.note) : '') +
          (r.date < M.general.startDate ? ' · <span class="flag">before start date</span>' : ''),
        amt: r.type === 'Transfer' ? money(r.amount) : r.type === 'Add' ? `<span class="pos">+${money(r.amount)}</span>` : '−' + money(r.amount),
        small: '',
        value: r.type === 'Add' ? r.amount : r.type === 'Deduct' ? -r.amount : 0,
      }));
    }
    if (!filter || filter.interest) {
      M.interest.filter(r => sel === 'All' || r.shares[sel] !== undefined).forEach(r => {
        const share = sel === 'All' ? r.amount : r.shares[sel];
        items.push({
          date: r.date, kind: 'interest', id: r.id, icon: tile('🏦', aColour(r.account), 'round'),
          title: 'Interest · ' + esc(r.account), sub: (r.person === 'Shared' ? 'Shared' : esc(pName(r.person))) + ' · into ' + esc(r.fund) + (r.note ? ' · ' + esc(r.note) : ''),
          amt: `<span class="pos">+${money(share)}</span>`, small: sel !== 'All' && r.person === 'Shared' ? 'your share' : '', value: share,
        });
      });
    }
    return items.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  }

  function txRows(items, showDayTotals) {
    let html = '';
    let day = '';
    items.forEach(it => {
      if (it.date !== day) {
        day = it.date;
        const total = sumOf(items.filter(x => x.date === day), x => x.value);
        html += `<div class="day"><span>${dayLabel(day)}</span>${showDayTotals ? `<span>${signed(total)}</span>` : ''}</div>`;
      }
      html += `<div class="tx" role="button" tabindex="0" data-act="edit" data-kind="${it.kind}" data-id="${esc(it.id)}">${it.icon}
        <div class="tx-main"><span class="tx-title">${it.title}</span><span class="tx-sub">${it.sub}</span></div>
        <div class="tx-amt">${it.amt}${it.small ? `<small>${it.small}</small>` : ''}</div></div>`;
    });
    return `<div class="tx-list">${html}</div>`;
  }

  function fundCard(F, name) {
    const over = F.balance < -0.004;
    return `<div class="fund${over ? ' over' : ''}">
      <div class="top">${tile(fIcon(name), fColour(name))}<div class="stack" style="gap:0;min-width:0"><span class="name">${esc(name)}</span><span class="acct">${esc(fundOf(name).account)}</span></div></div>
      <div class="spread"><div class="stack" style="gap:0;min-width:0"><span class="bal${neg(F.balance)}">${money(F.balance)}</span><span class="myr">${myr(F.balance * state.M.general.exchangeRate)}</span></div>${over ? '<span class="tag bad">⚠ Overspent</span>' : ''}</div>
      <div class="bar${F.usedPct > 1 ? ' over' : ''}" role="img" aria-label="${pctf(F.usedPct)} used"><span style="--w:${(clamp01(F.usedPct) * 100).toFixed(1)}%;--c:${fColour(name)}"></span></div>
      <div class="meta"><span>${pctf(F.usedPct)} used</span><span>${money(F.expenses)} of ${money(F.available)}</span></div></div>`;
  }

  function stackBar(parts) {
    const total = sumOf(parts, p => Math.max(0, p.value));
    if (total <= 0) return '<div class="stackbar"></div>';
    return `<div class="stackbar" role="img" aria-label="${parts.map(p => esc(p.label) + ' ' + pctf(p.value / total)).join(', ')}">${parts.filter(p => p.value > 0)
      .map(p => `<span style="--w:${(p.value / total * 1000).toFixed(0)};--c:${p.colour}" title="${esc(p.label)}"></span>`).join('')}</div>`;
  }

  // ======================================================================
  // Home
  // ======================================================================

  function viewDashboard() {
    const M = state.M;
    const m = state.month;
    const sel = state.person;
    const { spent, income, left, budget: b } = E.monthSummary(M, sel, m);
    const L = M.ledgers[sel];

    const summary = `<section class="card summary">
      <div class="spread">${monthNav()}<button class="icon-btn" data-act="group" data-key="reports" aria-label="Open reports" title="Reports">${ico('chart', 18)}</button></div>
      <div class="sum-line"><span class="sum-tag">Spent</span><span class="sum-big">${money(spent)}</span></div>
      <div class="sum-pair"><div class="sum-line"><span class="sum-tag">In</span><span class="sum-mid in">${money(income)}</span></div>
        <div class="sum-line"><span class="sum-tag">Left</span><span class="sum-mid${left < -0.004 ? ' neg' : ' in'}">${money(left)}</span></div></div>
      <div class="budget-box" role="button" tabindex="0" data-act="view" data-key="budget">
        <div class="spread"><span>${sel === 'All' ? 'Our' : esc(pName(sel)) + '’s'} everyday budget left <strong class="${b.left < -0.004 ? 'neg' : ''}" style="font-size:18px">${money(b.left)}</strong></span><span class="muted">›</span></div>
        <div class="bar${b.used > 1 ? ' over' : ''}"><span style="--w:${(clamp01(1 - b.used) * 100).toFixed(1)}%;--c:var(--brand-deep)"></span></div>
        <div class="muted small" style="margin-top:6px">Spent ${money(b.spent)} of ${money(b.budget)} put into ${b.funds.map(esc).join(', ')} this month</div></div>
    </section>`;

    const quick = `<section class="card quick">
      <button type="button" data-act="add" data-key="income"><span class="q" style="--c:#16A34A">💼</span>Add pay</button>
      <button type="button" data-act="add" data-key="expenses"><span class="q" style="--c:#3B82F6">🧾</span>Add expense</button>
      <button type="button" data-act="acct-transfer" data-key="${esc(M.accounts[0] || '')}"><span class="q" style="--c:#F2B705">🔁</span>Transfer</button>
      <button type="button" data-act="view" data-key="split"><span class="q" style="--c:#EC4899">⚖️</span>Split</button></section>`;

    const accts = `<div class="list-head"><h2>🏦 Accounts</h2><button class="btn link" data-act="view" data-key="accounts">See all ${ico('arrow', 16)}</button></div>
      <div class="acct-strip">${M.accounts.map(a => `<div class="acct-mini" role="button" tabindex="0" data-act="view" data-key="accounts" style="border-top:3px solid ${aColour(a)}">
        <div class="k">${esc(aIcon(a))} ${esc(a)}</div><div class="v${neg(L[a].balance)}">${money(L[a].balance)}</div></div>`).join('')}</div>`;

    const tabs = [['All', 'All']].concat(M.codes.map(c => [c, pName(c)]), [['Shared', 'Shared']]);
    const bills = `<div class="list-head"><h2>💛 <span id="bills-title">${state.q ? 'Search results' : monthLong(m) + ' bills'}</span></h2>
      <div class="mini-tabs" role="group" aria-label="Whose bills">${tabs.map(([k, l]) => `<button type="button" data-act="bill-tab" data-key="${esc(k)}" aria-pressed="${state.billTab === k}">${esc(l)}</button>`).join('')}</div></div>
      <div id="bills" style="display:grid;gap:12px">${billsHtml()}</div>`;

    return summary + payCheckCard() + interestCard() + transferCard() + debtCard() + quick + accts + bills;
  }

  /** From the 1st: ask for last month's bank interest until it's recorded (or dismissed). */
  function interestCard() {
    const M = state.M;
    const thisMonth = E.monthOf(M.today);
    const prev = E.addMonths(thisMonth, -1);
    if (store.get('skip-interest-' + prev) === '1' || M.interest.some(r => r.date >= prev + '-01')) return '';
    const lastDay = E.addDays(thisMonth + '-01', -1);
    return `<section class="card" style="border:2px solid var(--brand-deep)"><div class="row" style="flex-wrap:nowrap;align-items:flex-start">${tile('🏦', 'var(--brand-deep)')}
      <div style="flex:1;min-width:0"><strong>Record ${monthLong(prev)}’s bank interest</strong>
        <div class="muted small">Check ${interestAccounts().map(esc).join(' and ')} in your bank apps.</div>
        <div class="row" style="margin-top:8px"><button class="btn primary" data-act="interest-record" data-date="${lastDay}">🏦 Record interest</button>
          <button class="btn link" data-act="interest-skip" data-key="${prev}">None this month</button></div></div></div></section>`;
  }

  function debtCard() {
    const S = state.M.split;
    if (S.amount < 0.01) return '';
    return `<section class="card" role="button" tabindex="0" data-act="view" data-key="split"><div class="row" style="flex-wrap:nowrap">
      ${avatar(S.debtor, 'lg')}<span class="muted">→</span>${avatar(S.creditor, 'lg')}
      <div style="flex:1;min-width:0"><strong>${esc(pName(S.debtor))} owes ${esc(pName(S.creditor))} ${money(S.amount)}</strong>
        <div class="muted small">Split bills · tap to settle up</div></div><span class="muted">›</span></div></section>`;
  }

  /** Weekly pay check: from Tuesday, ask about anyone with no pay recorded for this week. */
  function payCheckCard() {
    const M = state.M;
    const today = M.today;
    const tue = E.addDays(today, -((utc(today).getUTCDay() - 2 + 7) % 7)); // this week's Tuesday (today if Tuesday)
    const codes = showCodes().filter(c => store.get('skip-pay-' + c + '-' + tue) !== '1' &&
      !M.income.some(r => r.person === c && r.date >= E.addDays(tue, -3) && r.date <= E.addDays(tue, 6)));
    if (!codes.length) return '';
    const rows = codes.map(c => {
      const rec = newRecord('income', { person: c, date: tue });
      rec.days = personOf(c).usualDays || 3;
      const row = E.compute({ settings: state.app.data.settings, income: [Object.assign({ id: 'check' }, rec)] }).income[0];
      const data = `data-key="${esc(c)}" data-date="${tue}" data-days="${row.days}"`;
      return `<div class="insight" style="align-items:flex-start">${avatar(c, 'lg')}<div style="flex:1;min-width:0">
        <strong>Did ${esc(pName(c))} get paid ${tue === today ? 'today' : 'on ' + dayLabel(tue)}?</strong>
        <div class="muted small">${row.days} days × ${row.hoursPerDay} h · gross ${money(row.gross)} · tax ${money(row.tax)} · net <strong>${money(row.net)}</strong></div>
        <div class="row" style="margin-top:8px"><button class="btn primary" data-act="paycheck-record" ${data}>✅ Yes, record</button>
          <button class="btn" data-act="paycheck-change" ${data}>✏️ Change</button>
          <button class="btn link" data-act="paycheck-skip" ${data}>No pay</button></div></div></div>`;
    }).join('');
    return `<section class="card" style="border:2px solid var(--brand-deep)"><div class="card-head"><h2>💼 Pay check</h2></div>${rows}</section>`;
  }

  /** Pays from the last 3 weeks whose savings transfers aren't marked done. */
  function transferCard() {
    const M = state.M;
    const from = E.addDays(M.today, -21);
    const pending = M.income.filter(r => !r.transferred && r.date >= from && r.date <= M.today && (state.person === 'All' || r.person === state.person));
    if (!pending.length) return '';
    const living = fundOf('Living Expenses') || M.funds[0];
    const targets = M.accounts.filter(a => !living || a !== living.account);
    const amt = (r, a) => sumOf(fundsIn(a), f => r.alloc[f]);
    const rows = pending.slice().reverse().map(r => `<div class="insight" style="align-items:flex-start">${avatar(r.person, 'lg')}<div style="flex:1;min-width:0">
      <strong>${esc(pName(r.person))}’s pay · ${dayLabel(r.date)}</strong> <span class="muted small">net ${money(r.net)}</span>
      <div class="row" style="margin-top:6px">${targets.map(a => `<span class="chip" style="padding-left:10px">${esc(aIcon(a))} ${esc(a)} <strong>${money(amt(r, a))}</strong></span>`).join('')}</div>
      <button class="btn" data-act="xfer-done" data-key="${esc(r.id)}" style="margin-top:8px">✅ Done</button></div></div>`).join('');
    const totals = pending.length > 1 ? `<div class="receipt" style="margin-bottom:6px"><strong>Total to move</strong>${targets.map(a =>
      `<div class="line"><span>${esc(aIcon(a))} ${esc(a)}</span><strong>${money(sumOf(pending, r => amt(r, a)))}</strong></div>`).join('')}
      <button class="btn primary" data-act="xfer-done" data-key="${pending.map(r => esc(r.id)).join(',')}">✅ All done</button></div>` : '';
    return `<section class="card"><div class="card-head"><h2>💸 Move to savings</h2><span class="hint">from ${esc(living ? living.account : 'your pay account')}</span></div>${totals}${rows}</section>`;
  }

  /** The month's pay and expenses as day cards (or search results across all months). */
  function billsHtml() {
    const M = state.M;
    const tab = state.billTab;
    const q = state.q.trim().toLowerCase();
    const items = [];
    if (tab !== 'Shared') {
      M.income.filter(r => (tab === 'All' || r.person === tab) && (q || r.month === state.month)).forEach(r => items.push({
        date: r.date, kind: 'income', id: r.id, icon: tile('💼', pColour(r.person), 'round'),
        title: !r.hours && r.otherNet ? esc(r.note || 'Other income') : 'Pay · ' + hrs(r.hours), sub: `${esc(pName(r.person))} · income${r.note && r.hours ? ' · ' + esc(r.note) : ''}`,
        text: [pName(r.person), 'pay income', r.note, r.net.toFixed(2)].join(' '),
        amt: `<span class="pos">+${money(r.net)}</span>`, small: 'tax ' + money(r.tax), inc: r.net, out: 0,
      }));
    }
    M.expenses.filter(r => (tab === 'All' || r.person === tab) && (q || r.month === state.month)).forEach(r => items.push({
      date: r.date, kind: 'expenses', id: r.id, icon: tile(cIcon(r.category), cColour(r.category), 'round'),
      title: esc(r.description || r.category),
      sub: (r.person === 'Shared' ? 'Shared · ' + M.codes.map(c => esc(pName(c)) + ' ' + money(r.shares[c])).join(' / ') : esc(pName(r.person)) + ' spent') + (r.description ? ' · ' + esc(r.category) : ''),
      text: [r.description, r.category, pName(r.person), r.person, r.fund, r.amount.toFixed(2)].join(' '),
      amt: '−' + money(r.amount), small: '', inc: 0, out: r.amount,
    }));
    M.interest.filter(r => (tab === 'All' || r.person === tab) && (q || r.month === state.month)).forEach(r => items.push({
      date: r.date, kind: 'interest', id: r.id, icon: tile('🏦', aColour(r.account), 'round'),
      title: 'Interest · ' + esc(r.account), sub: (r.person === 'Shared' ? 'Shared' : esc(pName(r.person))) + ' · into ' + esc(r.fund),
      text: ['interest', r.account, r.fund, r.note, pName(r.person), r.amount.toFixed(2)].join(' '),
      amt: `<span class="pos">+${money(r.amount)}</span>`, small: '', inc: r.amount, out: 0,
    }));
    const shown = (q ? items.filter(it => it.text.toLowerCase().indexOf(q) >= 0) : items)
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)).slice(0, 200);
    if (!shown.length) {
      return `<section class="card">${q ? empty('🔍', 'No bills match “' + esc(state.q) + '”.') : empty('🧾', `No bills in ${monthLong(state.month)} yet.`, addBtn('expenses', 'Add expense'))}</section>`;
    }
    const days = [];
    shown.forEach(it => { if (!days.length || days[days.length - 1][0] !== it.date) days.push([it.date, []]); days[days.length - 1][1].push(it); });
    return days.map(([date, list]) => {
      const out = sumOf(list, x => x.out);
      const inc = sumOf(list, x => x.inc);
      return `<section class="card flush day-card"><div class="day"><span class="d">${dayLabel(date)}</span><span class="day-tot">
        ${out ? `<span class="pill-k out" title="Spent">−</span><b>${money(out)}</b>` : ''}${inc ? `<span class="pill-k in" title="Income">+</span><b>${money(inc)}</b>` : ''}</span></div>
        ${list.map(it => `<div class="tx" role="button" tabindex="0" data-act="edit" data-kind="${it.kind}" data-id="${esc(it.id)}">${it.icon}
          <div class="tx-main"><span class="tx-title">${it.title}</span><span class="tx-sub">${it.sub}</span></div>
          <div class="tx-amt">${it.amt}${it.small ? `<small>${it.small}</small>` : ''}</div></div>`).join('')}</section>`;
    }).join('');
  }

  // ======================================================================
  // Income
  // ======================================================================

  function viewIncome() {
    const M = state.M;
    const fy = state.fy;
    const codes = showCodes();
    const rows = M.income.filter(r => r.fy === fy && codes.indexOf(r.person) >= 0);
    const T = agg(rows);
    const months = Array.from(new Set(rows.map(r => r.month))).sort().reverse();
    const cols = ['Hours', 'Gross', 'Tax', 'Net', 'Super'];
    const cellsFor = t => [hrs(t.hours), money(t.gross), money(t.tax), `<strong>${money(t.net)}</strong>`, money(t.superAmt)]
      .map(v => `<td class="num">${v}</td>`).join('');
    const both = codes.length > 1;
    const head = `<tr class="group"><th class="sticky"></th>${codes.map(c => `<th colspan="5">${chip(c)}</th>`).join('')}${both ? '<th></th>' : ''}</tr>
      <tr><th class="sticky">Month</th>${codes.map(() => cols.map(h => `<th class="num">${h}</th>`).join('')).join('')}${both ? '<th class="num">Combined net</th>' : ''}</tr>`;
    const body = months.map(m => {
      const mr = rows.filter(r => r.month === m);
      return `<tr><td class="sticky">${fmtMonth(m)}</td>${codes.map(c => cellsFor(agg(mr.filter(r => r.person === c)))).join('')}${both ? `<td class="num"><strong>${money(agg(mr).net)}</strong></td>` : ''}</tr>`;
    }).join('');
    const foot = months.length ? `<tr class="total"><td class="sticky">Total</td>${codes.map(c => cellsFor(agg(rows.filter(r => r.person === c)))).join('')}${both ? `<td class="num">${money(T.net)}</td>` : ''}</tr>` : '';

    const log = activity({ income: true }).filter(it => (M.income.find(r => r.id === it.id) || {}).fy === fy);
    return `
      <div class="section-title"><h1>Income</h1><div class="row">${fySelect(fy, 'fy')}${addBtn('income', 'Pay')}<button class="btn" data-act="add-other">💰 Other</button></div></div>
      <div class="stats">${stat('Net income', money(T.net), T.count + ' pays')}${stat('Gross income', money(T.gross), hrs(T.hours))}${stat('Tax withheld', money(T.tax))}${stat('Super', money(T.superAmt), '')}</div>
      <section class="card"><div class="card-head"><h2>Monthly</h2><span class="hint">${fyName(fy)}</span></div>
        ${months.length ? table(head, body, foot) : empty('💼', `No pay entered for ${fyName(fy)} yet.`, addBtn('income', 'Add pay'))}
        <p class="muted small">Tax uses the ATO weekly withholding formula for the pay date’s financial year. Enter the payslip tax to use the real figure; any difference is flagged.</p></section>
      <section class="card flush"><div class="card-head"><h2>Pay log</h2><span class="hint">Tap to edit</span></div>
        ${log.length ? txRows(log) : empty('💼', 'Nothing yet.')}</section>`;
  }

  // ======================================================================
  // Spending
  // ======================================================================

  function viewExpenses() {
    const M = state.M;
    const m = state.month;
    const sel = state.person;
    const fy = state.fy;
    const share = r => (sel === 'All' ? r.amount : r.shares[sel] || 0);
    const exp = M.expenses.filter(r => r.month === m && (sel === 'All' || r.shares[sel] !== undefined));
    const total = sumOf(exp, share);
    const prevM = E.addMonths(m, -1);
    const prevTotal = M.monthly[prevM] ? M.monthly[prevM].spend[sel] : 0;
    const delta = prevTotal > 0 ? (total - prevTotal) / prevTotal : null;
    const isNow = m === E.monthOf(M.today);
    const daysInMonth = new Date(Date.UTC(+m.slice(0, 4), +m.slice(5, 7), 0)).getUTCDate();
    const daysSoFar = isNow ? +M.today.slice(8, 10) : daysInMonth;
    const days = Array.from({ length: daysInMonth }, (_, i) => m + '-' + String(i + 1).padStart(2, '0'));
    const dayTotals = days.map(d => sumOf(exp.filter(r => r.date === d), share));
    const peak = dayTotals.reduce((best, v, i) => (v > best[1] ? [i, v] : best), [-1, 0]);
    const b = budgetFor(sel, m);
    const who = sel === 'All' ? 'Both' : esc(pName(sel));

    const kpi = `<section class="card"><div class="card-head"><h2>${monthLong(m)} spending</h2><span class="hint">${who}</span></div>
      <div class="kpi4">
        <div><div class="k"><i style="--c:#3B82F6">M</i>This month</div><div class="v">${money(total)}</div>
          ${delta === null ? '<div class="muted small">no data last month</div>' : `<span class="tag ${delta > 0 ? 'warn' : 'good'}">${delta > 0 ? '▲' : '▼'} ${pctf(Math.abs(delta), 1)} vs ${MONTHS[+prevM.slice(5, 7) - 1]}</span>`}</div>
        <div><div class="k"><i style="--c:#A855F7">D</i>${isNow ? 'Today' : 'Biggest day'}</div>
          <div class="v">${money(isNow ? dayTotals[daysSoFar - 1] : peak[1])}</div>${!isNow && peak[0] >= 0 ? `<div class="muted small">${dayLabel(days[peak[0]])}</div>` : ''}</div>
        <div><div class="k"><i style="--c:#F97316">A</i>Daily average</div><div class="v">${money(total / daysSoFar)}</div></div>
        <div><div class="k"><i style="--c:#64748B">B</i>Budget left</div><div class="v${neg(b.left)}">${money(b.left)}</div></div>
      </div></section>`;

    // Where it went: spending by fund (fund colours are the validated palette).
    const byFund = {};
    exp.forEach(r => { if (r.fund) byFund[r.fund] = (byFund[r.fund] || 0) + share(r); });
    const fundRows = M.fundNames.filter(f => byFund[f] > 0.004).map(f => [f, byFund[f]]).sort((x, y) => y[1] - x[1]);
    if (fundRows.length) {
      chart('ch-donut', {
        type: 'doughnut',
        data: { labels: fundRows.map(x => x[0]), datasets: [{ data: fundRows.map(x => E.round2(x[1])), backgroundColor: fundRows.map(x => fColour(x[0])), borderColor: cssVar('--card'), borderWidth: 2, hoverOffset: 6 }] },
        options: { cutout: '66%', maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ' ' + ctx.label + ': ' + money(ctx.parsed) + ' (' + pctf(ctx.parsed / total, 1) + ')' } } } },
      });
    }
    const donut = `<section class="card"><div class="card-head"><h2>Where it went</h2><span class="hint">by fund</span></div>
      ${fundRows.length ? `<div class="donut-box"><canvas id="ch-donut" role="img" aria-label="Spending by fund for ${monthLong(m)}"></canvas>
        <div class="donut-center"><span class="k">Spent</span><span class="v">${money(total)}</span></div></div>
        <div style="margin-top:8px">${fundRows.map(([f, v]) => `<div class="kv"><span class="row" style="gap:2px 8px;min-width:0"><span class="dot" style="--c:${fColour(f)}"></span><span>${esc(fIcon(f))} ${esc(f)}</span> <span class="muted small">${esc(fundOf(f).account)}</span></span>
          <span class="num" style="display:grid;justify-items:end;flex:none"><strong>${money(v)}</strong><span class="muted small">${pctf(v / total, 1)}</span></span></div>`).join('')}</div>`
        : empty('🧾', `No spending in ${monthLong(m)}.`, addBtn('expenses', 'Add expense'))}</section>`;

    // Category ranking (tap a row to see its bills).
    const byCat = {};
    const count = {};
    exp.forEach(r => { byCat[r.category] = (byCat[r.category] || 0) + share(r); count[r.category] = (count[r.category] || 0) + 1; });
    const cats = Object.keys(byCat).filter(c => byCat[c] > 0.004).sort((x, y) => byCat[y] - byCat[x]);
    const maxC = cats.length ? byCat[cats[0]] : 1;
    const ranking = `<section class="card"><div class="card-head"><h2>Top categories</h2><span class="hint">tap to filter</span></div>
      ${cats.length ? cats.map(c => `<div class="rank" role="button" tabindex="0" data-act="cat" data-key="${esc(c)}" style="cursor:pointer${state.cat === c ? ';background:var(--accent-soft);border-radius:12px' : ''}">${tile(cIcon(c), cColour(c), 'round')}
        <div class="name">${esc(c)} <small>${pctf(byCat[c] / total, 1)} · ${count[c]} bill${count[c] > 1 ? 's' : ''}</small></div><strong class="num">${money(byCat[c])}</strong>
        <div class="bar"><span style="--w:${(byCat[c] / maxC * 100).toFixed(1)}%"></span></div></div>`).join('') : empty('📊', 'Nothing to rank yet.')}</section>`;

    // Daily spending line.
    const series = dayTotals.map((v, i) => (isNow && i >= daysSoFar ? null : E.round2(v)));
    chart('ch-daily', {
      type: 'line',
      data: { labels: days.map(d => String(+d.slice(8, 10))), datasets: [{ label: 'Spent', data: series, borderColor: cssVar('--brand-deep'), backgroundColor: cssVar('--brand-deep'), borderWidth: 2, tension: 0,
        pointRadius: series.map(v => (v > 0 ? 4 : 2)), pointHoverRadius: 6, pointBackgroundColor: series.map(v => (v > 0 ? cssVar('--brand-deep') : cssVar('--card'))), pointBorderColor: cssVar('--brand-deep') }] },
      options: {
        maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
        plugins: { legend: { display: false }, tooltip: { callbacks: { title: it => dayLabel(days[it[0].dataIndex]), label: ctx => ' Spent ' + money(ctx.parsed.y) } } },
        scales: { y: { beginAtZero: true, border: { display: false }, ticks: { callback: v => '$' + v } }, x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 8 } } },
      },
    });
    const daily = `<section class="card"><div class="card-head"><h2>Daily Breakdown</h2><span class="hint">Average ${money(total / daysSoFar)}/day${peak[0] >= 0 ? ' · peak ' + money(peak[1]) + ' on ' + dayLabel(days[peak[0]]) : ''}</span></div>
      <div class="chart-box"><canvas id="ch-daily" role="img" aria-label="Spending per day in ${monthLong(m)}"></canvas></div>
      <details class="more"><summary>View as table</summary>${table('<tr><th>Day</th><th class="num">Spent</th></tr>',
        days.map((d, i) => (dayTotals[i] > 0.004 ? `<tr><td>${dayLabel(d)}</td><td class="num">${money(dayTotals[i])}</td></tr>` : '')).join(''))}</details></section>`;

    // Bills for the month (filtered by the chosen category).
    if (state.cat && cats.indexOf(state.cat) < 0) state.cat = '';
    const items = activity({ expenses: true, month: m, cat: state.cat });
    const list = `<section class="card flush"><div class="card-head"><h2>${state.cat ? esc(cIcon(state.cat)) + ' ' + esc(state.cat) : 'All bills'}</h2>
        ${state.cat ? '<button class="btn link" data-act="cat" data-key="">Show all ✕</button>' : addBtn('expenses', 'Add expense')}</div>
      ${items.length ? txRows(items, true) : empty('🧾', `No expenses in ${monthLong(m)}.`)}</section>`;

    // Financial-year breakdown: rows = months, columns = categories used.
    const byMonth = M.catByMonth[sel] || {};
    const months = E.fyMonths(fy);
    const catTotals = {};
    months.forEach(x => Object.keys(byMonth[x] || {}).forEach(c => { catTotals[c] = (catTotals[c] || 0) + byMonth[x][c]; }));
    const order = M.categories.map(c => c.name).concat(Object.keys(catTotals).filter(c => !M.categories.some(x => x.name === c)));
    const used = order.filter(c => Math.abs(catTotals[c] || 0) > 0.004);
    const head = `<tr><th class="sticky">Month</th>${used.map(c => `<th class="num">${esc(cIcon(c))} ${esc(c)}</th>`).join('')}<th class="num">Total</th></tr>`;
    const body = months.map(x => {
      const row = byMonth[x] || {};
      return `<tr><td class="sticky">${fmtMonth(x)}</td>${used.map(c => `<td class="num">${dash(row[c] || 0)}</td>`).join('')}<td class="num"><strong>${dash(sumOf(used, c => row[c] || 0))}</strong></td></tr>`;
    }).join('');
    const foot = `<tr class="total"><td class="sticky">Total</td>${used.map(c => `<td class="num">${money(catTotals[c])}</td>`).join('')}<td class="num">${money(sumOf(used, c => catTotals[c]))}</td></tr>`;
    const yearCard = `<section class="card"><div class="card-head"><h2>Monthly Breakdown</h2>${fySelect(fy, 'fy')}</div>
      ${used.length ? table(head, body, foot) : empty('📊', `No expenses in ${fyName(fy)}.`)}
      <p class="muted small">Shared expenses count toward each person by their split.</p></section>`;

    return kpi + `<div class="cols">${donut}${ranking}</div>` + daily + list + yearCard;
  }

  // ======================================================================
  // Budget
  // ======================================================================

  function viewBudget() {
    const M = state.M;
    const sel = state.person;
    const m = state.month;
    const fy = state.fy;
    const A = M.currentAllocation;
    const funds = M.fundNames;
    const ok = A && Math.abs(A.total - 1) <= 0.00005;

    const allocCard = `<section class="card hide-phone"><div class="card-head"><h2>How each pay is split</h2><span class="hint">${A ? 'from ' + fmtDate(A.from) : ''}</span></div>
      ${A ? stackBar(funds.map(f => ({ label: f, value: A.pct[f], colour: fColour(f) }))) : ''}
      <div style="margin-top:10px">${funds.map(f => `<div class="insight">${tile(fIcon(f), fColour(f), 'sm')}
        <div style="flex:1;min-width:0"><strong>${esc(f)}</strong><div class="muted small">${esc(fundOf(f).account)}</div></div>
        <strong class="num">${A ? pctf(A.pct[f], A.pct[f] * 100 % 1 ? 1 : 0) : '—'}</strong></div>`).join('')}</div>
      <div class="spread" style="margin-top:6px"><span class="muted">Total</span><span class="tag ${ok ? 'good' : 'bad'}">${ok ? '✓' : '⚠'} ${pctf(A ? A.total : 0, 2)}</span></div>
      ${ok ? '' : '<p class="neg small">Percentages must add up to 100%. Fix them in Settings → Allocation.</p>'}</section>`;

    const mb = M.monthly[m];
    const acctCard = `<section class="card"><div class="card-head"><h2>Move to each account</h2><span class="hint">${monthLong(m)}</span></div>
      ${M.accounts.map(a => {
        const inAcct = funds.filter(f => fundOf(f).account === a);
        return `<div class="insight" style="align-items:flex-start">${tile('🏦', 'var(--accent)', 'sm')}<div style="flex:1;min-width:0"><strong>${esc(a)}</strong>
          <div class="muted small">${inAcct.map(esc).join(' · ')}</div>
          <div class="row" style="margin-top:6px">${M.codes.map(c => `<span class="chip">${avatar(c)}${money(mb ? sumOf(inAcct, f => mb.by[c].alloc[f]) : 0)}</span>`).join('')}</div></div>
          <strong class="num">${money(mb ? sumOf(inAcct, f => mb.by.All.alloc[f]) : 0)}</strong></div>`;
      }).join('')}</section>`;

    const fundHead = label => `<tr><th class="sticky">${label}</th><th class="num">Net</th>${funds.map(f => `<th class="num">${esc(fIcon(f))} ${esc(f)}</th>`).join('')}</tr>`;
    const fundCells = t => `<td class="num"><strong>${money(t.net)}</strong></td>${funds.map(f => `<td class="num">${dash(t.alloc[f])}</td>`).join('')}`;
    const months = E.fyMonths(fy).filter(x => M.monthly[x] && M.monthly[x].by[sel].count);
    const monthBody = months.map(x => `<tr><td class="sticky">${fmtMonth(x)}</td>${fundCells(M.monthly[x].by[sel])}</tr>`).join('');
    const fyT = M.fyTotals[fy] ? M.fyTotals[fy].by[sel] : null;
    const weekRows = M.income.filter(r => r.month === m && (sel === 'All' || r.person === sel));
    const weeks = Array.from(new Set(weekRows.map(r => r.week))).sort();
    const weekBody = weeks.map(w => `<tr><td class="sticky">${dayMonth(w)}</td>${fundCells(agg(weekRows.filter(r => r.week === w)))}</tr>`).join('');
    const who = sel === 'All' ? 'both' : esc(pName(sel));

    return `<div class="section-title"><h1>Budget</h1></div>
      <div class="cols">${allocCard}${acctCard}</div>
      <section class="card"><div class="card-head"><h2>Weekly split · ${who}</h2><span class="hint">${monthLong(m)}</span></div>
        ${weeks.length ? table(fundHead('Week of'), weekBody, `<tr class="total"><td class="sticky">Month</td>${fundCells(agg(weekRows))}</tr>`) : empty('🗓️', 'No pay this month.')}</section>
      <section class="card"><div class="card-head"><h2>Monthly split · ${who}</h2>${fySelect(fy, 'fy')}</div>
        ${months.length ? table(fundHead('Month'), monthBody, fyT ? `<tr class="total"><td class="sticky">${fyName(fy)}</td>${fundCells(fyT)}</tr>` : '') : empty('🗓️', `No pay in ${fyName(fy)}.`)}</section>`;
  }

  // ======================================================================
  // Funds (balances)
  // ======================================================================

  function balanceTable(k) {
    const M = state.M;
    const B = M.balances[k];
    const funds = M.fundNames;
    const row = (label, f, cls) => `<tr${cls ? ` class="${cls}"` : ''}><td class="sticky">${label}</td>${funds.map(x => f(B.funds[x], x)).join('')}${f(B.total, null)}</tr>`;
    const amount = (v, isBalance) => `<td class="num${isBalance && v < -0.004 ? ' neg-cell' : neg(v)}">${isBalance ? money(v) : dash(v)}</td>`;
    const head = `<tr><th class="sticky"></th>${funds.map(f => `<th class="num">${esc(fIcon(f))} ${esc(f)}</th>`).join('')}<th class="num">Total</th></tr>`;
    const body = [
      row('Allocated from income', F => amount(F.allocated)),
      B.months.map(m => row('Spent ' + fmtMonth(m), F => amount(-(F.monthly[m] || 0)))).join(''),
      row('Adjustments', F => amount(F.adjustments)),
      row('Bank interest', F => amount(F.interest)),
      row('Balance', F => amount(F.balance, true), 'balance'),
      row('% used', (F, name) => `<td class="num"><div class="small">${pctf(F.usedPct)}</div><div class="bar${F.usedPct > 1 ? ' over' : ''}" style="min-width:70px"><span style="--w:${(clamp01(F.usedPct) * 100).toFixed(1)}%;--c:${name ? fColour(name) : 'var(--accent)'}"></span></div></td>`),
      row('Balance (MYR)', F => `<td class="num muted">${myr(F.balance * M.general.exchangeRate)}</td>`),
    ].join('');
    const accounts = Object.keys(B.byAccount).map(a => `<span class="chip" style="padding-left:10px">🏦 ${esc(a)} <span class="${neg(B.byAccount[a]).trim()}">${money(B.byAccount[a])}</span></span>`).join(' ');
    return `<section class="card">
      <div class="card-head"><span class="row">${avatar(k, 'lg')}<h2>${k === 'All' ? 'Both' : esc(pName(k))}</h2></span>
        <div style="text-align:right"><strong class="${neg(B.total.balance).trim()}" style="font-size:18px">${money(B.total.balance)}</strong><div class="muted small">${myr(B.total.balanceMYR)}</div></div></div>
      <div class="row" style="margin-bottom:8px">${accounts}</div>
      <details class="more" open><summary>Monthly breakdown of fund balances</summary>${table(head, body)}</details></section>`;
  }

  function viewBalances() {
    const M = state.M;
    const sel = state.person;
    const B = M.balances[sel];
    const keys = sel === 'All' ? ['All'].concat(M.codes) : [sel];
    const adj = activity({ adjustments: true });
    return `
      <div class="section-title"><h1>Funds</h1>${addBtn('adjustments', 'Adjustment')}</div>
      <p class="muted small" style="margin:0">Balance = allocated from income (pay and other income) − expenses ± adjustments + bank interest, counted from ${fmtDate(M.general.startDate)}.</p>
      <div class="funds">${M.fundNames.map(f => fundCard(B.funds[f], f)).join('')}</div>
      ${keys.map(balanceTable).join('')}
      <section class="card flush"><div class="card-head"><h2>Adjustments</h2><span class="hint">Transfers, extra pay, opening balances, fixes</span></div>
        ${adj.length ? txRows(adj) : empty('🔁', 'No adjustments yet.', addBtn('adjustments', 'Add adjustment'))}</section>`;
  }

  // ======================================================================
  // Accounts
  // ======================================================================

  function viewAccounts() {
    const M = state.M;
    const sel = state.person;
    const L = M.ledgers[sel];
    const accts = M.accounts;
    const total = sumOf(accts, a => L[a].balance);
    const months = L[accts[0]] ? Object.keys(L[accts[0]].months).sort() : [];

    const hero = `<section class="hero">
      <div class="label">${sel === 'All' ? 'Total in all bank accounts' : esc(pName(sel)) + '’s bank accounts'}</div>
      <div class="big${neg(total)}">${money(total)}</div>
      <div class="myr">≈ ${myr(total * M.general.exchangeRate)} · since opening on ${fmtDate(M.general.startDate)}</div>
      <div class="hero-stats" style="grid-template-columns:repeat(${Math.min(3, accts.length)}, minmax(0, 1fr))">${accts.map(a =>
        `<div class="hero-stat"><div class="k">${esc(aIcon(a))} ${esc(a)}</div><div class="v">${money(L[a].balance)}</div></div>`).join('')}</div></section>`;

    const cards = accts.map(a => {
      const A = L[a];
      const split = sel === 'All' ? `<div class="row">${M.codes.map(c => `<span class="chip">${avatar(c)}${money(M.ledgers[c][a].balance)}</span>`).join('')}</div>` : '';
      return `<section class="card" style="border-top:4px solid ${aColour(a)}">
        <div class="card-head"><span class="row" style="flex-wrap:nowrap;min-width:0">${tile(aIcon(a), aColour(a))}<span class="stack" style="gap:0;min-width:0"><h2>${esc(a)}</h2>
          <span class="muted small">${fundsIn(a).map(f => esc(fIcon(f)) + ' ' + esc(f)).join(' · ')}</span></span></span></div>
        <div style="font-size:28px;font-weight:800;letter-spacing:-.02em" class="${neg(A.balance).trim()}">${money(A.balance)}</div>
        <div class="muted small">${myr(A.balanceMYR)}</div>
        <div class="stats" style="margin:12px 0">${stat('Money in', money(A.in), 'pay ' + money(A.allocated) + (A.transferIn ? ' · transfers ' + money(A.transferIn) : '') + (A.added ? ' · added ' + money(A.added) : ''))}
          ${stat('Money out', money(A.out), 'spent ' + money(A.spent) + (A.transferOut ? ' · transfers ' + money(A.transferOut) : '') + (A.deducted ? ' · taken ' + money(A.deducted) : ''))}</div>
        ${split}
        <div class="row" style="margin-top:12px"><button class="btn" data-act="acct-transfer" data-key="${esc(a)}">🏦 Transfer</button>
          <button class="btn" data-act="acct-open" data-key="${esc(a)}">➕ Add money / opening balance</button></div></section>`;
    }).join('');

    // Running balance over time, one line per account.
    const shown = months.filter(m => m <= E.monthOf(M.today) || accts.some(a => L[a].months[m].in || L[a].months[m].out));
    chart('ch-accounts', {
      type: 'line',
      data: {
        labels: shown.map(fmtMonth),
        datasets: accts.map(a => ({ label: a, data: shown.map(m => E.round2(L[a].months[m].balance)), borderColor: aColour(a), backgroundColor: aColour(a),
          borderWidth: 2, tension: 0.25, pointRadius: 4, pointHoverRadius: 6, pointBorderColor: cssVar('--card'), pointBorderWidth: 2 })),
      },
      options: {
        maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
        plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } }, tooltip: { callbacks: { label: ctx => ' ' + ctx.dataset.label + ': ' + money(ctx.parsed.y) } } },
        scales: { y: { beginAtZero: true, border: { display: false }, ticks: { callback: v => '$' + v.toLocaleString() } }, x: { grid: { display: false } } },
      },
    });

    const ledger = (a, open) => {
      const A = L[a];
      const body = shown.map(m => {
        const x = A.months[m];
        return `<tr><td class="sticky">${fmtMonth(m)}</td><td class="num">${dash(x.allocated)}</td><td class="num">${dash(-x.spent)}</td>
          <td class="num">${dash(x.transferIn - x.transferOut)}</td><td class="num">${dash(x.added - x.deducted)}</td>
          <td class="num${neg(x.in - x.out)}">${signed(x.in - x.out)}</td><td class="num${neg(x.balance)}"><strong>${money(x.balance)}</strong></td></tr>`;
      }).join('');
      return `<details class="more"${open ? ' open' : ''}><summary>${esc(aIcon(a))} ${esc(a)} — monthly</summary>${table(
        '<tr><th class="sticky">Month</th><th class="num">Pay in</th><th class="num">Spent</th><th class="num">Transfers</th><th class="num">Added / taken</th><th class="num">Change</th><th class="num">Balance</th></tr>',
        body, `<tr class="total"><td class="sticky">Total</td><td class="num">${money(A.allocated)}</td><td class="num">${money(-A.spent)}</td><td class="num">${signed(A.transferIn - A.transferOut)}</td><td class="num">${signed(A.added - A.deducted)}</td><td class="num">${signed(A.balance)}</td><td class="num">${money(A.balance)}</td></tr>`)}</details>`;
    };

    const moves = activity({ adjustments: true }).filter(it => {
      const r = M.adjustments.find(x => x.id === it.id);
      return r && (r.betweenAccounts || r.type !== 'Transfer');
    });

    return `
      <div class="section-title"><h1>Accounts</h1><button class="btn primary" data-act="acct-transfer" data-key="${esc(accts[0] || '')}">${ico('plus', 18)}Transfer</button></div>
      ${hero}
      <div class="cols">${cards}</div>
      <section class="card"><div class="card-head"><h2>Balance</h2><span class="hint">${shown.length ? fmtMonth(shown[0]) + ' – ' + fmtMonth(shown[shown.length - 1]) : ''}</span></div>
        ${shown.length ? `<div class="chart-box"><canvas id="ch-accounts" role="img" aria-label="Running balance of each bank account by month"></canvas></div>` : empty('🏦', 'No activity yet.')}
        ${accts.map((a, i) => ledger(a, i === 0)).join('')}
        <p class="muted small">Pay is split into the accounts by the fund mapping (Settings → Funds). Balances count from ${fmtDate(M.general.startDate)}; add an opening balance for money that was already in an account.</p></section>
      <section class="card flush"><div class="card-head"><h2>Transfers &amp; opening balances</h2><span class="hint">Tap to edit</span></div>
        ${moves.length ? txRows(moves) : empty('🔁', 'No account transfers yet.')}</section>`;
  }

  // ======================================================================
  // Wallet: the real money in each account, Australian and Malaysian
  // ======================================================================

  const wOf = id => state.M.wallets.find(w => w.id === id);
  const wMoney = (n, cur) => (cur === 'MYR' ? myr(n) : money(n));
  const wSigned = (n, cur) => (n > 0.004 ? '+' : '') + wMoney(n, cur);
  const wPlace = cur => WALLET_PLACES.find(p => p[1] === cur);
  const rateText = r => '1 AUD = ' + +Number(r).toFixed(4) + ' MYR';
  /** Logos live with the iPhone app on GitHub Pages; the Google web app loads them from there. */
  const logoBase = () => (window.__PWA__ ? 'logos/' : (state.app.pwaUrl || '../assets/') + 'logos/');
  const brandOf = name => WALLET_BRANDS.AU.concat(WALLET_BRANDS.MY).find(b => String(name) === b[0] || String(name).indexOf(b[0] + ' ') === 0);
  const wLogo = w => w.logo || (brandOf(w.name) || [])[3] || '';

  /** Dark text on light card colours (e.g. Maybank yellow), white on the rest. */
  function wInk(hex) {
    const n = parseInt(String(hex).slice(1), 16);
    return (0.299 * (n >> 16 & 255) + 0.587 * (n >> 8 & 255) + 0.114 * (n & 255)) / 255 > 0.62 ? '#1A1A1A' : '#FFFFFF';
  }

  function walletCard(w, preview) {
    const c = w.colour || WALLET_COLOUR;
    const t = E.WALLET_TYPES[w.type];
    const open = preview ? '' : `role="button" tabindex="0" data-act="wallet-open" data-key="${esc(w.id)}"`;
    const logo = wLogo(w);
    return `<div class="wcard" style="--c:${esc(c)};--wi:${wInk(c)}" ${open}>
      <div class="wtop"><span class="wbadge">${esc(w.badge || t.emoji)}${logo ? `<img src="${esc(logoBase() + logo)}.png" alt="" onerror="this.remove()">` : ''}</span>
        <span class="wmain"><span class="wname">${esc(w.name)}</span><span class="wkind">${w.linked ? 'Follows your Savings' : esc(t.label)}${w.checked ? ' · as of ' + dayMonth(w.checked) : ''}</span></span>
        <span class="wbal">${w.debt ? '<small>You owe</small>' : ''}${wMoney(w.shown, w.currency)}</span></div>
      <div class="wbottom"><span>${w.number ? '•••• ' + esc(w.number) : ''}</span><span class="wtag">${esc(pName(w.owner))}</span></div></div>`;
  }

  /** A transfer's details for a list row: the rate, the fee and any note. */
  const transferSub = t => [t.cross ? 'rate ' + +t.rate.toFixed(4) : '', t.fee ? 'fee ' + wMoney(t.fee, t.from.currency) : '', esc(t.note)].filter(Boolean).join(' · ');

  function viewWallet() {
    const M = state.M;
    if (!M.viewer) {
      return `<section class="card">${empty('🔐', `<strong>Whose ${window.__PWA__ ? 'phone' : 'account'} is this?</strong><br>Your wallet is private, so the app needs to know. You can only choose once.`)}
        <div class="two">${M.codes.map(c => `<button class="btn primary" data-act="wallet-claim" data-key="${esc(c)}">${esc(pName(c))}</button>`).join('')}</div></section>`;
    }
    if (state.person !== 'All' && state.person !== M.viewer) {
      return `<section class="card">${empty('🔒', `<strong>${esc(pName(state.person))}’s wallet is private</strong><br>Only ${esc(pName(state.person))} can see it.`)}</section>`;
    }
    const w = wOf(state.walletId);
    return w ? walletDetail(w) : walletHome();
  }

  function walletHome() {
    const M = state.M;
    const T = M.walletTotals.All; // the server only sends this person's accounts and shared ones
    const mine = M.wallets;
    const closed = mine.filter(w => w.closed);
    const stats = [['🇦🇺 Australia', money(T.aud)], ['🇲🇾 Malaysia', myr(T.myr)]].concat(T.debts > 0.004 ? [['↘ Debts', money(T.debts)]] : []);
    const hero = `<section class="hero">
      <div class="label">${esc(pName(M.viewer))}’s accounts + shared</div>
      <div class="big${neg(T.net)}">${money(T.net)}</div>
      <div class="myr">≈ ${myr(T.netMYR)} at ${rateText(M.general.exchangeRate)}</div>
      <div class="hero-stats" style="grid-template-columns:repeat(${stats.length}, minmax(0, 1fr))">${stats.map(([k, v]) => `<div class="hero-stat"><div class="k">${k}</div><div class="v">${v}</div></div>`).join('')}</div></section>`;

    const section = ([country, cur, flag, label]) => {
      const list = mine.filter(w => w.country === country && !w.closed);
      const total = country === 'MY' ? T.myr : T.aud;
      const share = (country === 'MY' ? T.net - T.aud : T.aud) / T.net;
      return `<div class="wsection"><div class="list-head"><h2>${flag} ${label}${T.net > 0 && share > 0 ? ` <span class="tag">${pctf(share)}</span>` : ''}</h2><span class="muted small num">${wMoney(total, cur)}</span></div>
        ${list.length ? `<div class="wstack">${list.map(w => walletCard(w)).join('')}</div>` : ''}
        <button class="btn link" data-act="wallet-new" data-key="${cur}">＋ Add ${country === 'MY' ? 'a Malaysian' : 'an Australian'} account</button></div>`;
    };

    const moves = M.walletTransfers.slice().reverse().slice(0, 30).map(t => ({
      date: t.date, kind: 'walletTransfers', id: t.id, icon: tile(t.cross ? '💱' : '🔁', '#64748B', 'round'), value: 0,
      title: `${esc(t.from.name)} → ${esc(t.to.name)}`, sub: transferSub(t), amt: wMoney(t.left, t.from.currency), small: '→ ' + wMoney(t.received, t.to.currency),
    }));
    const transfers = `<section class="card flush"><div class="card-head"><h2>💱 Transfers</h2><span class="hint">Tap to edit</span></div>
      ${T.toMY.count || T.toAU.count ? `<div class="stats three-up" style="padding:0 18px 6px">${stat('To Malaysia', money(T.toMY.sent), T.toMY.received ? myr(T.toMY.received) + ' arrived' : '')}
        ${stat('To Australia', myr(T.toAU.sent), T.toAU.received ? money(T.toAU.received) + ' arrived' : '')}${stat('Fees paid', money(T.feesAUD))}</div>` : ''}
      ${moves.length ? txRows(moves) : empty('💱', 'No transfers yet.')}</section>`;

    return `
      <div class="section-title"><h1>Wallet</h1><div class="row"><button class="btn" data-act="wallet-transfer" data-key="">🔁 Transfer</button>
        <button class="btn primary" data-act="wallet-new" data-key="">${ico('plus', 18)}Account</button></div></div>
      ${hero}
      <div class="cols">${WALLET_PLACES.map(section).join('')}</div>
      ${closed.length ? `<details class="more"><summary>Closed accounts (${closed.length})</summary><div class="wstack" style="margin-top:10px">${closed.map(w => walletCard(w)).join('')}</div></details>` : ''}
      ${transfers}
      <p class="muted small" style="margin:0 2px">🔒 Only you can see this page. Your Everyday, Self Saving and Shared Saving balances come from Savings ▸ Accounts; any other account shows the balance you record. Transfer fees are saved as expenses.</p>`;
  }

  function walletDetail(w) {
    const M = state.M;
    const m = state.month;
    const cur = w.currency;
    const W = E.walletMonth(w, m, M.today);
    const flip = v => (w.debt ? -v : v);
    const rows = w.events.filter(e => e.month === m).slice().reverse().map(e => {
      const t = e.transfer;
      if (e.title) {
        return { date: e.date, kind: e.kind, id: e.id, icon: tile({ income: '💼', expenses: '🧾', interest: '🏦' }[e.kind] || '🔁', '#64748B', 'round'), value: 0, title: esc(e.title), sub: esc(e.note),
          amt: `<span class="${e.change > 0 ? 'pos' : ''}">${wSigned(e.change, cur)}</span>`, small: wMoney(e.balance, cur) };
      }
      if (!t) {
        return { date: e.date, kind: e.kind, id: e.id, icon: tile('⚖️', '#64748B', 'round'), value: 0, title: 'Balance updated', sub: esc(e.note),
          amt: wMoney(flip(e.balance), cur), small: Math.abs(e.change) > 0.004 ? wSigned(flip(e.change), cur) : 'no change' };
      }
      const out = e.delta < 0;
      return { date: e.date, kind: e.kind, id: e.id, icon: tile(t.cross ? '💱' : '🔁', '#64748B', 'round'), value: 0, title: (out ? 'To ' : 'From ') + esc(out ? t.to.name : t.from.name),
        sub: transferSub(t), amt: `<span class="${out ? '' : 'pos'}">${wSigned(e.change, cur)}</span>`, small: wMoney(flip(e.balance), cur) };
    });
    if (!w.linked && w.date && E.monthOf(w.date) === m) {
      rows.push({ date: w.date, kind: 'wallets', id: w.id, icon: tile('🏁', '#64748B', 'round'), value: 0, title: 'Starting balance', sub: '', amt: wMoney(w.opening, cur), small: '' });
    }
    rows.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    const hasLine = W.days.some(d => d.balance !== null);
    if (hasLine) {
      chart('ch-wallet', {
        type: 'line',
        data: { labels: W.days.map(d => String(+d.date.slice(8, 10))), datasets: [{ label: 'Balance', data: W.days.map(d => d.balance), borderColor: cssVar('--brand-deep'), backgroundColor: cssVar('--accent-soft'),
          fill: true, stepped: true, borderWidth: 2, pointRadius: W.days.map((d, i) => (i === W.days.length - 1 ? 4 : 0)), pointHoverRadius: 5, pointBackgroundColor: cssVar('--brand-deep') }] },
        options: {
          maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
          plugins: { legend: { display: false }, tooltip: { callbacks: { title: items => dayLabel(W.days[items[0].dataIndex].date), label: ctx => ' ' + wMoney(ctx.parsed.y, cur) } } },
          scales: { y: { beginAtZero: true, border: { display: false }, ticks: { callback: v => (cur === 'MYR' ? 'RM ' : '$') + v.toLocaleString() } }, x: { grid: { display: false }, ticks: { maxTicksLimit: 8 } } },
        },
      });
    }
    return `
      <div class="section-title"><button class="icon-btn wback" data-act="wallet-back" aria-label="Back to Wallet" style="flex:none">‹</button><h1 class="wtitle">${esc(w.name)}</h1>
        <button class="icon-btn" data-act="wallet-edit" data-key="${esc(w.id)}" aria-label="Edit account" style="flex:none">✏️</button></div>
      <div class="wsolo">${walletCard(w, true)}</div>
      ${w.closed ? '<div class="notice">This account is closed, so it isn’t counted in your totals.</div>' : ''}
      <div class="two wactions"><button class="btn" data-act="wallet-transfer" data-key="${esc(w.id)}">🔁 Transfer</button><button class="btn" data-act="wallet-update" data-key="${esc(w.id)}">⚖️ ${w.linked ? 'Fix balance' : 'Update balance'}</button></div>
      <div style="text-align:center">${monthNav()}</div>
      <div class="stats">${stat('Money in', wMoney(W.in, cur))}${stat('Money out', wMoney(W.out, cur))}</div>
      <section class="card"><div class="card-head"><h2>${w.debt ? 'Owed' : 'Balance'} in ${MONTHS[+m.slice(5, 7) - 1]}</h2></div>
        ${hasLine ? `<div class="chart-box"><canvas id="ch-wallet" role="img" aria-label="${esc(w.name)} balance by day in ${monthLong(m)}"></canvas></div>` : empty('📈', 'This account has no balance for this month.')}</section>
      <section class="card flush"><div class="card-head"><h2>Records</h2><span class="hint">Tap to edit</span></div>
        ${rows.length ? txRows(rows) : empty('🧾', `Nothing in ${monthLong(m)}.`)}</section>`;
  }

  // ======================================================================
  // Tax
  // ======================================================================

  function viewTax() {
    const M = state.M;
    const fy = state.fy;
    const codes = showCodes();
    const fyb = M.fyTotals[fy];
    const line = (label, value, cls) => `<div class="kv"><span>${label}</span><span class="num${cls || ''}">${value}</span></div>`;

    const cards = codes.map(c => {
      const t = fyb ? fyb.by[c] : null;
      const e = (M.estimates[fy] || {})[c];
      const p = personOf(c);
      const diffs = M.income.filter(r => r.fy === fy && r.person === c && r.actualTax !== null);
      const diffTotal = sumOf(diffs, r => r.taxDiff);
      if (!t || !t.count) return `<section class="card"><div class="card-head"><span class="row">${avatar(c, 'lg')}<h2>${esc(pName(c))}</h2></span></div>${empty('🧾', 'No pay in this year.')}</section>`;
      let estimate = '';
      if (e && e.est) {
        const x = e.est;
        const good = e.refund >= 0;
        estimate = `<div class="receipt" style="margin-top:14px">
          <strong>End-of-year estimate</strong>
          ${line('Taxable income', money(x.taxable))}
          ${line('Tax on income (' + esc(p.residency) + ' rates)', money(x.incomeTax))}
          ${line('− Low Income Tax Offset', money(-x.lito))}
          ${line('+ Medicare levy', p.medicare && p.residency === 'Resident' ? money(x.medicare) : 'not applied')}
          ${line('= Estimated tax', `<strong>${money(x.total)}</strong>`)}
          ${line('Tax withheld', money(e.withheld))}
          <div class="spread" style="margin-top:6px"><span class="tag ${good ? 'good' : 'bad'}">${good ? '✓ Estimated refund' : '⚠ Estimated amount owing'}</span>
            <span class="${good ? 'pos' : 'neg'}" style="font-size:24px">${money(Math.abs(e.refund))}</span></div>
          ${e.projection ? `<p class="small muted" style="margin:4px 0 0">📈 At this pace: full-year gross ≈ ${money(e.projection.gross)} → ${e.projection.refund >= 0 ? 'refund' : 'owing'} ≈ <strong>${money(Math.abs(e.projection.refund))}</strong>.</p>` : ''}</div>`;
      }
      return `<section class="card"><div class="card-head"><span class="row">${avatar(c, 'lg')}<h2>${esc(pName(c))} · TFN tax summary</h2></span><span class="hint">${fyName(fy)}</span></div>
        <div class="stats">${stat('Gross', money(t.gross), t.count + ' pays · ' + hrs(t.hours))}${stat('Tax withheld', money(t.tax))}${stat('Net', money(t.net))}${stat('Super', money(t.superAmt), 'employer')}</div>
        ${diffs.length ? `<p class="small" style="margin:10px 0 0">Payslip − calculated tax: <span class="${Math.abs(diffTotal) > 0.004 ? 'flag' : 'muted'}">${signed(diffTotal)}</span> over ${diffs.length} payslip${diffs.length > 1 ? 's' : ''}</p>` : ''}
        ${estimate}</section>`;
    }).join('');

    const keys = state.person === 'All' ? M.keys : [state.person];
    const months = E.fyMonths(fy).filter(x => M.monthly[x] && M.monthly[x].by.All.count);
    const sub = ['Gross', 'Tax', 'Net', 'Super'];
    const head = `<tr class="group"><th class="sticky"></th>${keys.map(k => `<th colspan="4">${chip(k)}</th>`).join('')}</tr>
      <tr><th class="sticky">Month</th>${keys.map(() => sub.map(s => `<th class="num">${s}</th>`).join('')).join('')}</tr>`;
    const cells = t => [t.gross, t.tax, t.net, t.superAmt].map((v, i) => `<td class="num">${i === 2 ? '<strong>' + money(v) + '</strong>' : money(v)}</td>`).join('');
    const body = months.map(x => `<tr><td class="sticky">${fmtMonth(x)}</td>${keys.map(k => cells(M.monthly[x].by[k])).join('')}</tr>`).join('');
    const foot = fyb ? `<tr class="total"><td class="sticky">${fyName(fy)}</td>${keys.map(k => cells(fyb.by[k])).join('')}</tr>` : '';
    const diffs = activity({ income: true }).filter(it => {
      const r = M.income.find(x => x.id === it.id);
      return r.fy === fy && r.actualTax !== null && Math.abs(r.taxDiff) > 0.004;
    });

    // Every financial year with pay, newest first.
    const years = Object.keys(M.fyTotals).filter(y => M.fyTotals[y].by.All.count).sort().reverse();
    const yearRows = years.map(y => codes.map(c => {
      const t = M.fyTotals[y].by[c];
      if (!t.count) return '';
      const e = (M.estimates[y] || {})[c];
      const r = e ? e.refund : null;
      return `<tr class="click" data-act="fy" data-key="${y}"${y === fy ? ' style="background:var(--accent-soft)"' : ''}><td class="sticky"><strong>${fyName(y)}</strong></td><td>${chip(c)}</td>
        <td class="num">${money(t.gross)}</td><td class="num">${money(t.tax)}</td><td class="num">${money(t.net)}</td><td class="num">${money(t.superAmt)}</td>
        <td class="num">${e && e.est ? money(e.est.total) : '—'}</td>
        <td class="num">${r === null || r === undefined ? '—' : `<span class="tag ${r >= 0 ? 'good' : 'bad'}">${r >= 0 ? 'Refund ' : 'Owing '}${money(Math.abs(r))}</span>`}</td></tr>`;
    }).join('')).join('');
    const yearChips = `<div class="scroller" style="margin:0;padding:2px 0">${(years.indexOf(fy) < 0 ? [fy].concat(years) : years).map(y =>
      `<button class="filter-chip" data-act="fy" data-key="${y}" aria-pressed="${y === fy}" style="padding-left:12px">${fyName(y)}</button>`).join('')}</div>`;

    return `
      <div class="section-title"><h1>Tax &amp; super</h1></div>
      ${yearChips}
      <section class="card"><div class="card-head"><h2>By financial year</h2><span class="hint">1 July – 30 June</span></div>
        ${years.length ? table('<tr><th class="sticky">Year</th><th>Person</th><th class="num">Gross</th><th class="num">Tax withheld</th><th class="num">Net</th><th class="num">Super</th><th class="num">Est. tax</th><th class="num">Refund / owing</th></tr>', yearRows) : empty('🧾', 'No pay yet.')}
        <p class="muted small">Tap a year to see its details below.</p></section>
      <div class="section-title"><h2>${fyName(fy)} in detail</h2></div>
      <div class="cols">${cards}</div>
      <section class="card"><div class="card-head"><h2>Monthly summary</h2><span class="hint">${fyName(fy)}</span></div>${months.length ? table(head, body, foot) : empty('🗓️', `No pay in ${fyName(fy)}.`)}</section>
      <section class="card flush"><div class="card-head"><h2>Payslip differences</h2></div>${diffs.length ? txRows(diffs) : empty('✅', 'Payslip tax matches the calculation (or no payslip tax entered).')}</section>
      <p class="muted small">The estimate uses this app’s pay entries only, with no deductions or other income, and the rates in Settings → Tax tables. It’s a guide, not tax advice. In your first year as a resident the tax-free threshold may be pro-rated.</p>`;
  }

  // ======================================================================
  // Split bills (who owes whom)
  // ======================================================================

  /** "YC owes ZR $12.30", or "All settled". */
  function owesText(balance) {
    const M = state.M;
    if (Math.abs(balance) < 0.005) return 'All settled';
    const debtor = balance > 0 ? M.codes[1] : M.codes[0];
    const creditor = balance > 0 ? M.codes[0] : M.codes[1];
    return esc(pName(debtor)) + ' owes ' + esc(pName(creditor)) + ' ' + money(Math.abs(balance));
  }

  function viewSplit() {
    const M = state.M;
    const S = M.split;
    const hero = S.amount < 0.005
      ? `<section class="hero"><div class="label">Split bills</div><div class="big">🎉 All settled</div>
          <div class="myr">Nobody owes anything right now.</div></section>`
      : `<section class="hero"><div class="label">To settle up</div>
          <div class="row" style="gap:10px;margin:8px 0 2px;flex-wrap:nowrap">${avatar(S.debtor, 'lg')}<span style="font-size:20px">→</span>${avatar(S.creditor, 'lg')}
            <span><strong>${esc(pName(S.debtor))}</strong> owes <strong>${esc(pName(S.creditor))}</strong></span></div>
          <div class="big">${money(S.amount)}</div><div class="myr">≈ ${myr(S.amount * M.general.exchangeRate)}</div>
          <div class="row" style="margin-top:14px"><button class="btn primary" data-act="settle-up">💸 Record payback</button>
            <button class="btn" data-act="split-remind">🔔 Remind ${esc(pName(S.debtor))}</button></div></section>`;

    const add = `<section class="card quick" style="grid-template-columns:repeat(2, minmax(0, 1fr))">
      <button type="button" data-act="split-add" data-key="expense"><span class="q" style="--c:#3B82F6">🧾</span>Someone paid a bill</button>
      <button type="button" data-act="split-add" data-key="payback"><span class="q" style="--c:#16A34A">💸</span>Payback / lend</button></section>`;

    const row = e => {
      if (e.kind === 'expense') {
        return `<div class="tx" role="button" tabindex="0" data-act="edit" data-kind="expenses" data-id="${esc(e.id)}">${tile(cIcon(e.category), cColour(e.category), 'round')}
          <div class="tx-main"><span class="tx-title">${esc(e.title)}</span><span class="tx-sub">${dayLabel(e.date)} · ${esc(pName(e.payer))} paid ${money(e.amount)}</span></div>
          <div class="tx-amt">${money(e.owed)}<small>${esc(pName(e.other))} owes</small></div></div>`;
      }
      return `<div class="tx" role="button" tabindex="0" data-act="edit" data-kind="paybacks" data-id="${esc(e.id)}">${tile('💸', '#16A34A', 'round')}
        <div class="tx-main"><span class="tx-title">${esc(pName(e.from))} → ${esc(pName(e.to))}</span><span class="tx-sub">${dayLabel(e.date)}${e.note ? ' · ' + esc(e.note) : ''}</span></div>
        <div class="tx-amt pos">${money(e.amount)}<small>paid</small></div></div>`;
    };
    const open = S.events.slice(S.openFrom).reverse();
    const settled = S.events.slice(0, S.openFrom).reverse();
    const openCard = `<section class="card flush"><div class="card-head"><h2>Not settled yet</h2><span class="hint">${open.length} item${open.length === 1 ? '' : 's'}</span></div>
      ${open.length ? `<div class="tx-list">${open.map(row).join('')}</div>` : empty('✅', 'Nothing waiting. Add a bill one of you paid for the other.')}</section>`;
    const settledCard = settled.length ? `<section class="card"><details class="more"><summary>Settled earlier (${settled.length})</summary>
      <div class="tx-list" style="margin:6px -18px 0">${settled.map(row).join('')}</div></details></section>` : '';
    const tip = `<p class="muted small">Add an expense and choose <strong>Who paid?</strong> If ${esc(pName(M.codes[0]))} pays a Shared bill, ${esc(pName(M.codes[1]))} owes their share; if one of you pays something that’s entirely the other’s, they owe all of it.
      The bill still counts in each person’s budget as usual. With phone notifications on, whoever owes gets a notification as soon as a bill is added, and a reminder on Tuesdays.</p>`;
    return hero + add + openCard + settledCard + tip;
  }

  // ======================================================================
  // Interest
  // ======================================================================

  function viewInterest() {
    const M = state.M;
    const sel = state.person;
    const fy = state.fy;
    const share = r => (sel === 'All' ? r.amount : r.shares[sel] || 0);
    const mine = M.interest.filter(r => sel === 'All' || r.shares[sel] !== undefined);
    const inFy = mine.filter(r => r.fy === fy);
    let years = Array.from(new Set(M.interest.map(r => r.fy).concat(M.currentFY)));
    if (years.indexOf(fy) < 0) years.push(fy);
    years = years.sort().reverse();
    const fyTotal = sumOf(inFy, share);
    const allTotal = sumOf(mine, share);
    const accts = interestAccounts();
    const months = E.fyMonths(fy).filter(m => m <= E.monthOf(M.today) || inFy.some(r => r.month === m));
    const cell = (m, a) => sumOf(inFy.filter(r => r.month === m && r.account === a), share);

    const hero = `<section class="hero">
      <div class="label">${sel === 'All' ? 'Bank interest we earned' : esc(pName(sel)) + '’s bank interest'} · ${fyName(fy)}</div>
      <div class="big">${money(fyTotal)}</div>
      <div class="myr">≈ ${myr(fyTotal * M.general.exchangeRate)} · all time ${money(allTotal)}</div>
      <div class="hero-stats" style="grid-template-columns:repeat(${Math.min(3, accts.length)}, minmax(0, 1fr))">${accts.map(a =>
        `<div class="hero-stat"><div class="k">${esc(aIcon(a))} ${esc(a)}</div><div class="v">${money(sumOf(inFy.filter(r => r.account === a), share))}</div></div>`).join('')}</div></section>`;
    const chips = `<div class="spread"><div class="scroller" style="margin:0;padding:2px 0">${years.map(y =>
      `<button class="filter-chip" data-act="fy" data-key="${y}" aria-pressed="${y === fy}" style="padding-left:12px">${fyName(y)}</button>`).join('')}</div>${addBtn('interest', 'Record')}</div>`;

    chart('ch-interest', {
      type: 'bar',
      data: { labels: months.map(m => MONTHS[+m.slice(5, 7) - 1]), datasets: accts.map(a => ({ label: a, data: months.map(m => E.round2(cell(m, a))),
        backgroundColor: aColour(a), borderColor: cssVar('--card'), borderWidth: 1, borderRadius: 4, maxBarThickness: 26 })) },
      options: {
        maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
        plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } }, tooltip: { callbacks: { label: ctx => ' ' + ctx.dataset.label + ': ' + money(ctx.parsed.y) } } },
        scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, beginAtZero: true, border: { display: false }, ticks: { callback: v => '$' + v } } },
      },
    });
    const head = `<tr><th class="sticky">Month</th>${accts.map(a => `<th class="num">${esc(aIcon(a))} ${esc(a)}</th>`).join('')}<th class="num">Total</th></tr>`;
    const body = months.map(m => `<tr><td class="sticky">${fmtMonth(m)}</td>${accts.map(a => `<td class="num">${dash(cell(m, a))}</td>`).join('')}
      <td class="num"><strong>${dash(sumOf(accts, a => cell(m, a)))}</strong></td></tr>`).join('');
    const foot = `<tr class="total"><td class="sticky">${fyName(fy)}</td>${accts.map(a => `<td class="num">${money(sumOf(inFy.filter(r => r.account === a), share))}</td>`).join('')}<td class="num">${money(fyTotal)}</td></tr>`;
    const monthly = `<section class="card"><div class="card-head"><h2>Monthly</h2><span class="hint">${fyName(fy)}</span></div>
      ${inFy.length ? `<div class="chart-box"><canvas id="ch-interest" role="img" aria-label="Bank interest per month by account"></canvas></div>` : ''}
      ${table(head, body, foot)}</section>`;

    const list = activity({ interest: true }).filter(it => (M.interest.find(r => r.id === it.id) || {}).fy === fy);
    return hero + chips + monthly + `<section class="card flush"><div class="card-head"><h2>Entries</h2><span class="hint">Tap to edit</span></div>
      ${list.length ? txRows(list) : empty('🏦', `No interest recorded for ${fyName(fy)} yet.`, addBtn('interest', 'Record interest'))}</section>
      <p class="muted small">Interest is added to the fund you choose (so it shows in the account balance) and counts as taxable income in the year-end tax estimate. Interest on the joint Shared Saving account is split ${pctf(M.general.sharedSplit)} / ${pctf(1 - M.general.sharedSplit)} unless you pick one person.</p>`;
  }

  // ======================================================================
  // Super
  // ======================================================================

  function viewSuper() {
    const M = state.M;
    const sel = state.person;
    const codes = showCodes();
    const years = Object.keys(M.fyTotals).filter(y => M.fyTotals[y].by.All.count).sort().reverse();
    const fy = state.fy;
    const T = (y, k) => (M.fyTotals[y] ? M.fyTotals[y].by[k] : { superAmt: 0, gross: 0, count: 0 });
    const allTime = k => sumOf(years, y => T(y, k).superAmt);
    const rows = M.income.filter(r => r.fy === fy && codes.indexOf(r.person) >= 0);
    const rate = rows.length ? rows[rows.length - 1].superRate : 0;

    const hero = `<section class="hero">
      <div class="label">${sel === 'All' ? 'Super we got' : esc(pName(sel)) + '’s super'} · ${fyName(fy)}</div>
      <div class="big">${money(T(fy, sel).superAmt)}</div>
      <div class="myr">All time ${money(allTime(sel))} · ≈ ${myr(allTime(sel) * M.general.exchangeRate)} · paid by employers on top of your pay</div>
      <div class="hero-stats" style="grid-template-columns:repeat(${codes.length}, minmax(0, 1fr))">${codes.map(c =>
        `<div class="hero-stat"><div class="k">${esc(pName(c))} · ${fyName(fy)}</div><div class="v">${money(T(fy, c).superAmt)}</div></div>`).join('')}</div></section>`;
    const yearChips = `<div class="scroller" style="margin:0;padding:2px 0">${(years.indexOf(fy) < 0 ? [fy].concat(years) : years).map(y =>
      `<button class="filter-chip" data-act="fy" data-key="${y}" aria-pressed="${y === fy}" style="padding-left:12px">${fyName(y)}</button>`).join('')}</div>`;

    const cards = codes.map(c => {
      const t = T(fy, c);
      return `<section class="card"><div class="card-head"><span class="row">${avatar(c, 'lg')}<h2>${esc(pName(c))}</h2></span><span class="hint">${fyName(fy)}</span></div>
        <div class="stats">${stat('Super this year', money(t.superAmt), t.count + ' pays')}${stat('All time', money(allTime(c)))}
          ${stat('Gross pay', money(t.gross))}${stat('Super rate', rate ? pctf(rate, 1) : '—', 'of gross')}</div>
        <p class="muted small" style="margin:10px 0 0">✅ Check these amounts arrive in your super fund (your fund’s app or myGov).</p></section>`;
    }).join('');

    const nowMonth = E.monthOf(M.today);
    const months = E.fyMonths(fy).filter(x => x <= nowMonth || M.monthly[x]);
    chart('ch-super', {
      type: 'bar',
      data: { labels: months.map(x => MONTHS[+x.slice(5, 7) - 1]), datasets: codes.map(c => ({ label: pName(c), data: months.map(x => E.round2(M.monthly[x] ? M.monthly[x].by[c].superAmt : 0)),
        backgroundColor: pColour(c), borderRadius: 4, maxBarThickness: 18 })) },
      options: {
        maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
        plugins: { legend: { display: codes.length > 1, position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } }, tooltip: { callbacks: { label: ctx => ' ' + ctx.dataset.label + ': ' + money(ctx.parsed.y) } } },
        scales: { y: { beginAtZero: true, border: { display: false }, ticks: { callback: v => '$' + v } }, x: { grid: { display: false } } },
      },
    });
    const monthTable = table(`<tr><th>Month</th>${codes.map(c => `<th class="num">${esc(pName(c))}</th>`).join('')}</tr>`,
      months.map(x => `<tr><td>${fmtMonth(x)}</td>${codes.map(c => `<td class="num">${dash(M.monthly[x] ? M.monthly[x].by[c].superAmt : 0)}</td>`).join('')}</tr>`).join(''));
    const chartCard = `<section class="card"><div class="card-head"><h2>Monthly</h2><span class="hint">${fyName(fy)}</span></div>
      ${rows.length ? `<div class="chart-box"><canvas id="ch-super" role="img" aria-label="Super per month in ${fyName(fy)}"></canvas></div>
        <details class="more"><summary>View as table</summary>${monthTable}</details>` : empty('🦘', `No pay in ${fyName(fy)} yet.`)}</section>`;

    const yearTable = `<section class="card"><div class="card-head"><h2>By financial year</h2></div>${years.length ? table(
      `<tr><th>Year</th>${codes.map(c => `<th class="num">${esc(pName(c))}</th>`).join('')}${codes.length > 1 ? '<th class="num">Both</th>' : ''}</tr>`,
      years.map(y => `<tr class="click" data-act="fy" data-key="${y}"><td><strong>${fyName(y)}</strong></td>${codes.map(c => `<td class="num">${money(T(y, c).superAmt)}</td>`).join('')}${codes.length > 1 ? `<td class="num"><strong>${money(T(y, 'All').superAmt)}</strong></td>` : ''}</tr>`).join(''),
      `<tr class="total"><td>All time</td>${codes.map(c => `<td class="num">${money(allTime(c))}</td>`).join('')}${codes.length > 1 ? `<td class="num">${money(allTime('All'))}</td>` : ''}</tr>`) : empty('🦘', 'No pay yet.')}</section>`;

    const list = rows.slice().reverse().map(r => ({
      date: r.date, kind: 'income', id: r.id, icon: tile('🦘', pColour(r.person), 'round'),
      title: esc(pName(r.person)) + ' · super', sub: `Gross ${money(r.gross)} × ${pctf(r.superRate, 1)}`,
      amt: money(r.superAmt), small: '', value: r.superAmt,
    }));
    const listCard = `<section class="card flush"><div class="card-head"><h2>From each pay</h2><span class="hint">${fyName(fy)}</span></div>${list.length ? txRows(list) : empty('🦘', 'Nothing yet.')}</section>`;

    return hero + yearChips + `<div class="cols">${cards}</div>` + chartCard + `<div class="cols">${yearTable}${listCard}</div>`;
  }

  // ======================================================================
  // Me
  // ======================================================================

  function viewMe() {
    const M = state.M;
    const m = state.month;
    const sel = state.person;
    const mb = M.monthly[m];
    const spent = mb ? mb.spend[sel] : 0;
    const income = mb ? mb.by[sel].net + (mb.interest[sel] || 0) : 0;
    const b = budgetFor(sel, m);
    const leftPct = b.budget > 0 ? Math.max(0, Math.round((b.left / b.budget) * 100)) : 0;
    const L = M.ledgers[sel];
    const worth = sumOf(M.accounts, a => L[a].balance);
    const years = Object.keys(M.fyTotals).filter(y => M.fyTotals[y].by.All.count);
    const superAll = sumOf(years, y => M.fyTotals[y].by[sel].superAmt);
    const superFy = M.fyTotals[M.currentFY] ? M.fyTotals[M.currentFY].by[sel].superAmt : 0;
    const go = (act, key) => `role="button" tabindex="0" data-act="${act}" data-key="${key}" style="cursor:pointer"`;
    const line = (a, v, cls) => `<div class="kv"><span>${a}</span><span class="num${cls || ''}">${v}</span></div>`;

    const bills = `<section class="card" ${go('group', 'home')}><div class="card-head"><h2>${monthLong(m)} ${m.slice(0, 4)} bills</h2><span class="muted">›</span></div>
      <div class="stats three-up">${stat('In', money(income))}${stat('Spent', money(spent))}${stat('Left', money(income - spent), '', neg(income - spent))}</div></section>`;
    const budget = `<section class="card" ${go('view', 'budget')}><div class="card-head"><h2>${monthLong(m)} everyday budget</h2><span class="muted">›</span></div>
      <div class="row" style="flex-wrap:nowrap;gap:18px"><div class="ring" style="--p:${leftPct}"><div><span class="k">Left</span><span class="v">${leftPct}%</span></div></div>
        <div style="flex:1;min-width:0">${line('Budget left', `<strong>${money(b.left)}</strong>`, neg(b.left))}${line('This month’s budget', money(b.budget))}${line('Spent', money(b.spent))}</div></div></section>`;
    const assets = `<section class="card" ${go('view', 'accounts')}><div class="card-head"><h2>Accounts &amp; net worth</h2><span class="muted">›</span></div>
      <div class="stats">${stat('Net worth', money(worth), myr(worth * M.general.exchangeRate))}${M.accounts.map(a => stat(esc(aIcon(a)) + ' ' + esc(a), money(L[a].balance))).join('')}</div></section>`;
    const sup = `<section class="card" ${go('view', 'super')}><div class="card-head"><h2>🦘 Super</h2><span class="muted">›</span></div>
      <div class="stats">${stat(fyName(M.currentFY), money(superFy))}${stat('All time', money(superAll))}</div></section>`;
    const tool = (emoji, label, attrs) => `<button type="button" ${attrs}><span class="q">${emoji}</span>${label}</button>`;
    const tools = `<section class="card"><div class="card-head"><h2>Tools</h2></div><div class="tools">
      ${tool('🥧', 'Budget split', 'data-act="view" data-key="budget"')}${tool('🧾', 'Tax', 'data-act="view" data-key="tax"')}
      ${tool('🦘', 'Super', 'data-act="view" data-key="super"')}${tool('💼', 'Income', 'data-act="view" data-key="income"')}
      ${tool('🏦', 'Interest', 'data-act="view" data-key="interest"')}${tool('📱', 'Install app', 'data-act="go-install"')}
      ${tool('⚙️', 'Settings', 'data-act="view" data-key="settings"')}${tool('📥', 'Import CSV', 'data-act="go-import"')}
      <a href="${esc(state.app.sheetUrl)}" target="_blank" rel="noopener"><span class="q">📊</span>Google Sheet</a>
      ${tool('🔄', 'Refresh', 'data-act="reload"')}</div></section>`;
    const fx = `<section class="card"><div class="card-head"><h2>💱 AUD ↔ MYR</h2><span class="hint">1 AUD = ${M.general.exchangeRate} MYR${state.app.rateDate ? ' · ' + fmtDate(state.app.rateDate) : ''}</span></div>
      <div class="fx"><label class="field"><span>AUD</span><input id="fx-aud" type="number" inputmode="decimal" step="0.01" value="100"></label><span class="eq">=</span>
        <label class="field"><span>MYR</span><input id="fx-myr" type="number" inputmode="decimal" step="0.01" value="${(100 * M.general.exchangeRate).toFixed(2)}"></label></div></section>`;
    const people = `<section class="card"><div class="card-head"><h2>👥 People</h2><button class="btn link" data-act="view" data-key="settings">Edit</button></div>
      ${M.people.map(p => `<div class="insight">${avatar(p.code, 'lg')}<div style="flex:1"><strong>${esc(p.name)}</strong>
        <div class="muted small">${money(p.rate)}/h · ${p.hoursPerDay} h/day · ${esc(p.residency)}${p.tft ? ' · tax-free threshold' : ''}${p.medicare ? '' : ' · no Medicare levy'}</div></div></div>`).join('')}</section>`;
    return `<div class="cols">${bills}${budget}</div><div class="cols">${assets}${sup}</div>` + tools + `<div class="cols">${fx}${people}</div>`;
  }

  // ======================================================================
  // Settings
  // ======================================================================

  const GRIDS = {};

  function grid(id, cols, rows, addLabel) {
    GRIDS[id] = cols;
    return `<div class="table-wrap"><table class="grid-edit" id="${id}">
      <thead><tr>${cols.map(c => `<th>${esc(c.label)}</th>`).join('')}<th></th></tr></thead>
      <tbody>${rows.map(r => gridRow(cols, r)).join('')}</tbody></table></div>
      <button type="button" class="btn link" data-act="grid-add" data-key="${id}">＋ ${addLabel || 'Add row'}</button>`;
  }

  function gridRow(cols, r) {
    return `<tr>${cols.map(c => `<td>${gridCell(c, r ? r[c.key] : '')}</td>`).join('')}<td><button type="button" class="btn link danger" data-act="grid-del" aria-label="Delete row">✕</button></td></tr>`;
  }

  function gridCell(c, v) {
    const k = `data-key="${esc(c.key)}" aria-label="${esc(c.label)}"`;
    const val = blank(v) ? '' : v;
    if (c.type === 'select') {
      const opts = c.options.indexOf(String(val)) < 0 && val !== '' ? [String(val)].concat(c.options) : c.options;
      return `<select ${k}>${opts.map(o => `<option${String(o) === String(val) ? ' selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
    }
    if (c.type === 'pct') return `<input ${k} data-type="pct" type="number" step="any" inputmode="decimal" value="${val === '' ? '' : +(E.pct(val) * 100).toFixed(4)}">`;
    if (c.type === 'number') return `<input ${k} data-type="number" type="number" step="any" inputmode="decimal" value="${esc(val)}">`;
    if (c.type === 'date') return `<input ${k} type="date" value="${esc(val)}">`;
    if (c.type === 'color') return `<input ${k} type="color" value="${esc(val || '#888888')}">`;
    return `<input ${k} type="text" value="${esc(val)}"${c.list ? ` list="${c.list}"` : ''}>`;
  }

  function readGrid(id) {
    const cols = GRIDS[id];
    return Array.from(document.querySelectorAll('#' + id + ' tbody tr')).map(tr => {
      const o = {};
      cols.forEach(c => {
        const el = tr.querySelector(`[data-key="${c.key}"]`);
        let v = el ? el.value.trim() : '';
        if (c.type === 'pct') v = v === '' ? '' : Number(v) / 100;
        else if (c.type === 'number') v = v === '' ? '' : Number(v);
        o[c.key] = v;
      });
      return o;
    }).filter(o => cols.some(c => c.type !== 'select' && c.type !== 'color' && c.key !== 'icon' && !blank(o[c.key]))); // drop untouched new rows
  }

  const yesNo = v => (v === true || /^(y|yes|true)$/i.test(String(v)) ? 'Yes' : 'No');
  const saveBar = (act, label) => `<div class="spread" style="margin-top:10px"><span></span><button class="btn primary" data-act="${act}">${label}</button></div>`;

  function viewSettings() {
    const M = state.M;
    const S = state.app.data.settings;
    const g = S.general;
    const people = S.people.map(p => Object.assign({}, p, { tft: yesNo(p.tft), medicare: blank(p.medicare) ? 'Yes' : yesNo(p.medicare), scale: blank(p.scale) ? 'Auto' : String(p.scale) }));
    const fundCols = M.fundNames.map((f, i) => ({ key: 'f' + i, label: f, type: 'pct' }));
    const allocRows = S.allocations.map(a => {
      const r = { from: a.from };
      M.fundNames.forEach((f, i) => { r['f' + i] = a.pct[f]; });
      return r;
    });
    const fundRows = S.funds.map(f => Object.assign({}, f, { icon: f.icon || ICON_FALLBACK[f.name] || '' }));
    const catRows = S.categories.map(c => Object.assign({}, c, { icon: c.icon || ICON_FALLBACK[c.name] || '' }));
    state.after.push(updateAllocTotals);
    state.after.push(renderTaxTables);
    state.after.push(renderImporter);
    state.after.push(() => renderPush(null));
    state.after.push(() => renderInstall(null));
    state.after.push(() => renderWidget(widgetState.status)); // asks the server only the first time
    if (!window.__PWA__) state.after.push(() => renderLog(null));
    return `
      <div class="section-title"><h1>Settings</h1></div>
      <section class="card"><div class="card-head"><h2>⚙️ General</h2></div>
        <div class="three">
          <label class="field"><span>MYR per 1 AUD</span><input id="s-rate" type="number" step="any" inputmode="decimal" value="${esc(g.exchangeRate)}"></label>
          <label class="field"><span>Balance start date</span><input id="s-start" type="date" value="${esc(g.startDate)}"></label>
          <label class="field"><span>Shared split: ${esc(pName(M.codes[0]))} pays %</span><input id="s-split" type="number" step="any" inputmode="decimal" value="${blank(g.sharedSplit) ? 50 : +(E.pct(g.sharedSplit) * 100).toFixed(2)}"></label>
        </div>
        <label class="field" style="margin-top:12px"><span>App icon link (optional, https … .png)</span><input id="s-icon" type="url" placeholder="https://raw.githubusercontent.com/…/icon-512.png" value="${esc(g.iconUrl || '')}"></label>
        <p class="muted small">The MYR rate comes from Google Finance every morning${state.app.rateDate ? ' (last updated ' + fmtDate(state.app.rateDate) + ')' : ''}, so a rate typed here lasts until the next update. Entries and transfers keep the rate they were saved with. Fund and account balances count from the start date (the day you opened / started tracking). The split is used when a Shared expense has no % of its own. The icon link sets the browser-tab and home-screen icon (see README).</p>
        ${saveBar('save-general', 'Save')}</section>

      <section class="card" id="lock-card">${lockCard()}</section>

      <section class="card" id="install-card"></section>

      <section class="card" id="push-card"></section>

      <section class="card" id="widget-card"></section>

      <section class="card"><div class="card-head"><h2>👥 People</h2></div>
        ${grid('g-people', [
          { key: 'code', label: 'Code' }, { key: 'name', label: 'Name' }, { key: 'rate', label: 'Hourly rate', type: 'number' },
          { key: 'tft', label: 'Tax-free threshold', type: 'select', options: ['Yes', 'No'] },
          { key: 'residency', label: 'Residency', type: 'select', options: RESIDENCIES },
          { key: 'hoursPerDay', label: 'Hours/day', type: 'number' },
          { key: 'medicare', label: 'Medicare levy', type: 'select', options: ['Yes', 'No'] },
          { key: 'scale', label: 'Withholding scale', type: 'select', options: SCALES },
          { key: 'colour', label: 'Colour', type: 'color' }, { key: 'usualDays', label: 'Usual days/week', type: 'number' }], people, 'Add person')}
        <p class="muted small">"Auto" picks scale 2 for residents claiming the tax-free threshold, 1 if not, 3 for foreign residents, WHM for working holiday makers. Choose 5 for a full Medicare levy exemption. A new rate applies to pay entered from now on; each pay keeps the rate it was saved with.</p>
        ${saveBar('save-people', 'Save people')}</section>

      <section class="card"><div class="card-head"><h2>🏦 Funds &amp; bank accounts</h2><button class="btn" data-act="fund-colours">🎨 Use recommended accounts &amp; colours</button></div>
        <datalist id="dl-accounts">${M.accounts.map(a => `<option value="${esc(a)}">`).join('')}</datalist>
        ${grid('g-funds', [{ key: 'icon', label: 'Icon' }, { key: 'name', label: 'Fund' }, { key: 'account', label: 'Bank account', list: 'dl-accounts' }, { key: 'colour', label: 'Colour', type: 'color' }], fundRows, 'Add fund')}
        <p class="muted small">Icons can be any emoji. If you rename a fund, also update Categories and Allocation, and past adjustments that use the old name.</p>
        ${saveBar('save-funds', 'Save funds')}</section>

      <section class="card"><div class="card-head"><h2>🥧 Allocation</h2></div>
        ${grid('g-alloc', [{ key: 'from', label: 'Effective from', type: 'date' }].concat(fundCols), allocRows, 'Add a new allocation version')}
        <p class="small" id="alloc-totals"></p>
        <p class="muted small">Percent of each net pay put into each fund. A pay uses the latest version on or before its date, so to change the split from a certain date, add a row instead of editing the old one.</p>
        ${saveBar('save-alloc', 'Save allocation')}</section>

      <section class="card"><div class="card-head"><h2>🏷️ Categories</h2></div>
        ${grid('g-cats', [{ key: 'icon', label: 'Icon' }, { key: 'name', label: 'Category' }, { key: 'fund', label: 'Paid from fund', type: 'select', options: M.fundNames }], catRows, 'Add category')}
        ${saveBar('save-cats', 'Save categories')}</section>

      <section class="card hide-phone" id="tax-tables"></section>

      <section class="card"><div class="card-head"><h2>🗂️ Data</h2></div>
        <div class="row">
          <a class="btn" href="${esc(state.app.sheetUrl)}" target="_blank" rel="noopener">Open the Google Sheet</a>
          <button class="btn" data-act="refresh-reports">Update report tabs</button>
          <button class="btn" data-act="sample-load">Load sample data</button>
          <button class="btn danger" data-act="sample-remove">Remove sample data</button>
          <button class="btn danger" data-act="clear-all">🗑️ Delete all entries…</button>
        </div>
        <p class="muted small">Signed in as ${esc(state.app.user || 'unknown')}. Sample entries have IDs starting with "S-" and can be removed without touching your own entries.</p></section>

      ${window.__PWA__ ? '' : '<section class="card" id="log-card"></section>'}

      <section class="card" id="importer"></section>`;
  }

  /** Activity log (Google web app only): every change, who made it and how. Loaded after the page draws. */
  const LOG_ALERTS = ['Wrong pairing code', 'Blocked request', 'Edited in the Sheet', 'Sheet structure changed', 'Unknown Telegram chat'];
  const LOG_ICONS = { Added: '➕', Changed: '✏️', Deleted: '🗑️', 'Settings changed': '⚙️', 'Phone paired': '📱', 'Phone removed': '📵', 'Pairing code created': '🔑' };

  function renderLog(log) {
    const el = $('#log-card');
    if (!el) return;
    const head = `<div class="card-head"><h2>🧾 Activity log</h2><button class="btn" data-act="log-refresh">↻ Refresh</button></div>`;
    if (!log) {
      el.innerHTML = head + '<p class="muted">Loading…</p>';
      call('getActivityLog', 1000).then(renderLog).catch(err => { el.innerHTML = head + `<p class="flag">${esc(errText(err))}</p>`; });
      return;
    }
    state.log = log;
    state.logShow = 50;
    el.innerHTML = head + `
      ${log.ready ? '' : `<div class="notice small">The log switches on the next time the Sheet’s owner${log.owner ? ' (' + esc(log.owner) + ')' : ''} opens this web app or the iPhone app. Until then, changes are kept and written then.</div>`}
      <p class="muted small" style="margin-top:0">Every add, change and delete, settings changes, phone pairing and edits made directly in the Sheet, newest first.
        🔒 Only ${esc(log.owner || 'the Sheet’s owner')} can change the log${log.url ? ` (<a href="${esc(log.url)}" target="_blank" rel="noopener">tab in the Sheet</a>)` : ''}. Red rows need a look.</p>
      <label class="field"><span>Search</span><input id="log-q" type="search" placeholder="e.g. Deleted, ZR, Grocery, Sheet" autocomplete="off" value="${esc(state.logQ || '')}"></label>
      <div id="log-list"></div>`;
    renderLogList();
  }

  function renderLogList() {
    const el = $('#log-list');
    if (!el || !state.log) return;
    const q = (state.logQ || '').trim().toLowerCase();
    const rows = state.log.rows.filter(r => !q || [r.who, r.via, r.action, r.tab, r.id, r.details].join(' ').toLowerCase().indexOf(q) >= 0);
    const when = t => {
      const d = new Date(t);
      return isNaN(d) ? esc(t) : d.toLocaleString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
    };
    el.innerHTML = (rows.length ? rows.slice(0, state.logShow).map(r => `<div class="log-row${LOG_ALERTS.indexOf(r.action) >= 0 ? ' alert' : ''}">
        <div class="spread"><strong>${LOG_ICONS[r.action] || (LOG_ALERTS.indexOf(r.action) >= 0 ? '⚠️' : '•')} ${esc(r.action)}${r.tab ? ' <span class="muted">· ' + esc(r.tab) + '</span>' : ''}</strong>
          <span class="muted small nowrap">${when(r.time)}</span></div>
        ${r.details ? `<div class="small log-details">${esc(r.details)}</div>` : ''}
        <div class="muted small">${esc(r.who)} · ${esc(r.via)}${r.id ? ' · ' + esc(r.id) : ''}${r.pending ? ' · <em>waiting to be written to the Sheet</em>' : ''}</div></div>`).join('')
      : `<p class="muted small">${q ? 'Nothing matches “' + esc(q) + '”.' : 'Nothing logged yet.'}</p>`) +
      (rows.length > state.logShow ? `<button class="btn block" data-act="log-more" style="margin-top:10px">Show more (${rows.length - state.logShow} older)</button>` : '') +
      `<p class="muted small" style="margin-bottom:0">Showing the latest ${Math.min(state.logShow, rows.length)} of ${rows.length}${state.log.total > state.log.rows.length ? ' (the Sheet has ' + state.log.total + ' in all)' : ''}.</p>`;
  }

  /** Install on iPhone: pairing codes and paired phones (loaded after the page draws). */
  function renderInstall(devices) {
    const el = $('#install-card');
    if (!el) return;
    const head = '<div class="card-head"><h2>📱 Install on iPhone</h2></div>';
    if (!devices) {
      el.innerHTML = head + '<p class="muted">Loading…</p>';
      call('apiDevices').then(renderInstall).catch(err => { el.innerHTML = head + `<p class="flag">${esc(errText(err))}</p>`; });
      return;
    }
    const url = state.app.pwaUrl || '';
    el.innerHTML = head + `
      ${window.__PWA__ ? '<p class="small" style="margin-top:0"><span class="tag good">✓ You’re using the installed app</span></p>' : ''}
      <ol class="small" style="padding-left:20px;margin:0 0 10px;display:grid;gap:4px">
        <li>On the iPhone, open <a href="${esc(url)}" target="_blank" rel="noopener">${esc(url.replace(/^https:[/][/]/, ''))}</a> in <strong>Safari</strong>.</li>
        <li>Tap <strong>Share</strong> ⬆︎ ▸ <strong>Add to Home Screen</strong> ▸ <strong>Add</strong>.</li>
        <li>Open <strong>ZR &amp; YC</strong> from the Home Screen. Press <strong>Get pairing code</strong> below and type the code into the app.</li>
      </ol>
      <button class="btn primary" data-act="pair-code">🔑 Get pairing code</button>
      <div id="pair-out"></div>
      <h3 style="margin-top:14px">Paired phones</h3>
      ${devices.length ? devices.map(d => `<div class="spread" style="padding:8px 0;border-top:1px solid var(--line)">
        <span style="min-width:0"><strong>${esc(d.name)}</strong><div class="muted small">paired ${fmtDate(String(d.created).slice(0, 10))} · last used ${fmtDate(String(d.lastUsed).slice(0, 10))}</div></span>
        <button class="btn link danger" data-act="device-remove" data-key="${esc(d.id)}">Remove</button></div>`).join('')
        : '<p class="muted small" style="margin:4px 0 0">No phones paired yet.</p>'}
      <p class="muted small" style="margin-bottom:0">🔒 Only paired phones can reach your data. Each code works once, for 30 minutes. Remove a phone here if it’s lost or replaced.</p>`;
  }

  /** Phone notifications card. Turning them on happens on the phone itself (the installed app). */
  const pushSupported = () => !!(window.__PWA__ && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window);

  function renderPush(status) {
    const el = $('#push-card');
    if (!el) return;
    const head = on => `<div class="card-head"><h2>🔔 Phone notifications</h2>${on === undefined ? '' : `<span class="tag ${on ? 'good' : ''}">${on ? 'On for this phone' : 'Off'}</span>`}</div>`;
    if (!status) {
      el.innerHTML = head() + '<p class="muted">Checking…</p>';
      call('pushStatus').then(renderPush).catch(err => { el.innerHTML = head() + `<p class="flag">${esc(errText(err))}</p>`; });
      return;
    }
    const sch = status.schedule;
    const who = c => (c === 'both' ? 'both of you' : pName(c));
    const hour = h => (h % 12 || 12) + (h < 12 ? ' am' : ' pm');
    const what = `<ul class="small" style="padding-left:20px;margin:0 0 10px;display:grid;gap:3px">
        <li><strong>Tuesday ${hour(sch.payHour)}</strong>: did you get paid? Tap to record it (your usual days are filled in).</li>
        <li><strong>Daily ${hour(sch.remindHour)}</strong>: pay still to move to Self Saving / Shared Saving, until you tap ✅ Done.</li>
        <li><strong>1st of the month, ${hour(sch.interestHour)}</strong>: record last month’s bank interest.</li>
        <li><strong>Split bills</strong>: as soon as the other person adds a bill they paid, on Tuesdays, and when they tap <strong>Remind</strong>.</li></ul>`;
    const phones = status.phones.length ? `<h3 style="margin-top:12px">Phones with notifications</h3>${status.phones.map(ph => `<div class="spread" style="padding:6px 0;border-top:1px solid var(--line)">
        <span><strong>${esc(ph.name)}</strong>${ph.me ? ' <span class="tag good">this phone</span>' : ''}<div class="muted small">for ${esc(who(ph.person))}</div></span></div>`).join('')}` : '';
    const personSelect = sel => `<label class="field"><span>Notify this phone about</span><select id="push-person">${state.M.codes.map(c => `<option value="${esc(c)}"${sel === c ? ' selected' : ''}>${esc(pName(c))}</option>`).join('')}
        <option value="both"${sel === 'both' ? ' selected' : ''}>Both of us</option></select></label>`;
    let body;
    if (!window.__PWA__) {
      body = `${what}<p class="small">Turn them on <strong>on each iPhone</strong>: open the <strong>ZR &amp; YC</strong> app from the Home Screen ▸ Me ▸ Settings ▸ Phone notifications.</p>
        ${phones}<div class="row" style="margin-top:10px"><button class="btn" data-act="push-test"${status.phones.length ? '' : ' disabled'}>Send a test to every phone</button></div>`;
    } else if (!pushSupported()) {
      body = `${what}<p class="flag small">This phone can’t get notifications from the app. It needs iOS 16.4 or later, and the app must be opened from the Home Screen icon (not Safari).</p>${phones}`;
    } else if (status.me) {
      body = `${what}${personSelect(status.me.person)}
        <div class="row" style="margin-top:10px"><button class="btn" data-act="push-on">Save</button><button class="btn" data-act="push-test">Send a test</button><button class="btn link danger" data-act="push-off">Turn off on this phone</button></div>${phones}`;
    } else {
      const denied = Notification.permission === 'denied';
      body = `${what}${personSelect(state.M.codes[0])}
        ${denied ? '<p class="flag small">Notifications are blocked for this app. Allow them in iPhone Settings ▸ Notifications ▸ ZR &amp; YC, then come back.</p>' : ''}
        <button class="btn primary" data-act="push-on" style="margin-top:10px">🔔 Turn on for this phone</button>
        <p class="muted small" style="margin-bottom:0">Your iPhone will ask to allow notifications: tap <strong>Allow</strong>.</p>${phones}`;
    }
    el.innerHTML = head(window.__PWA__ ? !!status.me : undefined) + body;
  }

  const b64Bytes = b64 => Uint8Array.from(atob(b64.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - b64.length % 4) % 4)), c => c.charCodeAt(0));
  const bytesB64 = buf => btoa(String.fromCharCode.apply(null, new Uint8Array(buf))).replace(/[+]/g, '-').replace(/[/]/g, '_').replace(/=+$/, '');

  /** Asks the phone for permission (this must start straight from the tap), subscribes and tells the server. */
  async function pushTurnOn(person) {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') throw new Error('Notifications weren’t allowed. Allow them in iPhone Settings ▸ Notifications ▸ ZR & YC.');
    const reg = await navigator.serviceWorker.ready;
    const key = await call('pushPublicKey');
    let sub = await reg.pushManager.getSubscription();
    const subKey = sub && sub.options && sub.options.applicationServerKey;
    if (sub && subKey && bytesB64(subKey) !== key) {
      await sub.unsubscribe();
      sub = null;
    }
    if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64Bytes(key) });
    return call('pushSubscribe', sub.toJSON(), person);
  }

  async function pushTurnOff() {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) await sub.unsubscribe();
    return call('pushUnsubscribe');
  }

  // ======================================================================
  // Home Screen widgets (iPhone, through the free Scriptable app)
  // ======================================================================
  // Widget.gs keeps each phone's looks and works out the numbers on every widget refresh; widget/scriptable.js
  // draws them on the iPhone. The preview here uses the same calculation (Engine.monthSummary).

  const SCRIPTABLE_APP = 'https://apps.apple.com/app/scriptable/id1405459188';
  const WIDGET_BACKS = [['auto', 'Auto'], ['light', 'Light'], ['dark', 'Dark'], ['colour', 'Colour'], ['picture', 'Picture']];
  const WIDGET_COLOURS = ['#F2B705', '#F97316', '#EF4444', '#EC4899', '#D9A8F0', '#A855F7', '#3B82F6', '#14B8A6', '#16A34A', '#0F172A'];
  const WIDGET_PIC_BYTES = 36000; // as base64 this still fits one Sheet cell (Widget.gs)
  const widgetState = { status: null, size: 's', script: '', seq: 0 };

  function loadWidgetScript() {
    if (widgetState.script || !window.__PWA__) return;
    fetch('widget/scriptable.js?v=' + encodeURIComponent(window.__BUILD__ || ''))
      .then(r => (r.ok ? r.text() : '')).then(t => { widgetState.script = t; }).catch(() => {});
  }

  // Apple's widget sizes for this screen width (points), so the preview is the real size.
  function widgetBox(size) {
    const row = [[428, 170, 364], [414, 169, 360], [390, 158, 338], [375, 155, 329], [0, 141, 292]].find(r => Math.min(window.innerWidth, 430) >= r[0]);
    return size === 's' ? [row[1], row[1]] : [row[2], row[1]];
  }

  const widgetMoney = (v, short) => {
    const n = Math.abs(Number(v) || 0);
    const sign = v < -0.004 ? '−' : '';
    if (short && n >= 1000) return sign + '$' + (n >= 1e6 ? (n / 1e6).toFixed(1) + 'm' : (n / 1e3).toFixed(1) + 'k');
    return sign + '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };
  const lightColour = c => {
    const h = String(c || '').replace('#', '');
    if (h.length !== 6) return false;
    return 0.299 * parseInt(h.slice(0, 2), 16) + 0.587 * parseInt(h.slice(2, 4), 16) + 0.114 * parseInt(h.slice(4, 6), 16) > 165;
  };

  /** The same picture the iPhone draws (widget/scriptable.js), in HTML. */
  function widgetPreview(size, look, picture) {
    const M = state.M;
    const m = M.today.slice(0, 7);
    const who = look.who;
    const s = E.monthSummary(M, who, m);
    const accent = look.color || (who !== 'All' && pColour(who)) || '#F2B705';
    const dark = window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches;
    const back = look.back === 'picture' && !picture ? 'dark' : look.back;
    const onDark = back === 'dark' || back === 'picture' || (back === 'auto' && dark);
    let ink = onDark ? '#FFFFFF' : '#1E2A3A';
    let soft = onDark ? 'rgba(255,255,255,.75)' : '#667085';
    let track = onDark ? 'rgba(255,255,255,.18)' : 'rgba(0,0,0,.08)';
    let rings = onDark ? ['#4ADE80', '#FF8A8A', accent] : ['#16A34A', '#E5484D', accent];
    let bar = accent;
    let bad = onDark ? '#FF8A8A' : '#D33A3A';
    let bg = onDark ? '#1C1C1E' : '#FFFFFF';
    if (back === 'picture') { track = 'rgba(255,255,255,.3)'; rings = ['#FFFFFF', '#FFFFFF', '#FFFFFF']; }
    if (back === 'colour') {
      ink = lightColour(accent) ? '#1E2A3A' : '#FFFFFF';
      soft = ink === '#FFFFFF' ? 'rgba(255,255,255,.75)' : 'rgba(30,42,58,.75)';
      track = ink === '#FFFFFF' ? 'rgba(255,255,255,.25)' : 'rgba(30,42,58,.2)';
      rings = [ink, ink, ink];
      bar = ink;
      bad = ink;
      bg = accent;
    }
    const [w, h] = widgetBox(size);
    // .45 = PICTURE_SHADE in widget/scriptable.js: dark enough for white words, also on a Clear or Tinted Home Screen.
    const bgCss = back === 'picture' ? `background:linear-gradient(rgba(0,0,0,.45),rgba(0,0,0,.45)),url('${picture}') center/cover` : `background:${bg}`;
    // Real size, or a little smaller where the card is narrower than the widget (medium on smaller iPhones).
    const box = `class="wprev ${size}${back === 'picture' ? ' pic' : ''}" style="width:min(${w}px,100%);aspect-ratio:${w}/${h};${bgCss};color:${ink}" role="img"`;
    const name = who === 'All' ? 'Both of us' : pName(who);
    if (size === 's') {
      const b = s.budget;
      const none = !(b.budget > 0) && !(b.spent > 0);
      const part = b.budget > 0 ? Math.min(1, Math.max(0, b.spent) / b.budget) : b.spent > 0 ? 1 : 0;
      const over = b.left < -0.004;
      const label = who === 'All' ? 'Budget' : pName(who) + '’s budget';
      return `<div ${box} aria-label="${esc(label)}: ${esc(widgetMoney(b.left))} left">
        <div class="wp-head"><span style="color:${soft}">${esc(label)}</span><b>${esc(monthLong(m).slice(0, 3))}</b></div>
        <div class="wp-big" style="${over ? 'color:' + bad + ';' : ''}${none ? 'font-size:19px' : ''}">${none ? 'No budget yet' : esc(widgetMoney(b.left, look.short)) + ' left'}</div>
        <div class="wp-bar" style="background:${track}">${part > 0 ? `<span style="width:${Math.max(8, part * 100).toFixed(1)}%;background:${over ? bad : bar}"></span>` : ''}</div>
        <div class="wp-foot" style="color:${soft}">${none ? 'Add this month’s pay' : esc(widgetMoney(b.spent, look.short)) + ' of ' + esc(widgetMoney(b.budget, look.short))}</div></div>`;
    }
    const income = Math.max(0, s.income);
    const share = v => (income > 0 ? Math.max(0, v) / income : v > 0 ? 1 : 0);
    const cols = [['Income', '💼', s.income, income > 0 ? 1 : 0], ['Expenses', '🛒', s.spent, share(s.spent)], ['Remaining', '💵', s.left, share(s.left)]];
    return `<div ${box} aria-label="${esc(monthLong(m))}: income ${esc(widgetMoney(s.income))}, expenses ${esc(widgetMoney(s.spent))}, remaining ${esc(widgetMoney(s.left))}">
      <div class="wp-head"><b>${esc(monthLong(m))}</b><span style="color:${soft};font-size:12px">${esc(name)}</span></div>
      <div class="wp-cols">${cols.map(([label, icon, v, part], i) => `<div class="wp-col">
        <div class="wp-ring" style="--p:${(Math.min(1, part) * 360).toFixed(1)}deg;--c:${rings[i]};--t:${track}"></div><span class="wp-icon" aria-hidden="true">${icon}</span>
        <span class="wp-label" style="color:${soft}">${label}</span>
        <b class="wp-amt" style="${i === 2 && v < -0.004 ? 'color:' + bad : ''}">${esc(widgetMoney(v, look.short))}</b></div>`).join('')}</div></div>`;
  }

  function renderWidget(status) {
    const el = $('#widget-card');
    if (!el) return;
    const head = on => `<div class="card-head"><h2>📱 Home Screen widgets</h2>${on === undefined ? '' : `<span class="tag ${on ? 'good' : ''}">${on ? 'On for this phone' : 'Off'}</span>`}</div>`;
    const what = `<p class="small" style="margin-top:0"><strong>Small:</strong> this month’s everyday budget left (pay put into the Everyday Account, minus what was spent from it). <strong>Medium:</strong> this month’s income, expenses and what’s left. The numbers come from the server each time the widget refreshes, so they include the other person’s new entries.</p>`;
    if (!window.__PWA__) {
      el.innerHTML = head() + what + '<p class="small">Set them up <strong>on each iPhone</strong>: open the <strong>ZR &amp; YC</strong> app from the Home Screen ▸ Me ▸ Settings ▸ Home Screen widgets.</p>';
      return;
    }
    if (!status) {
      el.innerHTML = head() + '<p class="muted">Checking…</p>';
      call('widgetStatus').then(renderWidget).catch(err => { el.innerHTML = head() + `<p class="flag">${esc(errText(err))}</p>`; });
      return;
    }
    widgetState.status = status;
    if (!status.on) {
      el.innerHTML = head(false) + what + `<p class="muted small">Anyone who sees your Home Screen sees these numbers.</p>
        <button class="btn primary" data-act="widget-on" style="margin-top:6px">📱 Turn on for this phone</button>`;
      return;
    }
    loadWidgetScript();
    const size = widgetState.size;
    const look = status[size];
    const picture = status.pics[size];
    const seen = status.seen && status.seen[size];
    const pressed = (a, b) => `aria-pressed="${a === b}"`;
    const seg = (act, options, value) => `<div class="seg">${options.map(([v, label]) => `<button type="button" data-act="${act}" data-key="${esc(v)}" ${pressed(v, value)}>${esc(label)}</button>`).join('')}</div>`;
    const people = [['All', 'Both of us']].concat(state.M.codes.map(c => [c, pName(c)]));
    const swatches = [['', look.who === 'All' ? '#F2B705' : pColour(look.who), 'Their own colour']].concat(WIDGET_COLOURS.map(c => [c, c, c]));
    el.innerHTML = head(true) + what + `
      ${seg('widget-size', [['s', 'Small · budget'], ['m', 'Medium · this month']], size)}
      <div class="wstage">${widgetPreview(size, look, picture)}<span class="muted small">Preview${seen ? ' · last refreshed on the Home Screen ' + new Date(seen).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : ''}</span></div>
      <div class="field"><span>Numbers for</span>${seg('widget-who', people, look.who)}</div>
      <div class="field" style="margin-top:10px"><span>Background</span>${seg('widget-back', WIDGET_BACKS, look.back)}</div>
      ${look.back === 'picture' ? `<div class="row" style="margin-top:8px"><button class="btn" data-act="widget-pick">🖼️ ${picture ? 'Change picture' : 'Choose a picture'}</button>${picture ? '<button class="btn link danger" data-act="widget-pic-clear">Remove</button>' : ''}</div>` : ''}
      <div class="field" style="margin-top:10px"><span>Colour${look.back === 'colour' ? '' : ' (bar and ring)'}</span><div class="wswatches">${swatches.map(([v, c, label]) => `<button type="button" data-act="widget-color" data-key="${esc(v)}" aria-label="${esc(label)}" aria-pressed="${look.color === v}" style="background:${esc(c)}">${v ? '' : '★'}</button>`).join('')}</div></div>
      <label class="spread" style="margin-top:12px"><span>Short amounts ($4.7k)</span><input type="checkbox" data-change="widget-short"${look.short ? ' checked' : ''}></label>
      <h3 style="margin-top:16px">Put it on your iPhone (once)</h3>
      <ol class="small wsteps">
        <li>Get the free app <a href="${SCRIPTABLE_APP}" target="_blank" rel="noopener">Scriptable</a> from the App Store.</li>
        <li>Tap <strong>Copy script</strong> below.</li>
        <li>Open Scriptable, tap <strong>＋</strong>, paste, tap the title and name it <strong>ZR &amp; YC</strong>, then <strong>Done</strong>.</li>
        <li>Touch and hold your Home Screen ▸ <strong>Edit ▸ Add Widget</strong> ▸ <strong>Scriptable</strong>. Pick the small or medium size ▸ <strong>Add Widget</strong>.</li>
        <li>Touch and hold the new widget ▸ <strong>Edit Widget</strong> ▸ <strong>Script</strong>: <strong>ZR &amp; YC</strong>. Add both sizes if you like.</li></ol>
      <button class="btn primary" data-act="widget-copy" style="width:100%">📋 Copy script</button>
      <textarea id="widget-script" class="sr" readonly aria-hidden="true" tabindex="-1"></textarea>
      <p class="muted small">Changes here reach the widget at its next refresh, and the script updates itself from the website (it checks every few hours), so you only copy it once. iPhone decides when widgets refresh (usually every 5–15 minutes); opening the widget’s script in Scriptable refreshes it straight away. To show someone else’s numbers on one widget, type <strong>ZR</strong>, <strong>YC</strong> or <strong>Both</strong> under <strong>Parameter</strong> in Edit Widget. Tapping a widget opens it in Scriptable with the latest numbers.</p>
      <p class="muted small" style="margin-bottom:0">🔒 The script holds a key that can only read these totals, never your entries. Keep it to yourself; <button class="btn link danger" data-act="widget-off" style="padding:0;min-height:0">turn widgets off</button> to stop it working.</p>`;
  }

  /** Saves one widget's look; the card shows it straight away. */
  function widgetSaveLook(change) {
    const st = widgetState.status;
    const size = widgetState.size;
    st[size] = Object.assign({}, st[size], change);
    renderWidget(st);
    const seq = ++widgetState.seq; // quick taps: only the last answer is shown
    call('widgetSave', size, st[size]).then(fresh => { if (seq === widgetState.seq) { fresh.pics = fresh.pics || widgetState.status.pics; renderWidget(fresh); } })
      .catch(err => { toast(errText(err), true); renderWidget(null); });
  }

  // A chosen photo, cut to the widget's shape and shrunk until it fits one Sheet cell.
  function widgetPicture(file, size) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const [bw, bh] = size === 's' ? [1, 1] : [364, 170];
        const iw = img.naturalWidth;
        const ih = img.naturalHeight;
        const zoom = Math.max(bw / iw, bh / ih);
        const cw = bw / zoom;
        const ch = bh / zoom;
        const cv = document.createElement('canvas');
        for (let side = size === 's' ? 510 : 1092; side >= 240; side = Math.round(side * 0.8)) {
          cv.width = side;
          cv.height = Math.round(side * bh / bw);
          cv.getContext('2d').drawImage(img, (iw - cw) / 2, (ih - ch) / 2, cw, ch, 0, 0, cv.width, cv.height);
          for (let q = 0.8; q >= 0.4; q -= 0.1) {
            const url = cv.toDataURL('image/jpeg', q);
            if ((url.length - 23) * 0.75 <= WIDGET_PIC_BYTES) { resolve(url); return; }
          }
        }
        reject(new Error('That picture is too big. Try another one.'));
      };
      img.onerror = () => reject(new Error('That picture couldn’t be opened. Try another one.'));
      const reader = new FileReader(); // a data: link, not blob:, so it works everywhere
      reader.onload = () => { img.src = reader.result; };
      reader.onerror = () => reject(new Error('That picture couldn’t be opened. Try another one.'));
      reader.readAsDataURL(file);
    });
  }

  // One file input for the whole app, outside the page. Choosing a photo sends the app to the background and the page
  // may be redrawn meanwhile; an input that was redrawn away would never report the photo.
  const widgetFile = Object.assign(document.createElement('input'), { type: 'file', accept: 'image/*', id: 'widget-file' });
  widgetFile.style.cssText = 'position:fixed;left:-100px;top:0;width:1px;height:1px;opacity:0';
  document.body.appendChild(widgetFile);
  let widgetFileFor = 's';
  widgetFile.addEventListener('change', async () => {
    const file = widgetFile.files[0];
    widgetFile.value = ''; // the same photo again still counts as a choice
    if (!file) return;
    const size = widgetFileFor;
    try {
      const url = await widgetPicture(file, size);
      toast('Saving picture…');
      const st = await call('widgetPicture', size, url);
      renderWidget(st);
      toast('✓ Picture saved');
    } catch (err) {
      toast(errText(err), true);
    }
  });

  function widgetCopy() {
    const st = widgetState.status;
    if (!widgetState.script) { loadWidgetScript(); toast('Still loading the script. Tap again in a moment.'); return; }
    const text = widgetState.script.replace('__WIDGET_CODE__', 'ZRW1|' + window.__API__ + '|' + st.token);
    const fallback = () => { // select it so iOS offers Copy
      const ta = $('#widget-script');
      ta.value = text;
      ta.className = '';
      ta.style.cssText = 'width:100%;height:120px;font:12px ui-monospace,monospace;margin-top:8px';
      ta.removeAttribute('aria-hidden');
      ta.focus();
      ta.select();
      toast('Couldn’t copy by itself: tap and hold the text, then Copy.', true);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => toast('✓ Script copied. Now paste it in Scriptable.'), fallback);
    else fallback();
  }

  function updateAllocTotals() {
    const el = $('#alloc-totals');
    if (!el) return;
    el.innerHTML = readGrid('g-alloc').map(r => {
      const total = sumOf(Object.keys(r).filter(k => k !== 'from'), k => Number(r[k]) || 0);
      const ok = Math.abs(total - 1) < 0.00005;
      return `<span class="tag ${ok ? 'good' : 'bad'}">${esc(r.from || '(no date)')}: ${pctf(total, 2)}${ok ? ' ✓' : ' — must be 100%'}</span>`;
    }).join(' ');
  }

  function nextFy(fy) {
    const y = +fy.slice(2, 6) + 1;
    return 'FY' + y + '-' + String((y + 1) % 100).padStart(2, '0');
  }

  function renderTaxTables() {
    const el = $('#tax-tables');
    if (!el) return;
    const S = state.app.data.settings;
    const fy = state.taxFy;
    const fys = Array.from(new Set(S.taxYears.map(t => E.normFy(t.fy)).concat(S.withholding.map(w => E.normFy(w.fy))).concat([fy]))).sort().reverse();
    el.innerHTML = `
      <div class="card-head"><h2>🧾 Tax tables</h2>
        <select class="pill-select" data-change="tax-fy" aria-label="Financial year">${fys.map(f => `<option value="${esc(f)}"${f === fy ? ' selected' : ''}>${esc(fyName(f))}</option>`).join('')}</select></div>
      <h3>Rates per financial year</h3>
      ${grid('g-taxyears', [
        { key: 'fy', label: 'Year' }, { key: 'superRate', label: 'Super %', type: 'pct' },
        { key: 'litoMax', label: 'LITO max $', type: 'number' }, { key: 'litoT1', label: 'LITO taper 1 from $', type: 'number' },
        { key: 'litoR1', label: 'Taper 1 %', type: 'pct' }, { key: 'litoT2', label: 'LITO taper 2 from $', type: 'number' },
        { key: 'litoR2', label: 'Taper 2 %', type: 'pct' }, { key: 'medicareRate', label: 'Medicare %', type: 'pct' },
        { key: 'medicareThreshold', label: 'Medicare threshold $', type: 'number' }, { key: 'medicareShade', label: 'Shade-in %', type: 'pct' },
        { key: 'note', label: 'Notes' }], S.taxYears.map(t => Object.assign({}, t, { fy: fyName(E.normFy(t.fy)) })), 'Add year')}
      <h3 style="margin-top:16px">Income tax brackets · ${esc(fyName(fy))}</h3>
      ${grid('g-brackets', [{ key: 'residency', label: 'Residency', type: 'select', options: RESIDENCIES },
        { key: 'over', label: 'Taxable income over $', type: 'number' }, { key: 'rate', label: 'Rate %', type: 'pct' }],
        S.brackets.filter(b => sameFy(b.fy, fy)), 'Add bracket')}
      <h3 style="margin-top:16px">Weekly withholding coefficients (ATO Schedule 1) · ${esc(fyName(fy))}</h3>
      <p class="muted small">y = a × x − b, where x is weekly earnings in whole dollars + 99 cents. Leave "less than" empty on the last row of each scale.</p>
      ${grid('g-withholding', [{ key: 'scale', label: 'Scale', type: 'select', options: SCALES.slice(1) },
        { key: 'lessThan', label: 'Weekly earnings less than $', type: 'number' }, { key: 'a', label: 'a', type: 'number' },
        { key: 'b', label: 'b', type: 'number' }, { key: 'note', label: 'Notes' }],
        S.withholding.filter(w => sameFy(w.fy, fy)), 'Add coefficient row')}
      <div class="spread" style="margin-top:10px"><span class="muted small">Brackets and coefficients shown are for ${esc(fyName(fy))} only; other years are kept as they are.</span>
        <button class="btn primary" data-act="save-tax">Save tax tables</button></div>
      <div class="receipt" style="margin-top:16px"><strong>🗓️ Start a new financial year</strong>
        <div class="row"><span>Copy ${esc(fyName(fy))} to</span><input id="copy-fy" value="${esc(fyName(nextFy(fy)))}" style="width:140px" aria-label="New financial year">
          <button class="btn" data-act="copy-fy">Copy</button></div>
        <span class="muted small">Then edit the copied rates to the new ATO figures and save.</span></div>`;
  }

  // ---------- CSV import ----------

  const IMPORT_FIELDS = {
    income: [['date', 'Pay date', true], ['person', 'Person', true], ['days', 'Days worked'], ['hoursPerDay', 'Hours per day'],
      ['extraHours', 'Extra hours'], ['totalHours', 'Total hours (if no days column)'], ['gross', 'Gross pay (if no hours)'],
      ['rate', 'Hourly rate'], ['actualTax', 'Tax withheld (payslip)'], ['note', 'Note']],
    expenses: [['date', 'Date', true], ['person', 'Person', true], ['amount', 'Amount', true], ['category', 'Category', true],
      ['description', 'Description'], ['splitPct', 'Shared split % (1st person)']],
    adjustments: [['date', 'Date', true], ['person', 'Person', true], ['fromFund', 'From fund'], ['toFund', 'To fund'],
      ['amount', 'Amount', true], ['note', 'Note']],
  };
  const GUESS = {
    date: ['date', 'paydate', 'weekdate', 'week', 'day'], person: ['person', 'name', 'who', 'paidby'],
    days: ['days', 'daysworked'], hoursPerDay: ['hoursperday', 'hrsday', 'hrsperday'], extraHours: ['extrahours', 'extra', 'overtime', 'ot'],
    totalHours: ['hours', 'totalhours', 'hrs'], gross: ['gross', 'grossincome', 'grosspay', 'income', 'salary'], rate: ['rate', 'hourlyrate', 'payrate'],
    actualTax: ['tax', 'taxwithheld', 'payg', 'withheld'], note: ['note', 'notes', 'remark', 'remarks'],
    amount: ['amount', 'cost', 'price', 'total', 'aud'], category: ['category', 'type'], description: ['description', 'desc', 'item', 'details', 'detail'],
    splitPct: ['split', 'splitpct', 'share'], fromFund: ['fromfund', 'from'], toFund: ['tofund', 'to'],
  };

  function parseCSV(text) {
    text = String(text || '').replace(/^﻿/, '');
    const rows = [];
    let row = [];
    let field = '';
    let quoted = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (quoted) {
        if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
        else if (ch === '"') quoted = false;
        else field += ch;
      } else if (ch === '"') quoted = true;
      else if (ch === ',') { row.push(field); field = ''; }
      else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && text[i + 1] === '\n') i++;
        row.push(field); rows.push(row); row = []; field = '';
      } else field += ch;
    }
    if (field !== '' || row.length) { row.push(field); rows.push(row); }
    return rows.filter(r => r.some(c => c.trim() !== ''));
  }

  function parseDateText(s) {
    s = String(s || '').trim();
    const two = n => String(n).padStart(2, '0');
    let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (m) return m[1] + '-' + two(m[2]) + '-' + two(m[3]);
    m = s.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})$/);
    if (m) return (m[3].length === 2 ? '20' + m[3] : m[3]) + '-' + two(m[2]) + '-' + two(m[1]);
    m = s.match(/^(\d{1,2})[\s\-]+([A-Za-z]{3})[A-Za-z]*\.?,?[\s\-]+(\d{4})$/);
    if (m) {
      const mi = MONTHS.findIndex(x => x.toLowerCase() === m[2].toLowerCase());
      if (mi >= 0) return m[3] + '-' + two(mi + 1) + '-' + two(m[1]);
    }
    return '';
  }

  const moneyText = s => {
    const t = String(s || '').replace(/[$,\s]|RM|AUD/gi, '');
    const negative = /^\(.*\)$/.test(t);
    return t === '' ? '' : (negative ? '-' : '') + t.replace(/[()]/g, '');
  };

  function importRecord(kind, row, map) {
    const get = key => {
      const m = map[key];
      if (!m) return '';
      if (m.charAt(0) === '=') return m.slice(1);
      return String(row[+m] === undefined ? '' : row[+m]).trim();
    };
    const rec = {};
    IMPORT_FIELDS[kind].forEach(([k]) => { rec[k] = get(k); });
    rec.date = parseDateText(rec.date);
    rec.person = personByText(rec.person);
    ['amount', 'actualTax', 'rate', 'gross'].forEach(k => { if (k in rec) rec[k] = moneyText(rec[k]); });
    if (kind === 'income') {
      const p = personOf(rec.person);
      if (rec.days === '' && rec.totalHours !== '') {
        rec.days = 0;
        rec.extraHours = rec.totalHours;
      } else if (rec.days === '' && rec.gross !== '') {
        const rate = Number(rec.rate) || (p ? p.rate : 0);
        if (rate) { rec.rate = rate; rec.days = 0; rec.extraHours = +(Number(rec.gross) / rate).toFixed(4); }
      }
      if (rec.rate === '' && p) rec.rate = p.rate;
      if (rec.hoursPerDay === '' && p) rec.hoursPerDay = p.hoursPerDay;
      delete rec.totalHours;
      delete rec.gross;
    }
    if (kind === 'expenses' && rec.splitPct !== '') {
      const n = Number(String(rec.splitPct).replace('%', ''));
      rec.splitPct = n > 1 ? n / 100 : n;
    }
    return rec;
  }

  function guessMap(kind, headers) {
    const norm = h => String(h).toLowerCase().replace(/[^a-z]/g, '');
    const map = {};
    IMPORT_FIELDS[kind].forEach(([k]) => {
      const i = headers.findIndex(h => (GUESS[k] || []).indexOf(norm(h)) >= 0);
      if (i >= 0 && Object.keys(map).every(x => map[x] !== String(i))) map[k] = String(i);
    });
    return map;
  }

  function renderImporter() {
    const el = $('#importer');
    if (!el) return;
    const I = state.importer;
    const kinds = Object.keys(IMPORT_FIELDS);
    let mapping = '';
    let preview = '';
    if (I.headers.length) {
      const colOpts = I.headers.map((h, i) => [String(i), 'Column: ' + (h || '(' + (i + 1) + ')')]);
      mapping = IMPORT_FIELDS[I.kind].map(([k, label, req]) => {
        const fixed = k === 'person' ? state.M.codes.concat(I.kind === 'expenses' ? ['Shared'] : []).map(c => ['=' + c, 'Always ' + c]) : [];
        const opts = [['', '— not in file —']].concat(colOpts, fixed);
        return `<label class="field"><span>${esc(label)}${req ? ' *' : ''}</span><select data-change="imp-map" data-key="${k}">${opts.map(([v, t]) => `<option value="${esc(v)}"${(I.map[k] || '') === v ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select></label>`;
      }).join('');
      const recs = I.rows.slice(0, 6).map(r => importRecord(I.kind, r, I.map));
      const fields = IMPORT_FIELDS[I.kind].map(f => f[0]).filter(k => k !== 'totalHours' && k !== 'gross');
      let extra = '';
      if (I.kind === 'income') {
        const calc = E.compute({ settings: state.app.data.settings, income: recs.map((r, i) => Object.assign({ id: 'p' + i }, r)) }).income;
        extra = '<th class="num">→ Gross</th><th class="num">→ Tax</th><th class="num">→ Net</th>';
        recs.forEach((r, i) => { r._calc = calc.find(c => c.id === 'p' + i); });
      }
      preview = `<h3 style="margin-top:12px">Preview (first ${recs.length} of ${I.rows.length} rows)</h3>` + table(
        `<tr>${fields.map(f => `<th>${esc(f)}</th>`).join('')}${extra}</tr>`,
        recs.map(r => `<tr>${fields.map(f => `<td>${esc(r[f])}</td>`).join('')}${r._calc ? `<td class="num">${money(r._calc.gross)}</td><td class="num">${money(r._calc.tax)}</td><td class="num">${money(r._calc.net)}</td>` : I.kind === 'income' ? '<td colspan="3" class="flag">check date / person</td>' : ''}</tr>`).join(''));
    }
    el.innerHTML = `
      <div class="card-head"><h2>📥 Import from CSV</h2></div>
      <p class="muted small">In your old Google Sheet: File ▸ Download ▸ Comma-separated values (.csv) for one tab, then load it here. Dates can be 4/6/2026, 2026-06-04 or 4 Jun 2026. Net pay is always recalculated as gross − tax.</p>
      <div class="form">
        <div class="two">
          <label class="field"><span>Import as</span><select data-change="imp-kind">${kinds.map(k => `<option value="${k}"${k === I.kind ? ' selected' : ''}>${KIND_LABEL[k]} entries</option>`).join('')}</select></label>
          <label class="field"><span>CSV file</span><input type="file" accept=".csv,text/csv" data-change="imp-file"></label>
        </div>
        <details class="opt"><summary>…or paste CSV text</summary><textarea id="imp-text" rows="5" style="width:100%;margin-top:6px"></textarea>
          <button class="btn" data-act="imp-read" style="margin-top:6px">Read pasted text</button></details>
        ${I.headers.length ? `<div class="three">${mapping}</div>${preview}
          <div class="spread"><span class="muted small">${I.rows.length} rows. Nothing is saved if any row has a problem.</span>
          <button class="btn primary" data-act="imp-go">Import ${I.rows.length} rows</button></div>` : ''}
      </div>`;
  }

  function loadImportText(text) {
    const rows = parseCSV(text);
    if (rows.length < 2) { toast('The CSV needs a header row and at least one data row.', true); return; }
    const I = state.importer;
    I.headers = rows[0].map(h => h.trim());
    I.rows = rows.slice(1);
    I.map = guessMap(I.kind, I.headers);
    renderImporter();
  }

  // ======================================================================
  // Add / edit sheet
  // ======================================================================

  function newRecord(kind, keep) {
    const M = state.M;
    const who = (keep && keep.person) || (state.person !== 'All' ? state.person : store.get('lastPerson') || M.codes[0]);
    const code = M.codes.indexOf(who) >= 0 ? who : M.codes[0];
    const p = personOf(code) || {};
    const date = (keep && keep.date) || M.today;
    if (kind === 'income') return { date, person: code, days: '', hoursPerDay: p.hoursPerDay, extraHours: '', rate: p.rate, scale: '', actualTax: '', note: '' };
    if (kind === 'expenses') {
      const cat = (keep && keep.category) || store.get('lastCategory');
      const person = who === 'Shared' || M.codes.indexOf(who) >= 0 ? who : code;
      return { date, person, paidBy: person === 'Shared' ? code : person, amount: '', category: M.categories.some(c => c.name === cat) ? cat : (M.categories[0] || {}).name, description: '', splitPct: '' };
    }
    if (kind === 'paybacks') {
      return { date, from: code, to: M.codes.find(c => c !== code) || code, amount: '', note: '' };
    }
    if (kind === 'wallets') {
      return { date, name: '', currency: (keep && keep.currency) || 'AUD', type: '', owner: M.viewer, number: '', opening: '', colour: WALLET_COLOUR, badge: '', logo: '', note: '', closed: '' };
    }
    if (kind === 'walletChecks') return { date, walletId: keep.walletId, amount: '', note: '', fund: fundsIn(wOf(keep.walletId).linked)[0] || '' };
    if (kind === 'walletTransfers') {
      const open = M.wallets.filter(w => !w.closed);
      const from = open.find(w => w.id === (keep && keep.fromId)) || open.find(w => w.currency === 'AUD') || open[0];
      const to = open.find(w => w !== from && w.currency !== from.currency) || open.find(w => w !== from);
      return transferFunds({ date, fromId: from.id, toId: to.id, amount: '', fee: '', feeIn: '', rate: M.general.exchangeRate, received: '', note: '', person: M.viewer, fromFund: '', toFund: '' });
    }
    if (kind === 'interest') {
      const acct = interestAccounts().indexOf('Self Saving') >= 0 ? 'Self Saving' : interestAccounts()[0] || M.accounts[0];
      return { date, person: code, fund: fundsIn(acct)[0] || M.fundNames[0], amount: '', note: '' };
    }
    return { date, person: code, fromFund: M.fundNames[0], toFund: M.fundNames[1] || '', amount: '', note: '' };
  }

  /** A new entry ID made here, so the app can show the entry before the server has saved it. */
  const newId = kind => kind.charAt(0).toUpperCase() + '-' + Array.from({ length: 12 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

  /** Typing the minus sign the keypad uses (−), so "-5" can be edited as "−5". */
  const exprOf = v => (blank(v) ? '' : String(v).replace('-', '−'));

  function openForm(kind, rec, opts) {
    const isNew = !rec;
    rec = Object.assign({}, rec || newRecord(kind));
    if (kind === 'expenses') rec.splitPct = blank(rec.splitPct) ? '' : +(E.pct(rec.splitPct) * 100).toFixed(2);
    let adjType = null;
    if (kind === 'adjustments') {
      const fa = (fundOf(rec.fromFund) || {}).account;
      const ta = (fundOf(rec.toFund) || {}).account;
      adjType = rec.fromFund && rec.toFund ? (fa && ta && fa !== ta ? 'Account' : 'Transfer') : rec.toFund ? 'Add' : 'Deduct';
      rec.fromAccount = fa || state.M.accounts[0];
      rec.toAccount = ta || state.M.accounts[1] || state.M.accounts[0];
    }
    if (kind === 'interest') rec.account = (fundOf(rec.fund) || {}).account || interestAccounts()[0];
    // Income is either wages (days × hours) or other income (an amount).
    let payType = null;
    if (kind === 'income') {
      payType = (opts && opts.payType) || (!(Number(rec.days) || Number(rec.extraHours)) && !blank(rec.otherNet) && Number(rec.otherNet) !== 0 ? 'other' : 'wages');
      if (payType === 'other') rec.amount = blank(rec.otherNet) ? '' : rec.otherNet;
    }
    const myrSaved = rec.currency === 'MYR';
    state.form = {
      kind, rec, payType,
      isNew: opts && opts.isNew !== undefined ? opts.isNew : isNew,
      adjType: (opts && opts.adjType) || adjType,
      calc: {
        cur: myrSaved ? 'MYR' : 'AUD',
        rate: myrSaved && rec.fxRate ? rec.fxRate : state.M.general.exchangeRate,
        expr: myrSaved ? exprOf(rec.fxAmount) : exprOf(rec.amount),
        fixed: ((kind === 'walletChecks' && wOf(rec.walletId)) || (kind === 'walletTransfers' && wOf(rec.fromId)) || {}).currency || '', // keypad shows this account's currency
      },
    };
    renderForm();
    $('#modal').hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    state.form = null;
    $('#modal').hidden = true;
    $('#modal').innerHTML = '';
    document.body.style.overflow = '';
    if (state.stale) renderKeepingPlace(); // changes that arrived while the form was open
  }

  function editEntry(kind, id) {
    // A transfer's fee expense and fund adjustment are changed through the transfer.
    const parent = /^[AE]-wt-(.+)$/.exec(String(id));
    if (parent) { kind = 'walletTransfers'; id = parent[1]; }
    const rec = (state.app.data[kind] || []).find(r => String(r.id) === String(id));
    if (kind === 'walletTransfers' && (!rec || !wOf(rec.fromId) || !wOf(rec.toId))) { toast('This is part of a private wallet transfer.', true); return; }
    if (rec) openForm(kind, rec);
  }

  const who = (value, options, act) => `<div class="who" role="group">${options.map(([code, label]) =>
    `<button type="button" data-act="${act || 'form-person'}" data-key="${esc(code)}" aria-pressed="${String(code) === String(value)}" style="--pc:${pColour(code)}">${avatar(code)}${esc(label)}</button>`).join('')}</div>`;

  const field = (label, name, value, attrs) =>
    `<label class="field"><span>${label}</span><input name="${name}" value="${esc(value)}" ${attrs || ''}></label>`;

  const stepper = (label, name, value, step, attrs) =>
    `<div class="field"><span>${label}</span><div class="stepper"><button type="button" data-act="form-step" data-key="${name}" data-step="-${step}" aria-label="Less">−</button>
      <input name="${name}" value="${esc(value)}" type="number" inputmode="decimal" step="${step}" ${attrs || ''}><button type="button" data-act="form-step" data-key="${name}" data-step="${step}" aria-label="More">+</button></div></div>`;

  /** Any fund, grouped by bank account, with a first "default" choice. */
  const fundSelect = (name, value, defaultLabel) => `<select name="${name}"><option value="">${esc(defaultLabel)}</option>${state.M.accounts.map(a =>
    `<optgroup label="${esc(aIcon(a))} ${esc(a)}">${fundsIn(a).map(f => `<option value="${esc(f)}"${f === value ? ' selected' : ''}>${esc(fIcon(f))} ${esc(f)}</option>`).join('')}</optgroup>`).join('')}</select>`;

  /** The funds in one bank account. */
  const accountFunds = (name, value, account) => `<select name="${name}">${fundsIn(account).map(f => `<option value="${esc(f)}"${f === value ? ' selected' : ''}>${esc(fIcon(f))} ${esc(f)}</option>`).join('')}</select>`;

  /** Keeps a transfer's funds inside the accounts it uses. */
  function transferFunds(r) {
    const from = wOf(r.fromId);
    const to = wOf(r.toId);
    if (from.linked && fundsIn(from.linked).indexOf(r.fromFund) < 0) r.fromFund = fundsIn(from.linked)[0] || '';
    r.toFund = !to.linked ? '' : fundsIn(to.linked).indexOf(r.toFund) >= 0 ? r.toFund : fundsIn(to.linked)[0] || '';
    return r;
  }

  // ---------- calculator keypad ----------

  const CALC_OPS = '+−×÷';

  /** Works out "12.5+8×2" (× and ÷ before + and −). Returns NaN for things like ÷ 0. */
  function calcValue(expr) {
    const tokens = [];
    let num = '';
    String(expr || '').split('').forEach(ch => {
      if ('0123456789.'.indexOf(ch) >= 0) num += ch;
      else if (CALC_OPS.indexOf(ch) >= 0) {
        if (num) tokens.push(num);
        num = '';
        tokens.push(ch);
      }
    });
    if (num) tokens.push(num);
    while (tokens.length && CALC_OPS.indexOf(tokens[tokens.length - 1]) >= 0) tokens.pop();
    const nums = [];
    const ops = [];
    let sign = 1;
    let wantNum = true;
    tokens.forEach(t => {
      if (CALC_OPS.indexOf(t) >= 0) {
        if (wantNum) { if (t === '−') sign = -sign; return; }
        ops.push(t);
        wantNum = true;
      } else {
        nums.push(sign * parseFloat(t));
        sign = 1;
        wantNum = false;
      }
    });
    if (!nums.length) return 0;
    const terms = [nums[0]];
    const adds = [];
    ops.forEach((op, i) => {
      const b = nums[i + 1];
      if (b === undefined) return;
      if (op === '×') terms[terms.length - 1] *= b;
      else if (op === '÷') terms[terms.length - 1] = b === 0 ? NaN : terms[terms.length - 1] / b;
      else { adds.push(op); terms.push(b); }
    });
    let v = terms[0];
    adds.forEach((op, i) => { v = op === '+' ? v + terms[i + 1] : v - terms[i + 1]; });
    return isFinite(v) ? Math.round(v * 100) / 100 : NaN;
  }

  /** Calculator keypad for amounts. With `withCurrency`, the amount can be typed in MYR at an editable rate. */
  function keypad(withCurrency) {
    const F = state.form;
    const c = F.calc;
    F.calcCurrency = !!withCurrency;
    const myrMode = withCurrency && c.cur === 'MYR';
    const keys = ['7', '8', '9', '÷', '4', '5', '6', '×', '1', '2', '3', '−', '.', '0', '⌫', '+'];
    return `<div class="calc">
      <input type="hidden" name="amount" value="${esc(F.rec.amount)}">
      ${withCurrency ? '<input type="hidden" name="currency" value=""><input type="hidden" name="fxAmount" value=""><input type="hidden" name="fxRate" value="">' : ''}
      <div class="calc-screen">
        <div class="spread">${withCurrency ? `<div class="mini-tabs" role="group" aria-label="Currency">${['AUD', 'MYR'].map(k =>
          `<button type="button" data-act="calc-cur" data-key="${k}" aria-pressed="${c.cur === k}">${k}</button>`).join('')}</div>` : `<span class="muted small">${c.fixed || 'AUD'}</span>`}
          <span class="calc-expr" id="calc-expr">&nbsp;</span></div>
        <div class="calc-value" id="calc-value" aria-live="polite"></div>
        ${myrMode ? `<div class="calc-rate"><span>= <strong id="calc-aud"></strong></span>
          <label>1 AUD = <input id="calc-rate" type="number" inputmode="decimal" step="0.0001" min="0" value="${esc(c.rate)}" aria-label="MYR per AUD"> MYR</label></div>` : ''}
      </div>
      <div class="calc-keys">${keys.map(k => `<button type="button" data-act="calc" data-key="${k}"${'0123456789.'.indexOf(k) >= 0 ? '' : ' class="op"'} aria-label="${k === '⌫' ? 'Delete' : k}">${k}</button>`).join('')}
        <button type="button" data-act="calc" data-key="C" class="op wide" aria-label="Clear">C</button><button type="button" data-act="calc" data-key="=" class="eq wide">=</button></div>
    </div>`;
  }

  /** After a key: update the hidden fields, the display and the preview (without redrawing the form). */
  function calcSync() {
    const F = state.form;
    const c = F.calc;
    const v = calcValue(c.expr);
    const myrMode = F.calcCurrency && c.cur === 'MYR';
    const rate = Number(c.rate) || state.M.general.exchangeRate || 1;
    const aud = isFinite(v) ? (myrMode ? E.round2(v / rate) : v) : NaN;
    F.rec.amount = c.expr === '' || !isFinite(aud) ? '' : aud;
    if (F.calcCurrency) {
      F.rec.currency = myrMode ? 'MYR' : '';
      F.rec.fxAmount = myrMode && isFinite(v) ? v : '';
      F.rec.fxRate = myrMode ? rate : '';
    }
    ['amount', 'currency', 'fxAmount', 'fxRate'].forEach(name => {
      const el = $('#entry-form [name="' + name + '"]');
      if (el) el.value = blank(F.rec[name]) ? '' : F.rec[name];
    });
    const ex = $('#calc-expr');
    if (ex) ex.textContent = /[+−×÷]/.test(c.expr.replace(/^−/, '')) ? c.expr : ' ';
    const val = $('#calc-value');
    if (val) {
      val.textContent = !isFinite(v) ? 'Can’t divide by 0' : myrMode || c.fixed === 'MYR' ? myr(v) : money(v);
      val.classList.toggle('neg', !isFinite(v) || v < 0);
    }
    const audEl = $('#calc-aud');
    if (audEl) audEl.textContent = isFinite(aud) ? money(aud) : '—';
    updatePreview();
  }

  function calcKey(k) {
    const c = state.form.calc;
    let e = c.expr;
    const last = e.split(/[+−×÷]/).pop();
    if (k === 'C') e = '';
    else if (k === '⌫') e = e.slice(0, -1);
    else if (k === '=') {
      const v = calcValue(e);
      if (e && isFinite(v)) e = exprOf(v);
    } else if (CALC_OPS.indexOf(k) >= 0) {
      if (!e) { if (k === '−') e = '−'; }
      else if (CALC_OPS.indexOf(e.slice(-1)) >= 0) e = e.length > 1 ? e.slice(0, -1) + k : (k === '−' ? '−' : '');
      else e += k;
    } else if (k === '.') {
      if (last.indexOf('.') < 0) e += last === '' ? '0.' : '.';
    } else {
      if (/\.\d\d$/.test(last)) return; // two decimals at most
      e = last === '0' ? e.slice(0, -1) + k : e + k;
    }
    if (e.length > 40) return;
    c.expr = e;
    calcSync();
  }

  function renderForm() {
    const M = state.M;
    const F = state.form;
    const r = F.rec;
    const people = M.codes.map(c => [c, pName(c)]);
    let body = '';
    F.calcCurrency = false;
    if (F.kind === 'income') {
      const p = personOf(r.person) || {};
      const typeSeg = F.isNew ? `<div class="seg" role="group" aria-label="Income type">${[['wages', '💼 Wages'], ['other', '💰 Other income']].map(([k, l]) =>
        `<button type="button" data-act="form-paytype" data-key="${k}" aria-pressed="${F.payType === k}">${l}</button>`).join('')}</div>` : '';
      if (F.payType === 'other') {
        const taxable = r.otherTaxable === 'Yes' ? 'Yes' : '';
        body = typeSeg + `
        ${keypad(true)}
        <div class="field"><span>Who received it?</span>${who(r.person, people)}</div>
        <label class="field"><span>Put it into</span>${fundSelect('intoFund', r.intoFund, 'Split like pay (budget %)')}</label>
        <div class="field"><span>Counts as taxable income?</span><input type="hidden" name="otherTaxable" value="${taxable}">
          <div class="who" role="group">${[['', 'No · gift, refund, cashback'], ['Yes', 'Yes · side job, cash work']].map(([v, l]) =>
            `<button type="button" data-act="form-taxable" data-key="${v}" aria-pressed="${taxable === v}" style="padding-left:14px">${l}</button>`).join('')}</div></div>
        <div class="two">${field('Date received', 'date', r.date, 'type="date" required')}
          ${field('What is it?', 'note', r.note, 'type="text" placeholder="e.g. tax refund, gift"')}</div>`;
      } else {
        body = typeSeg + `
        <div class="field"><span>Who was paid?</span>${who(r.person, people)}</div>
        <div class="two">${field('Pay date', 'date', r.date, 'type="date" required')}
          ${field('Hourly rate ($)', 'rate', r.rate, 'type="number" step="0.01" min="0" inputmode="decimal"')}</div>
        <div class="three">
          ${stepper('Days worked', 'days', r.days, 1, 'min="0" placeholder="0"')}
          ${stepper('Hours / day', 'hoursPerDay', r.hoursPerDay, 0.5, 'min="0"')}
          ${stepper('Extra hours', 'extraHours', r.extraHours, 0.5, 'placeholder="0"')}</div>
        ${field('Payslip tax (optional)', 'actualTax', r.actualTax, 'type="number" step="0.01" min="0" inputmode="decimal" placeholder="Blank = calculated for you"')}
        <details class="opt"${!blank(r.scale) || r.note ? ' open' : ''}><summary>More options</summary>
          <div class="two" style="margin-top:8px">
            <label class="field"><span>Tax scale</span><select name="scale">${SCALES.map(s => `<option value="${s === 'Auto' ? '' : s}"${String(r.scale || '') === (s === 'Auto' ? '' : s) ? ' selected' : ''}>${s === 'Auto' ? 'Auto (' + esc(SCALE_NAMES[E.scaleFor(p)] || E.scaleFor(p)) + ')' : esc(SCALE_NAMES[s])}</option>`).join('')}</select></label>
            ${field('Note', 'note', r.note, 'type="text"')}</div></details>`;
      }
    } else if (F.kind === 'expenses') {
      const split = blank(r.splitPct) ? Math.round(M.general.sharedSplit * 100) : r.splitPct;
      const catFund = (M.categories.find(c => c.name === r.category) || {}).fund || '';
      body = `
        ${keypad(true)}
        <div class="field"><span>Whose expense?</span>${who(r.person, people.concat([['Shared', 'Shared']]))}</div>
        <div class="field"><span>Who paid?</span><input type="hidden" name="paidBy" value="${esc(r.paidBy || '')}">${who(r.paidBy, people, 'form-paidby')}</div>
        ${r.person === 'Shared' ? `<div class="field"><span>Split: ${esc(pName(M.codes[0]))} <output id="split-out">${split}</output>% · ${esc(pName(M.codes[1]))} <output id="split-out2">${100 - split}</output>%</span>
          <input name="splitPct" type="range" min="0" max="100" step="5" value="${esc(split)}" aria-label="${esc(pName(M.codes[0]))}'s share"></div>` : ''}
        <div class="field"><span>Category</span><input type="hidden" name="category" value="${esc(r.category)}">
          <div class="cat-grid">${M.categories.map(c => `<button type="button" class="cat-chip" data-act="form-cat" data-key="${esc(c.name)}" aria-pressed="${c.name === r.category}" style="--c:${fColour(c.fund)}" title="${esc(c.fund)}"><span class="e">${esc(cIcon(c.name))}</span>${esc(c.name)}</button>`).join('')}</div></div>
        <label class="field"><span>Comes out of</span>${fundSelect('fund', r.fund, `Category’s fund: ${fIcon(catFund)} ${catFund} (${(fundOf(catFund) || {}).account || ''})`)}</label>
        <div class="two">${field('Date', 'date', r.date, 'type="date" required')}
          ${field('Description', 'description', r.description, 'type="text" placeholder="Optional"')}</div>`;
    } else if (F.kind === 'paybacks') {
      body = `
        <div class="field"><span>Who gave the money?</span><input type="hidden" name="from" value="${esc(r.from)}"><input type="hidden" name="to" value="${esc(r.to)}">
          ${who(r.from, people, 'form-from')}<span class="muted small">to <strong>${esc(pName(r.to))}</strong></span></div>
        ${keypad(false)}
        <div class="two">${field('Date', 'date', r.date, 'type="date" required')}
          ${field('Note', 'note', r.note, 'type="text" placeholder="e.g. paid back, cash loan"')}</div>`;
    } else if (F.kind === 'wallets' && !r.type) {
      const types = E.WALLET_TYPES;
      body = `<p class="muted" style="margin:0">What kind of account?</p><div class="wtypes">${Object.keys(types).map(k =>
        `<button type="button" data-act="wallet-type" data-key="${k}">${tile(types[k].emoji, '#64748B')}<span class="wtype-text"><strong>${esc(types[k].label)}</strong><span class="muted small">${esc(types[k].hint)}</span></span><span class="muted">›</span></button>`).join('')}</div>`;
    } else if (F.kind === 'wallets') {
      const t = E.WALLET_TYPES[r.type];
      const saved = wOf(r.id);
      const place = wPlace(r.currency);
      const brands = ['cash', 'lent', 'borrowed'].indexOf(r.type) < 0 ? WALLET_BRANDS[place[0]] : [];
      const link = saved && saved.linked;
      body = `
        ${link || (saved && saved.events.length) ? `<div class="kv"><span class="muted">Country</span><span>${place[2]} ${place[3]} (${place[1]})</span></div>`
          : `<div class="seg" role="group" aria-label="Country">${WALLET_PLACES.map(p => `<button type="button" data-act="wallet-cur" data-key="${p[1]}" aria-pressed="${r.currency === p[1]}">${p[2]} ${p[3]}</button>`).join('')}</div>`}
        ${brands.length ? `<div class="field"><span>Quick pick</span><div class="scroller">${brands.map(([name, colour]) =>
          `<button type="button" class="filter-chip" data-act="wallet-brand" data-key="${esc(name)}" aria-pressed="${wLogo(r) === (brandOf(name) || [])[3]}"><span class="dot" style="--c:${colour}"></span>${esc(name)}</button>`).join('')}</div></div>` : ''}
        ${field('Name', 'name', r.name, 'type="text" maxlength="40" placeholder="e.g. CommBank Everyday"')}
        <input type="hidden" name="owner" value="${esc(r.owner)}">
        ${link ? '' : `<div class="field"><span>Whose account?</span>${who(r.owner, [[M.viewer, pName(M.viewer)], ['Shared', 'Shared']], 'form-owner')}</div>
        <div class="two">${field(`${saved ? 'Starting balance' : t.debt ? 'You owe now' : 'Balance now'} (${r.currency})`, 'opening', r.opening, 'type="number" step="0.01" inputmode="decimal" placeholder="0.00"')}
          ${field('Balance as of', 'date', r.date, 'type="date" required')}</div>`}
        <div class="two">${field('Last 4 digits (optional)', 'number', r.number, 'type="text" inputmode="numeric" maxlength="4"')}
          ${field('Card colour', 'colour', r.colour || WALLET_COLOUR, 'type="color"')}</div>
        <input type="hidden" name="badge" value="${esc(r.badge)}"><input type="hidden" name="logo" value="${esc(r.logo)}">
        ${field('Note', 'note', r.note, 'type="text" placeholder="Optional"')}
        ${saved && !link ? `<label class="field"><span>Status</span><select name="closed"><option value="">Open</option><option value="Yes"${r.closed === 'Yes' ? ' selected' : ''}>Closed (left out of the totals)</option></select></label>` : ''}`;
    } else if (F.kind === 'walletChecks') {
      const w = wOf(r.walletId);
      body = `
        <div class="muted">${wPlace(w.currency)[2]} ${esc(w.name)} · ${w.debt ? 'how much do you owe now?' : 'how much is in it now?'}</div>
        ${keypad(false)}
        ${w.linked ? `<label class="field"><span>Put the difference in fund</span>${accountFunds('fund', r.fund, w.linked)}</label>` : ''}
        <div class="two">${field('Date', 'date', r.date, 'type="date" required')}
          ${field('Note', 'note', r.note, 'type="text" placeholder="Optional"')}</div>`;
    } else if (F.kind === 'walletTransfers') {
      const from = wOf(r.fromId);
      const to = wOf(r.toId);
      const cross = from.currency !== to.currency;
      const pick = (name, value) => `<select name="${name}">${WALLET_PLACES.map(p => {
        const list = M.wallets.filter(w => w.country === p[0] && (!w.closed || w.id === value));
        return list.length ? `<optgroup label="${p[2]} ${p[3]}">${list.map(w => `<option value="${esc(w.id)}"${w.id === value ? ' selected' : ''}>${esc(w.name)}</option>`).join('')}</optgroup>` : '';
      }).join('')}</select>`;
      const feeIn = r.feeIn === 'Yes' ? 'Yes' : '';
      const funds = [from.linked ? `<label class="field"><span>Taken from fund</span>${accountFunds('fromFund', r.fromFund, from.linked)}</label>` : `<label class="field"><span>Fee comes out of</span>${fundSelect('fromFund', r.fromFund, 'Living Expenses')}</label>`,
        to.linked ? `<label class="field"><span>Goes into fund</span>${accountFunds('toFund', r.toFund, to.linked)}</label>` : ''].filter(Boolean);
      body = `
        <div class="wroute"><label class="field"><span>From</span>${pick('fromId', r.fromId)}</label>
          <button type="button" class="icon-btn" data-act="wt-swap" aria-label="Swap From and To">${ico('split', 18)}</button>
          <label class="field"><span>To</span>${pick('toId', r.toId)}</label></div>
        <div class="field"><span>Amount sent</span>${keypad(false)}</div>
        ${cross ? field('Transfer rate: 1 AUD = ? MYR', 'rate', r.rate, 'type="number" step="any" min="0" inputmode="decimal"') : ''}
        <div class="two">${field(`Fee (${from.currency})`, 'fee', r.fee, 'type="number" step="0.01" min="0" inputmode="decimal" placeholder="0.00"')}
          <div class="field"><span>Fee is</span><input type="hidden" name="feeIn" value="${feeIn}"><div class="seg" role="group" aria-label="How the fee is charged">${[['', 'On top'], ['Yes', 'Included']].map(([k, l]) =>
            `<button type="button" data-act="wt-feein" data-key="${k}" aria-pressed="${feeIn === k}">${l}</button>`).join('')}</div></div></div>
        ${cross ? field(`Amount received (${to.currency})`, 'received', r.received, 'type="number" step="0.01" min="0" inputmode="decimal"') : ''}
        <div class="${funds.length > 1 ? 'two' : ''}">${funds.join('')}</div>
        <div class="two">${field('Date', 'date', r.date, 'type="date" required')}
          ${field('Note', 'note', r.note, 'type="text" placeholder="e.g. Wise, sent home"')}</div>`;
    } else if (F.kind === 'interest') {
      const acctOpts = `<select name="account">${interestAccounts().map(a => `<option value="${esc(a)}"${a === r.account ? ' selected' : ''}>${esc(aIcon(a))} ${esc(a)}</option>`).join('')}</select>`;
      const fundOpts = `<select name="fund">${fundsIn(r.account).map(f => `<option value="${esc(f)}"${f === r.fund ? ' selected' : ''}>${esc(fIcon(f))} ${esc(f)}</option>`).join('')}</select>`;
      body = `
        ${keypad(false)}
        <div class="two"><label class="field"><span>Bank account</span>${acctOpts}</label><label class="field"><span>Goes into fund</span>${fundOpts}</label></div>
        <div class="field"><span>Whose interest?</span>${who(r.person, people.concat([['Shared', 'Shared']]))}</div>
        <div class="two">${field('Date paid', 'date', r.date, 'type="date" required')}
          ${field('Note', 'note', r.note, 'type="text" placeholder="e.g. October interest"')}</div>`;
    } else {
      // Fund dropdowns grouped by bank account (or limited to one account).
      const fundOpts = (name, value, account) => `<select name="${name}">${M.accounts.filter(a => !account || a === account).map(a =>
        `<optgroup label="${esc(aIcon(a))} ${esc(a)}">${fundsIn(a).map(f => `<option value="${esc(f)}"${f === value ? ' selected' : ''}>${esc(fIcon(f))} ${esc(f)}</option>`).join('')}</optgroup>`).join('')}</select>`;
      const acctOpts = (name, value) => `<select name="${name}">${M.accounts.map(a => `<option value="${esc(a)}"${a === value ? ' selected' : ''}>${esc(aIcon(a))} ${esc(a)}</option>`).join('')}</select>`;
      const types = [['Account', '🏦', 'Between accounts'], ['Transfer', '🔁', 'Between funds'], ['Add', '➕', 'Add money'], ['Deduct', '➖', 'Take out']];
      const t = F.adjType;
      body = `
        <div class="type-cards">${types.map(([k, e, l]) => `<button type="button" data-act="form-adjtype" data-key="${k}" aria-pressed="${F.adjType === k}"><span class="e">${e}</span>${l}</button>`).join('')}</div>
        <div class="field"><span>Whose funds?</span>${who(r.person, people)}</div>
        ${keypad(false)}
        ${t === 'Account' ? `<div class="two"><label class="field"><span>From account</span>${acctOpts('fromAccount', r.fromAccount)}</label>
          <label class="field"><span>To account</span>${acctOpts('toAccount', r.toAccount)}</label></div>` : ''}
        <div class="two">
          ${t !== 'Add' ? `<label class="field"><span>${t === 'Account' ? 'Taken from fund' : 'From fund'}</span>${fundOpts('fromFund', r.fromFund || M.fundNames[0], t === 'Account' ? r.fromAccount : '')}</label>` : ''}
          ${t !== 'Deduct' ? `<label class="field"><span>${t === 'Account' ? 'Into fund' : t === 'Add' ? 'Add to fund' : 'To fund'}</span>${fundOpts('toFund', r.toFund || M.fundNames[1], t === 'Account' ? r.toAccount : '')}</label>` : ''}</div>
        <div class="two">${field('Date', 'date', r.date, 'type="date" required')}
          ${field('Note', 'note', r.note, 'type="text" placeholder="e.g. opening balance, extra pay, bank fee"')}</div>`;
    }
    const walletTitle = { wallets: 'New account', walletChecks: 'Update balance', walletTransfers: 'Transfer' }[F.kind];
    const picking = F.kind === 'wallets' && !r.type; // choosing the kind of account: nothing to save yet
    const keepAccount = F.kind === 'wallets' && (wOf(r.id) || {}).linked; // the three bank accounts can't be deleted
    const kindSwitch = F.kind === 'paybacks'
      ? `<h2 id="form-title">💸 ${F.isNew ? 'Payback / lend' : 'Edit payback'}</h2>`
      : walletTitle && F.isNew ? `<h2 id="form-title">${walletTitle}</h2>`
      : F.isNew
      ? `<div class="seg kinds" role="group" aria-label="Entry type">${[['income', '💼 Income'], ['expenses', '🧾 Expense'], ['adjustments', '🔁 Adjust'], ['interest', '🏦 Interest']].map(([k, l]) =>
        `<button type="button" data-act="form-kind" data-key="${k}" aria-pressed="${F.kind === k}">${l}</button>`).join('')}</div>`
      : `<h2 id="form-title">Edit ${F.kind === 'income' && F.payType === 'other' ? 'other income' : KIND_LABEL[F.kind].toLowerCase()}</h2>`;
    $('#modal').innerHTML = `
      <div class="sheet" role="dialog" aria-modal="true" aria-label="${F.isNew ? 'Add entry' : 'Edit entry'}"><div class="grab"></div>
        <div class="spread" style="margin-bottom:14px">${kindSwitch}<button type="button" class="icon-btn" data-act="close" aria-label="Close" style="flex:none">${ico('close', 18)}</button></div>
        <form class="form" id="entry-form" onsubmit="return false">${body}
          ${picking ? '' : `<div class="${F.kind === 'wallets' ? '' : 'receipt'}" id="form-preview"></div>
          <div class="sheet-actions">
            ${F.isNew || keepAccount ? '' : '<button type="button" class="btn danger" data-act="form-delete">Delete</button>'}
            ${F.isNew && F.kind === 'expenses' ? '<button type="button" class="btn" data-act="form-save-more">Save &amp; add another</button>' : ''}
            <button type="submit" class="btn primary grow" data-act="form-save">Save</button></div>`}
        </form></div>`;
    if ($('#calc-value')) calcSync();
    else updatePreview();
  }

  function readForm() {
    const F = state.form;
    if (!F) return;
    document.querySelectorAll('#entry-form [name]').forEach(el => { F.rec[el.name] = el.value.trim(); });
  }

  function updatePreview() {
    const F = state.form;
    const el = $('#form-preview');
    if (!F || !el) return;
    const M = state.M;
    const r = F.rec;
    const line = (a, b, cls) => `<div class="line"><span>${a}</span><span class="num${cls || ''}">${b}</span></div>`;
    const myrLine = () => (r.currency === 'MYR' && !blank(r.fxAmount) ? line('Typed in MYR', `${myr(Number(r.fxAmount))} ÷ ${r.fxRate}`) : '');
    if (F.kind === 'income' && F.payType === 'other') {
      const amt = Number(r.amount) || 0;
      const c = E.compute({ settings: state.app.data.settings, income: [{ id: 'preview', date: r.date, person: r.person, days: 0, otherNet: amt, intoFund: r.intoFund }] }).income[0];
      const into = r.intoFund ? `${esc(fIcon(r.intoFund))} ${esc(r.intoFund)} <span class="muted small">${esc((fundOf(r.intoFund) || {}).account || '')}</span>` : 'Split across funds like pay';
      el.innerHTML = line('Adds', `<strong class="pos">+${money(amt)}</strong>`) + myrLine() + line('Goes into', into) +
        line('Tax', r.otherTaxable === 'Yes' ? 'Counted as taxable income' : 'Not taxable') +
        (c && !r.intoFund && amt ? `<div style="margin-top:6px">${stackBar(M.fundNames.map(f => ({ label: f, value: c.alloc[f], colour: fColour(f) })))}</div>
          <div class="legend">${M.fundNames.map(f => `<span><span class="dot" style="--c:${fColour(f)}"></span>${esc(f)} ${money(c.alloc[f])}</span>`).join('')}</div>` : '');
    } else if (F.kind === 'income') {
      const c = E.compute({ settings: state.app.data.settings, income: [Object.assign({ id: 'preview' }, r)] }).income[0];
      if (!c) { el.innerHTML = '<span class="muted">Choose a date and person.</span>'; return; }
      el.innerHTML = line('Hours', `${c.days} × ${c.hoursPerDay} + ${c.extraHours} = <strong>${hrs(c.hours)}</strong>`) +
        line('Gross pay', money(c.gross)) +
        line(`Tax withheld <span class="muted small">(${c.fy}, scale ${esc(c.scale)})</span>`, c.actualTax === null ? '−' + money(c.calcTax) : `−${money(c.actualTax)} <span class="${Math.abs(c.taxDiff) > 0.004 ? 'flag' : 'muted'} small">(calc ${money(c.calcTax)})</span>`) +
        '<hr>' + `<div class="line"><strong>Net pay</strong><span class="net pos">${money(c.net)}</span></div>` +
        line(`Super <span class="muted small">(employer, ${pctf(c.superRate)})</span>`, money(c.superAmt)) +
        `<div style="margin-top:6px">${stackBar(M.fundNames.map(f => ({ label: f, value: c.alloc[f], colour: fColour(f) })))}</div>
        <div class="legend">${M.fundNames.map(f => `<span><span class="dot" style="--c:${fColour(f)}"></span>${esc(f)} ${money(c.alloc[f])}</span>`).join('')}</div>
        <hr><div class="line"><strong>Goes to</strong></div>
        ${M.accounts.map(a => line(`${esc(aIcon(a))} ${esc(a)}`, money(sumOf(fundsIn(a), f => c.alloc[f])))).join('')}`;
    } else if (F.kind === 'expenses') {
      const cat = M.categories.find(x => x.name === r.category);
      const fund = r.fund || (cat && cat.fund) || '';
      const amt = Number(r.amount) || 0;
      let split = '';
      if (r.person === 'Shared') {
        const p1 = blank(r.splitPct) ? M.general.sharedSplit : Number(r.splitPct) / 100;
        split = line('Split', M.codes.map((c, i) => esc(pName(c)) + ' ' + money(i === 0 ? amt * p1 : amt - amt * p1)).join(' · '));
        const o1 = $('#split-out');
        const o2 = $('#split-out2');
        if (o1) { o1.textContent = Math.round(p1 * 100); o2.textContent = 100 - Math.round(p1 * 100); }
      }
      if (r.paidBy && M.codes.length > 1) {
        const other = M.codes.find(c => c !== r.paidBy);
        const p1 = blank(r.splitPct) ? M.general.sharedSplit : Number(r.splitPct) / 100;
        const owed = r.person === 'Shared' ? (other === M.codes[0] ? amt * p1 : amt - amt * p1) : r.person === other ? amt : 0;
        if (owed > 0.004) split += line(`⚖️ ${esc(pName(other))} owes ${esc(pName(r.paidBy))}`, `<strong>${money(owed)}</strong>`);
      }
      el.innerHTML = myrLine() + (fund ? line('Comes out of', `${esc(fIcon(fund))} ${esc(fund)}`) + (fundOf(fund) ? line('Bank account', esc(fundOf(fund).account)) : '') : line('Category', '—')) + split;
    } else if (F.kind === 'paybacks') {
      const amt = Number(r.amount) || 0;
      const now = M.split.balance;
      const editing = F.isNew ? 0 : (M.paybacks.find(x => x.id === r.id) || { amount: 0, from: r.from });
      const base = F.isNew ? now : now - (editing.from === M.codes[0] ? editing.amount : -editing.amount);
      const after = base + (r.from === M.codes[0] ? amt : -amt);
      el.innerHTML = line('Now', owesText(base)) + line('After this', `<strong>${owesText(after)}${Math.abs(after) < 0.005 ? ' 🎉' : ''}</strong>`) +
        '<span class="muted small">Paybacks don’t change budgets or fund balances: each person’s share was already counted when the bill was added.</span>';
    } else if (F.kind === 'wallets') {
      const debt = !!E.WALLET_TYPES[r.type].debt;
      const saved = wOf(r.id);
      el.innerHTML = walletCard({ id: '', name: r.name || 'Account name', type: r.type, currency: r.currency, debt, owner: r.owner, colour: r.colour, badge: r.badge, logo: r.logo, number: r.number,
        linked: saved && saved.linked, shown: saved && saved.linked ? saved.shown : Number(r.opening) || 0 }, true);
    } else if (F.kind === 'walletChecks') {
      const w = wOf(r.walletId);
      const saved = w.events.find(e => e.id === r.id);
      const was = saved ? saved.balance - saved.change : w.balance;
      const now = w.debt ? -(Number(r.amount) || 0) : Number(r.amount) || 0;
      const flip = v => (w.debt ? -v : v);
      el.innerHTML = line('Was', wMoney(flip(was), w.currency)) + line('Now', `<strong>${wMoney(flip(now), w.currency)}</strong>`) + line('Difference', wSigned(flip(now - was), w.currency)) +
        (w.linked ? '<span class="muted small">The difference is saved as an adjustment, so Savings ▸ Accounts matches too.</span>' : '');
    } else if (F.kind === 'walletTransfers') {
      const from = wOf(r.fromId);
      const to = wOf(r.toId);
      const x = E.walletTransfer(from.currency, to.currency, r, M.general.exchangeRate);
      const worked = E.walletTransfer(from.currency, to.currency, Object.assign({}, r, { received: '' }), M.general.exchangeRate).received;
      const got = $('#entry-form [name="received"]');
      if (got) got.placeholder = 'Worked out: ' + worked.toFixed(2);
      el.innerHTML = line(`Leaves ${esc(from.name)}`, '−' + wMoney(x.left, from.currency), ' neg') +
        (x.fee ? line('Fee', wMoney(x.fee, from.currency)) : '') +
        (x.cross ? line('Converted', `${wMoney(x.converted, from.currency)} at ${+x.rate.toFixed(4)}`) : '') +
        line(`Arrives in ${esc(to.name)}`, '+' + wMoney(x.received, to.currency), ' pos') +
        (x.cross && x.fee && x.realRate ? line('Real rate after the fee', rateText(x.realRate)) : '') +
        `<span class="muted small">${x.fee ? 'The fee is saved as a “Transfer fee” expense. ' : ''}${from.linked || to.linked ? 'Savings ▸ Accounts updates too.' : ''}</span>`;
    } else if (F.kind === 'interest') {
      const amt = Number(r.amount) || 0;
      const fy = /^\d{4}-\d{2}-\d{2}$/.test(r.date || '') ? E.fyOf(r.date) : M.currentFY;
      const p1 = M.general.sharedSplit;
      const split = r.person === 'Shared' ? M.codes.map((c, i) => esc(pName(c)) + ' ' + money(i === 0 ? amt * p1 : amt - amt * p1)).join(' · ') : esc(pName(r.person)) + ' ' + money(amt);
      el.innerHTML = line(`${esc(aIcon(r.account))} ${esc(r.account)} · ${esc(r.fund)}`, '+' + money(amt), ' pos') +
        line('Taxable income ' + fyName(fy), split) + '<span class="muted small">Added to the fund’s balance and to the year-end tax estimate.</span>';
    } else {
      const amt = money(Number(r.amount) || 0);
      const acctOf = f => esc((fundOf(f) || {}).account || '');
      el.innerHTML = (F.adjType !== 'Add' ? line(`${esc(fIcon(r.fromFund))} ${esc(r.fromFund || '')} <span class="muted small">${acctOf(r.fromFund)}</span>`, '−' + amt, ' neg') : '') +
        (F.adjType !== 'Deduct' ? line(`${esc(fIcon(r.toFund))} ${esc(r.toFund || '')} <span class="muted small">${acctOf(r.toFund)}</span>`, '+' + amt, ' pos') : '') +
        `<span class="muted small">Changes ${esc(pName(r.person))}’s fund balances.</span>`;
    }
  }

  // ---------- saving: show it now, save in the background ----------

  let pendingSaves = 0;
  let localEdits = 0; // changes shown here that a copy loaded from the server earlier won't have
  // `unsaved`: the iPhone app opened from this copy reloads in full, in case a save never arrived.
  const cacheApp = () => { if (window.__trackerCache) window.__trackerCache(Object.assign({}, state.app, { unsaved: pendingSaves > 0 })); };
  const refreshLocal = () => { localEdits++; recompute(); render(); cacheApp(); };
  window.addEventListener('beforeunload', e => {
    if (pendingSaves > 0) { e.preventDefault(); e.returnValue = ''; } // don't lose a save that's still on its way
  });

  /** A background save finished (`res` is the server's answer, or nothing if it failed). */
  function saveDone(res) {
    // Nobody else changed anything since our copy was loaded: our copy now matches the new version.
    if (res && res.ver && res.prev === state.app.ver) state.app.ver = res.ver;
    pendingSaves--;
    cacheApp();
    if (!pendingSaves) setTimeout(checkForUpdates, 0);
  }

  /** Shows the change straight away, saves it in the background, and undoes it (reopening the form) if the save fails. */
  function persist(kind, rec, isNew, msg, reopen) {
    const list = state.app.data[kind] || (state.app.data[kind] = []);
    const before = list.slice();
    const i = list.findIndex(r => String(r.id) === String(rec.id));
    if (i >= 0) list[i] = Object.assign({}, list[i], rec);
    else list.push(rec);
    refreshLocal();
    toast(msg);
    pendingSaves++;
    return call('saveEntry', kind, rec, isNew).then(res => {
      const now = state.app.data[kind] || [];
      const j = now.findIndex(r => String(r.id) === String(rec.id));
      if (j >= 0 && res && res.record) now[j] = Object.assign({}, now[j], res.record);
      saveDone(res);
    }, err => {
      state.app.data[kind] = before;
      refreshLocal();
      toast('Couldn’t save: ' + errText(err), true);
      if (reopen && !state.form) openForm(reopen.kind, reopen.rec, { isNew: reopen.isNew, payType: reopen.payType, adjType: reopen.adjType });
      saveDone(null);
    });
  }

  /** Like persist, for entries that are saved together: all of them show now, and all are undone if the save fails. */
  function persistBundle(items, msg, reopen) {
    const before = {};
    items.forEach(it => {
      const list = state.app.data[it.kind] || [];
      if (!before[it.kind]) before[it.kind] = list.slice();
      const rest = list.filter(r => String(r.id) !== String(it.remove || it.record.id));
      state.app.data[it.kind] = it.remove ? rest : rest.concat(it.record);
    });
    refreshLocal();
    toast(msg);
    pendingSaves++;
    return call('saveBundle', items).then(res => {
      (res && res.records || []).forEach(it => {
        const list = state.app.data[it.kind] || [];
        const i = list.findIndex(r => String(r.id) === String(it.record.id));
        if (i >= 0) list[i] = Object.assign({}, list[i], it.record);
      });
      saveDone(res);
    }, err => {
      Object.keys(before).forEach(k => { state.app.data[k] = before[k]; });
      refreshLocal();
      toast('Couldn’t save: ' + errText(err), true);
      if (reopen && !state.form) openForm(reopen.kind, reopen.rec, { isNew: reopen.isNew });
      saveDone(null);
    });
  }

  function saveForm(addAnother) {
    readForm();
    const F = state.form;
    const payload = Object.assign({}, F.rec);
    const needsAmount = F.kind !== 'wallets' && (F.kind !== 'income' || F.payType === 'other');
    if (needsAmount) {
      const amt = Number(payload.amount);
      // A balance can be 0 (an emptied account); every other amount can't.
      if (blank(payload.amount) || !isFinite(amt) || (amt === 0 && F.kind !== 'walletChecks')) { toast('Enter an amount with the keypad.', true); return; }
      if (['adjustments', 'paybacks', 'walletTransfers'].indexOf(F.kind) >= 0 && amt < 0) { toast('The amount must be more than $0.', true); return; }
    }
    if (F.kind === 'wallets' && !payload.name) { toast('Give the account a name.', true); return; }
    if (F.kind === 'walletChecks') {
      const w = wOf(payload.walletId);
      if (w.linked) {
        // These balances are worked out, so the bank's figure goes in as an adjustment for the difference.
        const diff = E.round2(Number(payload.amount) - w.balance);
        if (Math.abs(diff) < 0.005) { toast('That’s already the balance.', true); return; }
        closeModal();
        persist('adjustments', { id: newId('adjustments'), date: payload.date, person: w.owner === 'Shared' ? state.M.viewer : w.owner, fromFund: diff < 0 ? payload.fund : '', toFund: diff > 0 ? payload.fund : '',
          amount: Math.abs(diff), note: payload.note || 'Balance fix' }, true, '✓ Balance fixed');
        return;
      }
      payload.walletName = w.name;
      payload.at = payload.at || Date.now();
    }
    if (F.kind === 'walletTransfers') {
      const from = wOf(payload.fromId);
      const to = wOf(payload.toId);
      if (from === to) { toast('Choose two different accounts.', true); return; }
      const cross = from.currency !== to.currency;
      if (cross && !(Number(payload.rate) > 0)) { toast('Enter the transfer rate.', true); return; }
      if (Number(payload.fee) < 0) { toast('The fee can’t be negative.', true); return; }
      if (payload.feeIn === 'Yes' && Number(payload.fee) >= Number(payload.amount)) { toast('The fee must be less than the amount.', true); return; }
      // Transfers saved before fees became expenses have no person yet.
      Object.assign(payload, { fromName: from.name, toName: to.name, fromCur: from.currency, toCur: to.currency, at: payload.at || Date.now(), person: payload.person || state.M.viewer });
      if (!cross) Object.assign(payload, { rate: '', received: '' });
    }
    if (F.kind === 'expenses') payload.splitPct = payload.person === 'Shared' && !blank(payload.splitPct) ? Number(payload.splitPct) / 100 : '';
    if (F.kind === 'interest') delete payload.account;
    if (F.kind === 'adjustments') {
      if (F.adjType === 'Add') payload.fromFund = '';
      if (F.adjType === 'Deduct') payload.toFund = '';
      if (F.adjType === 'Account' && payload.fromAccount === payload.toAccount) { toast('Choose two different accounts.', true); return; }
      delete payload.fromAccount;
      delete payload.toAccount;
    }
    if (F.kind === 'income' && F.payType === 'other') {
      Object.assign(payload, { otherNet: payload.amount, days: 0, hoursPerDay: '', extraHours: '', rate: '', scale: '', actualTax: '' });
    }
    if (F.kind === 'income') delete payload.amount;
    if (F.kind !== 'expenses' && F.kind !== 'wallets' && !(F.kind === 'income' && F.payType === 'other')) {
      delete payload.currency;
      delete payload.fxAmount;
      delete payload.fxRate;
    }
    const isNew = F.isNew || !payload.id;
    if (!payload.id) payload.id = newId(F.kind);
    if (payload.person) store.set('lastPerson', payload.person);
    if (F.kind === 'expenses') store.set('lastCategory', payload.category);
    const reopen = { kind: F.kind, rec: Object.assign({}, F.rec), isNew: F.isNew, payType: F.payType, adjType: F.adjType };
    const label = F.kind === 'income' && F.payType === 'other' ? 'Income' : KIND_LABEL[F.kind];
    if (addAnother) openForm(F.kind, newRecord(F.kind, { date: payload.date, person: payload.person, category: payload.category }));
    else closeModal();
    if (reopen.kind === 'walletTransfers') persistBundle(transferItems(payload), isNew ? '✓ Transfer added' : '✓ Saved', reopen);
    else persist(reopen.kind, payload, isNew, isNew ? '✓ ' + label + ' added' : '✓ Saved', reopen);
  }

  /** A transfer, plus the entries it makes in the budget: its fee as an expense, and any move in or out of a Savings account. */
  function transferItems(t) {
    const from = wOf(t.fromId);
    const to = wOf(t.toId);
    const x = E.walletTransfer(from.currency, to.currency, t, state.M.general.exchangeRate);
    // These two rows are seen by both of you, so they name the countries and not the private accounts.
    const route = wPlace(from.currency)[3] + ' → ' + wPlace(to.currency)[3];
    const adjustment = { kind: 'adjustments', remove: 'A-wt-' + t.id };
    const fee = { kind: 'expenses', remove: 'E-wt-' + t.id };
    if (from.linked || to.linked) {
      delete adjustment.remove;
      adjustment.record = { id: 'A-wt-' + t.id, date: t.date, person: t.person, fromFund: from.linked ? t.fromFund : '', toFund: to.linked ? t.toFund : '', amount: to.linked ? x.received : x.converted, note: 'Wallet transfer: ' + route };
    }
    if (x.fee) {
      delete fee.remove;
      const myrFee = from.currency === 'MYR';
      fee.record = { id: 'E-wt-' + t.id, date: t.date, person: t.person, paidBy: t.person, amount: x.feeAUD, category: E.FEE_CATEGORY, description: route, splitPct: '', fund: t.fromFund || '',
        currency: myrFee ? 'MYR' : '', fxAmount: myrFee ? x.fee : '', fxRate: myrFee ? x.rate || state.M.general.exchangeRate : '' };
    }
    return [{ kind: 'walletTransfers', record: t }, adjustment, fee];
  }

  function deleteForm() {
    const F = state.form;
    const records = F.kind === 'wallets' && wOf(F.rec.id) ? wOf(F.rec.id).events.length : 0;
    if (records) {
      toast('This account has ' + records + (records > 1 ? ' records' : ' record') + '. Set its status to Closed instead, or delete them first.', true);
      return;
    }
    if (!confirm('Delete this ' + KIND_LABEL[F.kind].toLowerCase() + '? This can\'t be undone.')) return;
    const kind = F.kind;
    const id = F.rec.id;
    if (kind === 'walletTransfers') {
      closeModal();
      persistBundle([{ kind, remove: id }, { kind: 'adjustments', remove: 'A-wt-' + id }, { kind: 'expenses', remove: 'E-wt-' + id }], 'Deleted');
      return;
    }
    const before = (state.app.data[kind] || []).slice();
    state.app.data[kind] = before.filter(r => String(r.id) !== String(id));
    closeModal();
    refreshLocal();
    toast('Deleted');
    pendingSaves++;
    call('deleteEntry', kind, id).then(saveDone, err => {
      state.app.data[kind] = before;
      refreshLocal();
      toast('Couldn’t delete: ' + errText(err), true);
      saveDone(null);
    });
  }

  // ======================================================================
  // Settings actions
  // ======================================================================

  async function saveSettings(sections, button, msg) {
    if (button) button.disabled = true;
    try {
      await serverUpdate('saveSettings', [sections], msg || '✓ Settings saved');
    } catch (err) {
      if (button) button.disabled = false;
      toast(errText(err), true);
    }
  }

  function settingsAction(act, button) {
    const S = state.app.data.settings;
    const M = state.M;
    if (act === 'save-general') {
      return saveSettings({ general: { exchangeRate: $('#s-rate').value, startDate: $('#s-start').value, sharedSplit: Number($('#s-split').value) / 100, iconUrl: $('#s-icon').value.trim() } }, button);
    }
    if (act === 'save-people') {
      const rows = readGrid('g-people');
      if (rows.length !== 2) toast('Note: the tracker is designed for exactly two people.', true);
      return saveSettings({ people: rows }, button);
    }
    if (act === 'save-funds') return saveSettings({ funds: readGrid('g-funds') }, button);
    if (act === 'save-cats') return saveSettings({ categories: readGrid('g-cats') }, button);
    if (act === 'save-alloc') {
      const rows = readGrid('g-alloc').map(r => {
        const pct = {};
        M.fundNames.forEach((f, i) => { pct[f] = r['f' + i] === '' ? 0 : r['f' + i]; });
        return { from: r.from, pct };
      });
      const bad = rows.find(r => Math.abs(sumOf(Object.keys(r.pct), f => r.pct[f]) - 1) > 0.00005);
      if (bad && !confirm('The allocation from ' + bad.from + ' does not add up to 100%. Save anyway?')) return null;
      return saveSettings({ allocations: rows }, button);
    }
    if (act === 'save-tax') {
      const fy = state.taxFy;
      const brackets = S.brackets.filter(b => !sameFy(b.fy, fy)).concat(readGrid('g-brackets').map(b => Object.assign({ fy }, b)));
      const withholding = S.withholding.filter(w => !sameFy(w.fy, fy)).concat(readGrid('g-withholding').map(w => Object.assign({ fy }, w)));
      const taxYears = readGrid('g-taxyears').map(t => Object.assign({}, t, { fy: E.normFy(t.fy) }));
      return saveSettings({ taxYears, brackets, withholding }, button, '✓ Tax tables saved');
    }
    if (act === 'copy-fy') {
      const from = state.taxFy;
      const to = E.normFy($('#copy-fy').value);
      if (!/^FY\d{4}-\d{2}$/.test(to)) { toast('Use the format 2027-28.', true); return null; }
      const exists = S.taxYears.some(t => sameFy(t.fy, to)) || S.withholding.some(w => sameFy(w.fy, to));
      if (exists && !confirm(fyName(to) + ' already has tax tables. Replace them with a copy of ' + fyName(from) + '?')) return null;
      const ty = S.taxYears.find(t => sameFy(t.fy, from));
      const sections = {
        taxYears: S.taxYears.filter(t => !sameFy(t.fy, to)).concat(ty ? [Object.assign({}, ty, { fy: to, note: 'Copied from ' + fyName(from) + ' — update to the new ATO rates.' })] : []),
        brackets: S.brackets.filter(b => !sameFy(b.fy, to)).concat(S.brackets.filter(b => sameFy(b.fy, from)).map(b => Object.assign({}, b, { fy: to }))),
        withholding: S.withholding.filter(w => !sameFy(w.fy, to)).concat(S.withholding.filter(w => sameFy(w.fy, from)).map(w => Object.assign({}, w, { fy: to }))),
      };
      state.taxFy = to;
      return saveSettings(sections, button, '✓ Copied ' + fyName(from) + ' to ' + fyName(to));
    }
    return null;
  }

  /** Fills the Funds grid with the recommended colours and icons (saved when you press Save funds). */
  function applyRecommendedColours() {
    document.querySelectorAll('#g-funds tbody tr').forEach(tr => {
      const name = tr.querySelector('[data-key="name"]').value.trim();
      const rec = RECOMMENDED_FUNDS[name];
      if (!rec) return;
      tr.querySelector('[data-key="colour"]').value = rec[0].toLowerCase();
      tr.querySelector('[data-key="account"]').value = rec[2];
      const icon = tr.querySelector('[data-key="icon"]');
      if (!icon.value) icon.value = rec[1];
    });
    toast('Accounts and colours filled in. Press "Save funds" to keep them.');
  }

  async function plainAction(fn, button, msg, confirmText, args) {
    if (confirmText && !confirm(confirmText)) return;
    button.disabled = true;
    try {
      if (fn === 'refreshReports') {
        await call(fn);
        toast(msg);
      } else {
        await serverUpdate(fn, args || [], msg);
      }
    } catch (err) {
      toast(errText(err), true);
    }
    button.disabled = false;
  }

  // ---------- staying up to date ----------
  // Every change, from either app, any phone or the Sheet itself, gives the data a new version on
  // the server. While the app is on screen it checks that version every few seconds (and as soon as
  // it comes back to the screen) and quietly loads the latest when it differs. Apps Script can't
  // push to an open page, so this is as close to live as it gets. Left untouched, it checks less often.

  let loading = null; // the copy being loaded, if any

  /** Loads the latest data. Redraws only if something changed, keeping your place on the page. */
  function reload(silent) {
    const btn = $('#btn-refresh');
    if (btn && !silent) btn.style.opacity = '.5';
    if (!loading) {
      const edits = localEdits;
      loading = call('getAppData', !silent).then(app => { loading = null; useLatest(app, edits); }, err => { loading = null; throw err; });
    }
    return loading.then(() => {
      if (silent) return;
      if (state.stale && !state.form) renderKeepingPlace();
      toast('✓ Up to date');
    }, err => {
      if (!silent) toast(errText(err), true);
    }).then(() => { if (btn) btn.style.opacity = ''; });
  }

  function useLatest(app, edits) {
    if (pendingSaves > 0 || localEdits !== edits) {
      // Something was changed here while this copy was on its way, so it's already out of date
      // (this used to bring back a pay that had just been recorded). Check again once saved.
      if (!pendingSaves) setTimeout(checkForUpdates, 0);
      return;
    }
    const changed = JSON.stringify(app.data) !== JSON.stringify(state.app.data);
    state.app = app;
    state.loadedAt = Date.now();
    cacheApp();
    if (changed) {
      recompute();
      if (state.form || busy()) state.stale = true; // don't pull the page away mid-typing; shown when done
      else renderKeepingPlace();
    }
    const pill = $('.sync-pill span');
    if (pill) pill.textContent = loadedTime();
  }

  /** Someone is typing in the page, or has unsaved edits in it (e.g. a Settings table). */
  function busy() {
    const a = document.activeElement;
    return state.viewEdited || !!(a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && a.type !== 'button');
  }

  /** Redraws the page in place: same scroll position, charts without their opening animation. */
  function renderKeepingPlace() {
    const y = window.scrollY;
    state.quiet = true;
    try {
      render();
    } finally {
      state.quiet = false;
    }
    window.scrollTo(0, y);
  }

  let checking = false;
  async function checkForUpdates() {
    if (checking || loading || pendingSaves > 0 || document.hidden || !state.M) return;
    checking = true;
    try {
      // One request: "nothing new" (null) or, when something changed, all of it straight away.
      const edits = localEdits;
      const app = await call('appDataIfChanged', state.app.ver);
      if (app) {
        if (!loading) useLatest(app, edits);
      } else {
        state.loadedAt = Date.now(); // checked: nothing new
        const pill = $('.sync-pill span');
        if (pill) pill.textContent = loadedTime();
        if (state.stale && !state.form && !busy()) renderKeepingPlace();
      }
    } catch (err) {
      // Offline or asleep: try again next time.
    }
    checking = false;
  }

  window.__trackerReload = reload;
  window.__trackerCheck = checkForUpdates; // the iPhone app calls this when a notification arrives
  const CHECK_EVERY = 2000;
  const CHECK_IDLE = 15000;
  const IDLE_AFTER = 5 * 60 * 1000;
  let lastUsed = Date.now();
  ['pointerdown', 'keydown', 'scroll'].forEach(type => document.addEventListener(type, () => { lastUsed = Date.now(); }, { passive: true, capture: true }));
  function nextCheck() {
    setTimeout(() => { checkForUpdates().then(nextCheck, nextCheck); }, Date.now() - lastUsed < IDLE_AFTER ? CHECK_EVERY : CHECK_IDLE);
  }
  nextCheck();
  const backOnScreen = () => { lastUsed = Date.now(); if (!document.hidden) checkForUpdates(); };
  document.addEventListener('visibilitychange', backOnScreen);
  window.addEventListener('focus', backOnScreen);
  window.addEventListener('pageshow', backOnScreen);
  window.addEventListener('online', checkForUpdates);
  // Typing in the page (not the pop-up form) holds back background redraws until it's saved or left.
  document.addEventListener('input', e => { if (e.target.closest && e.target.closest('#view')) state.viewEdited = true; }, true);

  const defaultKind = () => (state.view === 'income' || state.view === 'super' ? 'income' : state.view === 'interest' ? 'interest'
    : state.view === 'balances' || state.view === 'accounts' ? 'adjustments' : 'expenses');

  // ======================================================================
  // App lock: a passcode that stays on this device
  // ======================================================================
  // Only a salted hash is kept, in this device's storage. It's never sent to the server, so each
  // phone has its own. `lockState.mode`: unlock, check (the current passcode, before changing it),
  // new, confirm, or curtain (just covers the screen while the app is in the background).

  const LOCK_LENGTH = 6;
  const LOCK_ROUNDS = 150000;
  const LOCK_TRIES = 5; // wrong tries before having to wait
  const LOCK_WAIT = 30000; // doubles with each further wrong try
  const LOCK_WAIT_MAX = 15 * 60 * 1000;
  const LOCK_TIMES = [[0, 'Straight away'], [1, 'After 1 minute'], [5, 'After 5 minutes'], [15, 'After 15 minutes']];
  const lockState = { mode: '', then: '', typed: '', first: '', note: '', busy: false };
  const FACE_ICON = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" style="vertical-align:-4px"><path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2M9 9v1M15 9v1M12 9v4h-1M9 16c1.7 1.3 4.3 1.3 6 0"/></svg>';
  let lockTick;

  const lockRead = key => { try { return JSON.parse(store.get(key) || 'null'); } catch (e) { return null; } };
  const lockSaved = () => lockRead('lock');
  const lockFails = () => lockRead('lock-fails') || { n: 0, until: 0 };
  const lockWaitLeft = () => Math.max(0, lockFails().until - Date.now());
  const toHex = bytes => Array.from(bytes).map(b => ('0' + b.toString(16)).slice(-2)).join('');

  async function lockHash(code, salt, rounds) {
    const bytes = new Uint8Array(salt.match(/../g).map(h => parseInt(h, 16)));
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(code), 'PBKDF2', false, ['deriveBits']);
    return toHex(new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: bytes, iterations: rounds }, key, 256)));
  }

  /** Long enough away that the passcode is needed again. A clock moved backwards counts too. */
  function lockExpired() {
    const saved = lockSaved();
    const away = Date.now() - (Number(store.get('lock-left')) || 0);
    return !saved.after || away < 0 || away >= saved.after * 60000;
  }

  function lockCover(on) {
    ['.app', '#nav-bottom', '#modal'].forEach(sel => { const el = $(sel); if (el) el.inert = on; });
  }

  // ---------- Face ID (Touch ID on other devices) ----------
  // A passkey made on this phone and used only to unlock the app: iPhone asks for Face ID before it signs, and the
  // app checks that Face ID was really used (the "user verified" flag). Nothing goes to the server. The passcode stays
  // as the way back in when Face ID fails or the face isn't recognised.
  const bioSaved = () => lockRead('lock-bio');
  const BIO_NAME = /iPhone|iPad|iPod/.test(navigator.userAgent) ? 'Face ID' : 'fingerprint or face';
  let bioOk = null; // can this device do it? (checked once, below)
  let bioBusy = false;
  const bioReady = (async () => {
    try {
      bioOk = window.self === window.top && !!window.PublicKeyCredential && !!navigator.credentials
        && await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch (e) {
      bioOk = false;
    }
    const card = $('#lock-card');
    if (card && !lockState.mode) card.innerHTML = lockCard();
  })();

  async function bioSetUp() {
    const cred = await navigator.credentials.create({ publicKey: {
      rp: { name: 'ZR & YC Finance' },
      user: { id: crypto.getRandomValues(new Uint8Array(16)), name: 'ZR & YC app lock', displayName: 'ZR & YC app lock' },
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
      authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'discouraged' },
      attestation: 'none',
      timeout: 60000,
    } });
    store.set('lock-bio', JSON.stringify({ id: bytesB64(cred.rawId) }));
    return !!bioSaved();
  }

  /** Resolves only if this phone's own passkey signed with Face ID. */
  async function bioVerify() {
    const saved = bioSaved();
    const cred = await navigator.credentials.get({ publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      allowCredentials: [{ type: 'public-key', id: b64Bytes(saved.id), transports: ['internal'] }],
      userVerification: 'required',
      timeout: 60000,
    } });
    const flags = new Uint8Array(cred.response.authenticatorData)[32];
    if (bytesB64(cred.rawId) !== saved.id || !(flags & 4)) throw new Error('Face ID wasn’t confirmed.');
  }

  /** Unlock with Face ID. `auto`: tried by itself when the lock opens, so a refusal stays quiet (just type the passcode). */
  async function lockBio(auto) {
    if (bioOk === null) await bioReady; // the lock can open before the check is done (app start)
    if (bioBusy || lockState.mode !== 'unlock' || !bioSaved() || !bioOk) return;
    bioBusy = true;
    try {
      await bioVerify();
      bioBusy = false;
      if (lockState.mode !== 'unlock') return;
      store.set('lock-fails', '');
      closeLock();
    } catch (err) {
      bioBusy = false;
      if (!auto && lockState.mode === 'unlock') {
        lockState.note = BIO_NAME + ' didn’t unlock it. Type your passcode.';
        renderLock();
      }
    }
  }

  function openLock(mode, then) {
    Object.assign(lockState, { mode, then: then || '', typed: '', first: '', note: '', busy: false });
    $('#lock').hidden = false;
    lockCover(true);
    renderLock();
    if (mode === 'unlock' && bioSaved()) setTimeout(() => lockBio(true), 60);
  }

  function closeLock() {
    clearTimeout(lockTick);
    lockState.mode = '';
    $('#lock').hidden = true;
    $('#lock').innerHTML = '';
    lockCover(false);
    const card = $('#lock-card');
    if (card) card.innerHTML = lockCard();
  }

  function renderLock() {
    const L = lockState;
    clearTimeout(lockTick);
    if (L.mode === 'curtain') { $('#lock').innerHTML = `<div class="lock-box">${appIcon(72)}</div>`; return; }
    const wait = L.mode === 'unlock' || L.mode === 'check' ? lockWaitLeft() : 0;
    if (wait) lockTick = setTimeout(renderLock, 1000);
    const title = { unlock: 'Enter passcode', check: 'Enter your current passcode', new: 'Choose a ' + LOCK_LENGTH + '-digit passcode', confirm: 'Type it again' }[L.mode];
    const dots = Array.from({ length: LOCK_LENGTH }, (_, i) => `<i${i < L.typed.length ? ' class="on"' : ''}></i>`).join('');
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map(k => (k
      ? `<button type="button" data-act="lock-key" data-key="${k}"${k === '⌫' ? ' class="op" aria-label="Delete"' : ''}${wait ? ' disabled' : ''}>${k}</button>` : '<span></span>')).join('');
    $('#lock').innerHTML = `<div class="lock-box" role="dialog" aria-modal="true" aria-label="${title}">${appIcon(56)}<h2>${title}</h2>
      <div class="lock-dots" role="img" aria-label="${L.typed.length} of ${LOCK_LENGTH} digits entered">${dots}</div>
      <p class="lock-note" role="status">${wait ? 'Too many tries. Wait ' + Math.ceil(wait / 1000) + ' seconds.' : esc(L.note) || '&nbsp;'}</p>
      <div class="lock-keys">${keys}</div>
      ${L.mode === 'unlock' && bioSaved() && bioOk !== false ? `<button type="button" class="btn lock-bio" data-act="lock-bio">${FACE_ICON} Use ${BIO_NAME}</button>` : ''}
      ${L.mode === 'unlock' ? '<button type="button" class="btn link" data-act="lock-forgot">Forgot passcode?</button>' : '<button type="button" class="btn link" data-act="lock-cancel">Cancel</button>'}</div>`;
  }

  function lockKey(k) {
    const L = lockState;
    if (L.busy || L.mode === 'curtain' || ((L.mode === 'unlock' || L.mode === 'check') && lockWaitLeft())) return;
    if (k === '⌫') L.typed = L.typed.slice(0, -1);
    else if (L.typed.length < LOCK_LENGTH) L.typed += k;
    renderLock();
    if (L.typed.length === LOCK_LENGTH) lockSubmit();
  }

  async function lockSubmit() {
    const L = lockState;
    const code = L.typed;
    L.typed = '';
    if (L.mode === 'new') {
      Object.assign(L, { mode: 'confirm', first: code, note: '' });
      renderLock();
    } else if (L.mode === 'confirm') {
      if (code !== L.first) {
        Object.assign(L, { mode: 'new', first: '', note: 'They didn’t match. Try again.' });
        renderLock();
        return;
      }
      L.busy = true;
      const old = lockSaved();
      const salt = toHex(crypto.getRandomValues(new Uint8Array(16)));
      const hash = await lockHash(code, salt, LOCK_ROUNDS);
      store.set('lock', JSON.stringify({ salt, hash, rounds: LOCK_ROUNDS, after: old ? old.after : 1 }));
      const worked = !!lockSaved();
      closeLock();
      toast(worked ? '🔒 Passcode ' + (old ? 'changed' : 'set') : 'Couldn’t save the passcode on this device.', !worked);
    } else {
      L.busy = true;
      const saved = lockSaved();
      const right = await lockHash(code, saved.salt, saved.rounds) === saved.hash;
      L.busy = false;
      if (!right) {
        const n = lockFails().n + 1;
        const over = n - LOCK_TRIES;
        store.set('lock-fails', JSON.stringify({ n, until: over >= 0 ? Date.now() + Math.min(LOCK_WAIT * Math.pow(2, over), LOCK_WAIT_MAX) : 0 }));
        L.note = over < 0 ? 'Wrong passcode. ' + -over + (over === -1 ? ' try' : ' tries') + ' left.' : '';
        renderLock();
        return;
      }
      store.set('lock-fails', '');
      if (L.then === 'change') {
        Object.assign(L, { mode: 'new', then: '', note: '' });
        renderLock();
      } else if (L.then === 'off') {
        ['lock', 'lock-left', 'lock-bio'].forEach(k => store.set(k, ''));
        closeLock();
        toast('App lock turned off');
      } else closeLock();
    }
  }

  /** Forgetting the passcode must not be a way in: a phone is signed out and has to be paired again. */
  function lockForgot() {
    if (window.__trackerForget) {
      if (confirm('This signs this phone out. To use the app again you’ll need a new pairing code from Settings ▸ Install on iPhone on the other phone or the Google link, and you’ll choose your wallet again.')) window.__trackerForget();
      return;
    }
    const typed = prompt('To remove the passcode from this browser, type the Google account you’re signed in with.');
    if (typed === null) return;
    if (typed.trim().toLowerCase() !== String(state.app.user || '').toLowerCase()) { toast('That isn’t the account signed in here.', true); return; }
    ['lock', 'lock-left', 'lock-fails', 'lock-bio'].forEach(k => store.set(k, ''));
    closeLock();
  }

  function lockCard() {
    const saved = lockSaved();
    const where = window.__PWA__ ? 'this phone' : 'this browser';
    const head = `<div class="card-head"><h2>🔒 App lock</h2>${saved ? '<span class="tag good">On</span>' : ''}</div>`;
    if (!(window.crypto && crypto.subtle)) return head + `<p class="muted small" style="margin:0">App lock can’t be used in ${where}.</p>`;
    if (!saved) {
      return head + `<p class="muted small" style="margin-top:0">Ask for a ${LOCK_LENGTH}-digit passcode when the app opens. It’s kept on ${where} only, so each of you sets your own on each phone.</p>
        <button class="btn primary" data-act="lock-set">Set passcode</button>`;
    }
    return head + `<label class="field"><span>Ask for the passcode</span><select data-change="lock-after">${LOCK_TIMES.map(([v, l]) => `<option value="${v}"${v === saved.after ? ' selected' : ''}>${l}</option>`).join('')}</select></label>
      ${bioOk ? `<div class="spread" style="margin-top:12px;gap:10px"><span><strong>${FACE_ICON} Unlock with ${BIO_NAME}</strong><span class="muted small" style="display:block">${bioSaved() ? 'On. The passcode still works when ' + BIO_NAME + ' doesn’t.' : 'The passcode stays as the backup.'}</span></span>
        ${bioSaved() ? '<button class="btn" data-act="bio-off">Turn off</button>' : '<button class="btn primary" data-act="bio-on">Turn on</button>'}</div>` : ''}
      <div class="row" style="margin-top:12px"><button class="btn" data-act="lock-now">Lock now</button><button class="btn" data-act="lock-change">Change passcode</button><button class="btn danger" data-act="lock-off">Turn off</button></div>
      <p class="muted small" style="margin-bottom:0">Notifications still appear on your lock screen. To hide their text, use iPhone Settings ▸ Notifications ▸ ZR &amp; YC ▸ Show Previews.</p>`;
  }

  /** Leaving the app: cover it straight away, so the app switcher doesn't show your balances. */
  function lockLeave() {
    if (lockState.mode || !lockSaved()) return; // already locked: leaving mustn't restart the timer
    store.set('lock-left', Date.now());
    openLock('curtain');
  }

  function lockReturn() {
    if (document.hidden || lockState.mode !== 'curtain') return;
    if (lockExpired()) openLock('unlock');
    else closeLock();
  }

  document.addEventListener('visibilitychange', () => { if (document.hidden) lockLeave(); else lockReturn(); });
  window.addEventListener('pagehide', lockLeave);
  window.addEventListener('pageshow', lockReturn);

  // ======================================================================
  // Events
  // ======================================================================

  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]');
    if (!el) {
      if (e.target.id === 'modal') closeModal();
      return;
    }
    const act = el.dataset.act;
    const key = el.dataset.key;
    if (act === 'view' || act === 'group') {
      let view = key;
      if (act === 'group') {
        const g = GROUPS.find(x => x[0] === key);
        const last = store.get('last-' + key);
        view = key !== 'home' && g[3].indexOf(last) >= 0 ? last : g[3][0]; // Home always opens the overview
      }
      state.view = view;
      state.walletId = null;
      store.set('view', view);
      store.set('last-' + groupOf(view)[0], view);
      render();
      window.scrollTo(0, 0);
    } else if (act === 'close') closeModal();
    else if (act === 'lock-key') lockKey(key);
    else if (act === 'lock-set') openLock('new');
    else if (act === 'lock-now') openLock('unlock');
    else if (act === 'lock-change') openLock('check', 'change');
    else if (act === 'lock-off') openLock('check', 'off');
    else if (act === 'lock-cancel') closeLock();
    else if (act === 'lock-forgot') lockForgot();
    else if (act === 'lock-bio') lockBio(false);
    else if (act === 'bio-on') {
      el.disabled = true;
      bioSetUp().then(worked => { $('#lock-card').innerHTML = lockCard(); toast(worked ? '✓ ' + BIO_NAME + ' unlocks the app' : 'Couldn’t save it on this device.', !worked); },
        err => { el.disabled = false; if (err && err.name !== 'NotAllowedError') toast(BIO_NAME + ' couldn’t be set up: ' + errText(err), true); });
    } else if (act === 'bio-off') {
      store.set('lock-bio', '');
      $('#lock-card').innerHTML = lockCard();
      toast(BIO_NAME + ' turned off. The passcode unlocks the app.');
    }
    else if (act === 'wallet-open' || act === 'wallet-back') {
      state.walletId = act === 'wallet-open' ? key : null;
      render();
      window.scrollTo(0, 0);
    } else if (act === 'wallet-new') openForm('wallets', newRecord('wallets', { currency: key }), { isNew: true });
    else if (act === 'wallet-claim') {
      if (!confirm('This ' + (window.__PWA__ ? 'phone' : 'Google account') + ' is ' + pName(key) + '’s? You can’t change this later.')) return;
      plainAction('walletClaim', el, '🔐 Your wallet is ready', null, [key]);
    } else if (act === 'wallet-edit') {
      const w = wOf(key);
      const saved = (state.app.data.wallets || []).find(r => String(r.id) === key);
      openForm('wallets', saved || { id: w.id, date: w.date, name: w.name, currency: w.currency, type: w.type, owner: w.owner, number: '', opening: '', colour: WALLET_COLOUR, badge: '', logo: '', note: '', closed: '' }, { isNew: false });
    } else if (act === 'wallet-update') openForm('walletChecks', newRecord('walletChecks', { walletId: key }), { isNew: true });
    else if (act === 'wallet-transfer') walletTransferForm(key);
    else if (act === 'wallet-type') { readForm(); state.form.rec.type = key; renderForm(); }
    else if (act === 'wallet-cur') {
      readForm();
      const r = state.form.rec;
      if (r.badge) Object.assign(r, { name: '', badge: '', logo: '', colour: WALLET_COLOUR }); // that quick pick is in the other country
      r.currency = key;
      renderForm();
    } else if (act === 'wallet-brand') {
      readForm();
      const r = state.form.rec;
      const b = WALLET_BRANDS[wPlace(r.currency)[0]].find(x => x[0] === key);
      Object.assign(r, { colour: b[1], badge: b[2], logo: b[3] });
      if (!(wOf(r.id) || {}).linked) r.name = b[0]; // Everyday Account stays Everyday Account
      renderForm();
    } else if (act === 'form-owner') { readForm(); state.form.rec.owner = key; renderForm(); }
    else if (act === 'wt-swap') {
      readForm();
      const r = state.form.rec;
      Object.assign(r, { fromId: r.toId, toId: r.fromId, fromFund: r.toFund, toFund: r.fromFund, received: '' });
      transferFunds(r);
      state.form.calc.fixed = wOf(r.fromId).currency;
      renderForm();
    } else if (act === 'wt-feein') { readForm(); state.form.rec.feeIn = key; renderForm(); }
    else if (act === 'wallet') {
      const order = ['All'].concat(state.M.codes);
      state.person = order[(order.indexOf(state.person) + Number(key) + order.length) % order.length];
      store.set('person', state.person);
      render();
    } else if (act === 'month') {
      const M = state.M;
      const months = M.months.indexOf(state.month) < 0 ? M.months.concat(state.month).sort() : M.months;
      const next = months[months.indexOf(state.month) + Number(key)];
      if (next) {
        state.month = next;
        state.fy = E.fyOf(next + '-01');
        state.cat = '';
        render();
      }
    } else if (act === 'bill-tab') { state.billTab = key; render(); }
    else if (act === 'interest-record') openForm('interest', Object.assign(newRecord('interest'), { date: el.dataset.date }), { isNew: true });
    else if (act === 'interest-skip') { store.set('skip-interest-' + key, '1'); render(); }
    else if (act === 'settle-up') settleUp(); else if (act === 'split-add') {
      const rec = newRecord(key === 'payback' ? 'paybacks' : 'expenses');
      if (key !== 'payback') rec.person = 'Shared';
      openForm(key === 'payback' ? 'paybacks' : 'expenses', rec, { isNew: true });
    } else if (act === 'split-remind') {
      el.disabled = true;
      call('remindDebt').then(() => { el.disabled = false; toast('🔔 Reminder sent to ' + pName(state.M.split.debtor) + '’s phone'); })
        .catch(err => { el.disabled = false; toast(errText(err), true); });
    }
    else if (act === 'paycheck-record' || act === 'paycheck-change') {
      const rec = newRecord('income', { person: key, date: el.dataset.date });
      rec.days = Number(el.dataset.days);
      if (act === 'paycheck-change') openForm('income', rec, { isNew: true });
      else {
        rec.id = newId('income');
        persist('income', rec, true, '✓ ' + pName(key) + '’s pay recorded');
      }
    } else if (act === 'paycheck-skip') {
      store.set('skip-pay-' + key + '-' + el.dataset.date, '1');
      render();
    } else if (act === 'xfer-done') {
      const ids = key.split(',');
      const before = state.app.data.income.map(r => Object.assign({}, r));
      state.app.data.income.forEach(r => { if (ids.indexOf(String(r.id)) >= 0) r.transferred = state.M.today; });
      refreshLocal();
      toast('✓ Marked as transferred');
      pendingSaves++;
      call('markTransferred', ids).then(saveDone, err => { state.app.data.income = before; refreshLocal(); toast(errText(err), true); saveDone(null); });
    } else if (act === 'clear-all') {
      const typed = prompt('This deletes EVERY pay, expense, adjustment and interest entry, and all wallet accounts. Settings and tax tables are kept.\n\nType DELETE to confirm.');
      if (typed === null) return;
      if (typed.trim() !== 'DELETE') { toast('Nothing deleted. Type DELETE (capitals) to confirm.', true); return; }
      plainAction('clearAllEntries', el, '🗑️ All entries deleted', null, ['DELETE']);
    } else if (act === 'pair-code') {
      el.disabled = true;
      call('apiNewPairingCode').then(r => {
        el.disabled = false;
        $('#pair-out').innerHTML = `<div class="receipt" style="margin-top:10px;text-align:center">
          <span class="muted small">Type this into the app on the iPhone (valid ${r.expiresInMinutes} minutes, once):</span>
          <div style="font-size:34px;font-weight:800;letter-spacing:.12em;font-variant-numeric:tabular-nums">${esc(r.code)}</div></div>`;
      }).catch(err => { el.disabled = false; toast(errText(err), true); });
    } else if (act === 'log-refresh') {
      renderLog(null);
    } else if (act === 'log-more') {
      state.logShow += 50;
      renderLogList();
    } else if (act === 'device-remove') {
      if (!confirm('Remove this phone? It will need a new pairing code to open the app again.')) return;
      el.disabled = true;
      call('apiRemoveDevice', key).then(list => { renderInstall(list); toast('Phone removed'); }).catch(err => { el.disabled = false; toast(errText(err), true); });
    } else if (act === 'go-install') {
      state.view = 'settings';
      store.set('last-me', 'settings');
      render();
      setTimeout(() => { const c = $('#install-card'); if (c) c.scrollIntoView({ behavior: 'smooth' }); }, 300);
    } else if (act === 'push-on') {
      el.disabled = true;
      pushTurnOn($('#push-person').value).then(st => { renderPush(st); toast('🔔 Notifications on'); })
        .catch(err => { el.disabled = false; toast(errText(err), true); });
    } else if (act === 'push-off') {
      el.disabled = true;
      pushTurnOff().then(st => { renderPush(st); toast('Notifications off'); }).catch(err => { el.disabled = false; toast(errText(err), true); });
    } else if (act === 'push-test') {
      el.disabled = true;
      call('pushTest').then(r => { el.disabled = false; toast('✓ Test sent to ' + r.sent + (r.sent === 1 ? ' phone' : ' phones')); })
        .catch(err => { el.disabled = false; toast(errText(err), true); });
    }
    else if (act === 'widget-on' || act === 'widget-off') {
      if (act === 'widget-off' && !confirm('Turn widgets off on this phone? Its widgets stop showing numbers, and the script has to be copied again if you turn them back on.')) return;
      el.disabled = true;
      call(act === 'widget-on' ? 'widgetOn' : 'widgetOff').then(st => { renderWidget(st); toast(st.on ? '📱 Widgets on. Now copy the script.' : 'Widgets off'); })
        .catch(err => { el.disabled = false; toast(errText(err), true); });
    } else if (act === 'widget-size') {
      widgetState.size = key;
      renderWidget(widgetState.status);
    } else if (act === 'widget-who') widgetSaveLook({ who: key });
    else if (act === 'widget-back') {
      widgetSaveLook({ back: key });
      if (key === 'picture' && !widgetState.status.pics[widgetState.size]) { widgetFileFor = widgetState.size; widgetFile.click(); }
    } else if (act === 'widget-color') widgetSaveLook({ color: key });
    else if (act === 'widget-pick') {
      widgetFileFor = widgetState.size;
      widgetFile.click();
    } else if (act === 'widget-pic-clear') {
      el.disabled = true;
      call('widgetPicture', widgetState.size, '').then(st => { renderWidget(st); toast('Picture removed'); }).catch(err => { el.disabled = false; toast(errText(err), true); });
    } else if (act === 'widget-copy') widgetCopy();
    else if (act === 'go-import') {
      state.view = 'settings';
      store.set('last-me', 'settings');
      render();
      const imp = $('#importer');
      if (imp) imp.scrollIntoView({ behavior: 'smooth' });
    } else if (act === 'fix-accounts') {
      const rows = state.app.data.settings.funds.map(f => {
        const r = RECOMMENDED_FUNDS[String(f.name).trim()];
        return r ? Object.assign({}, f, { account: r[2], icon: f.icon || r[1] }) : f;
      });
      saveSettings({ funds: rows }, el, '✓ Accounts set: Everyday Account, Self Saving, Shared Saving');
    }
    else if (act === 'person') {
      state.person = key;
      store.set('person', key);
      render();
    } else if (act === 'cat') { state.cat = key; render(); }
    else if (act === 'fy') { state.fy = key; render(); }
    else if (act === 'acct-transfer' || act === 'acct-open') {
      const M = state.M;
      const code = state.person !== 'All' ? state.person : (M.codes.indexOf(store.get('lastPerson')) >= 0 ? store.get('lastPerson') : M.codes[0]);
      const first = a => fundsIn(a)[0] || '';
      if (act === 'acct-transfer') {
        const other = M.accounts.find(a => a !== key) || key;
        openForm('adjustments', { date: M.today, person: code, fromFund: first(key), toFund: first(other), amount: '', note: '' }, { isNew: true, adjType: 'Account' });
      } else {
        openForm('adjustments', { date: M.general.startDate, person: code, fromFund: '', toFund: first(key), amount: '', note: 'Opening balance' }, { isNew: true, adjType: 'Add' });
      }
    }
    else if (act === 'reload') reload(false);
    else if (act === 'add') openForm(key);
    else if (act === 'add-new') {
      if (state.view === 'split') {
        const rec = newRecord('expenses');
        rec.person = 'Shared';
        openForm('expenses', rec, { isNew: true });
      } else if (state.view === 'wallet' && state.M.viewer && (state.person === 'All' || state.person === state.M.viewer)) walletTransferForm(state.walletId);
      else openForm(defaultKind());
    }
    else if (act === 'edit') editEntry(el.dataset.kind, el.dataset.id);
    else if (act === 'form-kind') { readForm(); openForm(key, newRecord(key, { date: state.form.rec.date })); state.form.isNew = true; renderForm(); }
    else if (act === 'form-person') {
      readForm();
      const F = state.form;
      const before = personOf(F.rec.person);
      const after = personOf(key);
      if (F.kind === 'income' && F.isNew && after) {
        // Swap in the other person's defaults unless they were typed over.
        if (!before || String(F.rec.rate) === String(before.rate)) F.rec.rate = after.rate;
        if (!before || String(F.rec.hoursPerDay) === String(before.hoursPerDay)) F.rec.hoursPerDay = after.hoursPerDay;
      }
      if (F.kind === 'expenses' && key !== 'Shared' && (!F.rec.paidBy || F.rec.paidBy === F.rec.person)) F.rec.paidBy = key; // usually you pay your own
      F.rec.person = key;
      renderForm();
    } else if (act === 'form-cat') { readForm(); state.form.rec.category = key; state.form.rec.fund = ''; renderForm(); }
    else if (act === 'form-step') {
      const input = $('#entry-form [name="' + key + '"]');
      const next = Math.max(key === 'extraHours' ? -1e9 : 0, (Number(input.value) || 0) + Number(el.dataset.step));
      input.value = Math.round(next * 100) / 100;
      readForm();
      updatePreview();
    } else if (act === 'form-adjtype') { readForm(); state.form.adjType = key; renderForm(); }
    else if (act === 'form-paidby') { readForm(); state.form.rec.paidBy = key; renderForm(); }
    else if (act === 'form-from') { readForm(); state.form.rec.from = key; state.form.rec.to = state.M.codes.find(c => c !== key) || key; renderForm(); }
    else if (act === 'form-save-more') saveForm(true);
    else if (act === 'form-delete') deleteForm();
    else if (act === 'calc') calcKey(key);
    else if (act === 'calc-cur') {
      readForm();
      const c = state.form.calc;
      if (c.cur !== key) { c.cur = key; c.expr = ''; }
      renderForm();
    } else if (act === 'form-paytype') {
      readForm();
      const F = state.form;
      F.payType = key;
      if (key === 'other') { F.calc = { cur: 'AUD', rate: state.M.general.exchangeRate, expr: '' }; F.rec.amount = ''; }
      renderForm();
    } else if (act === 'form-taxable') { readForm(); state.form.rec.otherTaxable = key; renderForm(); }
    else if (act === 'add-other') openForm('income', null, { payType: 'other' });
    else if (act === 'grid-add') {
      document.querySelector('#' + key + ' tbody').insertAdjacentHTML('beforeend', gridRow(GRIDS[key], null));
      if (key === 'g-alloc') updateAllocTotals();
    } else if (act === 'grid-del') {
      const tableId = el.closest('table').id;
      el.closest('tr').remove();
      if (tableId === 'g-alloc') updateAllocTotals();
    } else if (act === 'fund-colours') applyRecommendedColours();
    else if (act === 'refresh-reports') plainAction('refreshReports', el, '✓ Report tabs updated');
    else if (act === 'sample-load') plainAction('loadSampleData', el, '✓ Sample data loaded', 'Add the sample entries (IDs starting with "S-")? Your own entries are not touched.');
    else if (act === 'sample-remove') plainAction('removeSampleData', el, '✓ Sample data removed', 'Remove all sample entries (IDs starting with "S-")?');
    else if (act === 'imp-read') loadImportText($('#imp-text').value);
    else if (act === 'imp-go') {
      const I = state.importer;
      const missing = IMPORT_FIELDS[I.kind].filter(f => f[2] && !I.map[f[0]]).map(f => f[1]);
      if (missing.length) { toast('Choose a column for: ' + missing.join(', '), true); return; }
      const recs = I.rows.map(r => importRecord(I.kind, r, I.map));
      el.disabled = true;
      serverUpdate('importRecords', [I.kind, recs], '✓ Imported ' + recs.length + ' rows')
        .then(() => { state.importer = { kind: I.kind, headers: [], rows: [], map: {} }; renderImporter(); })
        .catch(err => { el.disabled = false; toast(errText(err), true); });
    } else if (act.indexOf('save-') === 0 || act === 'copy-fy') settingsAction(act, el);
  });

  document.addEventListener('keydown', e => {
    if (lockState.mode) {
      // The lock takes every key, so nothing reaches the page behind it.
      const k = /^[0-9]$/.test(e.key) ? e.key : e.key === 'Backspace' ? '⌫' : '';
      if (k) lockKey(k);
      else if (e.key === 'Escape' && lockState.mode !== 'unlock' && lockState.mode !== 'curtain') closeLock();
      if (e.key !== 'Tab') e.preventDefault();
      return;
    }
    // On a computer, type amounts straight into the keypad.
    const tag = (document.activeElement || {}).tagName || '';
    if (state.form && state.form.calc && $('#calc-value') && ['INPUT', 'TEXTAREA', 'SELECT'].indexOf(tag) < 0) {
      const map = { '*': '×', x: '×', '/': '÷', '-': '−', '+': '+', Backspace: '⌫', Delete: 'C', '=': '=', Enter: '=' };
      const k = '0123456789.'.indexOf(e.key) >= 0 && e.key.length === 1 ? e.key : map[e.key];
      if (k) { e.preventDefault(); calcKey(k); return; }
    }
    if (e.key === 'Escape' && !$('#modal').hidden) closeModal();
    // Enter / space on list rows acts like a tap.
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role="button"][data-act]')) { e.preventDefault(); e.target.click(); }
  });

  document.addEventListener('change', e => {
    const el = e.target;
    const what = el.dataset.change;
    if (state.form && (el.name === 'fromId' || el.name === 'toId')) {
      readForm();
      state.form.rec.received = '';
      transferFunds(state.form.rec);
      state.form.calc.fixed = wOf(state.form.rec.fromId).currency;
      renderForm();
      return;
    }
    if (state.form && (el.name === 'fromAccount' || el.name === 'toAccount' || el.name === 'account')) {
      // Keep the fund inside the chosen account.
      readForm();
      const r = state.form.rec;
      const side = el.name === 'fromAccount' ? 'fromFund' : el.name === 'toAccount' ? 'toFund' : 'fund';
      if (fundsIn(el.value).indexOf(r[side]) < 0) r[side] = fundsIn(el.value)[0] || '';
      // Interest on the joint account belongs to both; personal accounts to one person.
      if (el.name === 'account') r.person = /shared/i.test(el.value) ? 'Shared' : (r.person === 'Shared' ? state.M.codes[0] : r.person);
      renderForm();
      return;
    }
    if (what === 'widget-short') {
      widgetSaveLook({ short: el.checked });
      return;
    }
    if (what === 'lock-after') {
      store.set('lock', JSON.stringify(Object.assign(lockSaved(), { after: Number(el.value) })));
      toast('✓ Saved');
    } else if (el.id === 'f-month') {
      state.month = el.value;
      state.fy = E.fyOf(el.value + '-01');
      state.cat = '';
      render();
    } else if (what === 'fy') {
      state.fy = el.value;
      render();
    } else if (what === 'tax-fy') {
      state.taxFy = el.value;
      renderTaxTables();
    } else if (what === 'imp-kind') {
      const I = state.importer;
      I.kind = el.value;
      I.map = guessMap(I.kind, I.headers);
      renderImporter();
    } else if (what === 'imp-file' && el.files && el.files[0]) {
      const reader = new FileReader();
      reader.onload = () => loadImportText(reader.result);
      reader.readAsText(el.files[0]);
    } else if (what === 'imp-map') {
      state.importer.map[el.dataset.key] = el.value;
      renderImporter();
    }
  });

  document.addEventListener('input', e => {
    if (state.form && state.form.calc) {
      if (e.target.id === 'calc-rate') { state.form.calc.rate = e.target.value; calcSync(); return; }
      if (e.target.name === 'amount') state.form.calc.expr = exprOf(e.target.value); // filled in some other way
    }
    if (e.target.id === 'log-q') { state.logQ = e.target.value; state.logShow = 50; renderLogList(); return; }
    if (e.target.id === 'search') {
      state.q = e.target.value;
      $('#bills').innerHTML = billsHtml();
      $('#bills-title').textContent = state.q ? 'Search results' : monthLong(state.month) + ' bills';
    }
    if (e.target.id === 'fx-aud' || e.target.id === 'fx-myr') {
      const rate = state.M.general.exchangeRate || 0;
      const v = Number(e.target.value) || 0;
      if (e.target.id === 'fx-aud') $('#fx-myr').value = (v * rate).toFixed(2);
      else $('#fx-aud').value = rate ? (v / rate).toFixed(2) : '';
    }
    if (e.target.closest('#entry-form')) { readForm(); updatePreview(); }
    if (e.target.closest('#g-alloc')) updateAllocTotals();
  });

  document.addEventListener('submit', e => {
    if (e.target.id === 'entry-form') {
      e.preventDefault();
      saveForm(false);
    }
  });

  /** The transfer form, starting from one account. With fewer than two accounts (no bank accounts set up yet), adds one first. */
  function walletTransferForm(fromId) {
    if (state.M.wallets.filter(w => !w.closed).length < 2) {
      toast('Add at least two accounts first.', true);
      openForm('wallets');
    } else openForm('walletTransfers', newRecord('walletTransfers', { fromId }), { isNew: true });
  }

  function settleUp() {
    const S = state.M.split;
    openForm('paybacks', { date: state.M.today, from: S.debtor, to: S.creditor, amount: E.round2(S.amount), note: 'Paid back' }, { isNew: true });
  }

  /** Forms a link (or a tapped notification) asks for: ?add=pay&person=…&date=…&days=…, ?add=interest, ?settle=1. */
  function openFromLink(P) {
    if (P.add === 'pay') {
      const rec = newRecord('income', { person: P.person, date: /^\d{4}-\d{2}-\d{2}$/.test(P.date || '') ? P.date : '' });
      if (P.days) rec.days = Number(P.days);
      openForm('income', rec, { isNew: true });
    } else if (P.add === 'interest') {
      openForm('interest', newRecord('interest'), { isNew: true });
    } else if (P.settle && state.M.split.amount >= 0.01) {
      settleUp();
    }
  }

  /** A notification was tapped while the app was already open (the service worker passes its link on). */
  window.__trackerOpen = url => {
    const P = {};
    new URL(url, location.href).searchParams.forEach((v, k) => { P[k] = v; });
    if (P.page && VIEWS.some(v => v[0] === P.page)) state.view = P.page;
    if (state.form) closeModal();
    render();
    openFromLink(P);
  };

  // ---------- start ----------

  if (lockSaved() && lockExpired()) openLock('unlock'); // before anything is drawn

  if (BOOT.error || !BOOT.data) {
    $view.innerHTML = `<section class="card">${empty('🔌', `<strong>Can’t load the tracker</strong><br>${esc(BOOT.error || 'No data.')}`)}
      <p class="muted">If you just installed it, open the Google Sheet, go to Extensions ▸ Apps Script, open Code.gs, choose <strong>setup</strong> and press Run. If someone shared this with you, ask them to share the Google Sheet with your Google account as an editor.</p></section>`;
  } else {
    const P = window.__PARAMS__ || {};
    if (P.page && VIEWS.some(v => v[0] === P.page)) state.view = P.page;
    try {
      recompute();
      render();
    } catch (err) {
      $view.innerHTML = `<section class="card"><p><strong>The app couldn’t start.</strong> Please send this to the developer:</p>
        <p class="muted small">${esc(err && err.stack || err)}</p><button class="btn primary" onclick="location.reload()">Try again</button></section>`;
      throw err;
    }
    openFromLink(P);
    // The iPhone app opens from the copy kept on the phone: check it's still the latest.
    if (window.__PWA__) setTimeout(() => (BOOT.unsaved || !('viewer' in BOOT.data) ? reload(true) : checkForUpdates()), 200);
  }
})();
