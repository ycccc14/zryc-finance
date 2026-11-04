/**
 * Calculation engine. Every number the tracker shows is worked out here.
 *
 * This is plain JavaScript with no Apps Script services, so the same code runs on the
 * server (for the Report tabs) and in the browser (Index.html injects this function's
 * source). Usage: const model = TrackerEngine().compute(data, { today: '2026-10-29' }).
 *
 * `data` is what getAppData() returns under .data:
 *   { settings: { general, people, funds, allocations, categories, taxYears, brackets, withholding },
 *     income: [...], expenses: [...], adjustments: [...], wallets: [...], walletChecks: [...], walletTransfers: [...] }
 */
function TrackerEngine() {
  'use strict';

  const RESIDENT = 'Resident';
  const FOREIGN = 'Foreign resident';
  const WHM = 'Working holiday maker';
  const ALL = 'All';
  const SHARED = 'Shared';

  // Wallet transfer fees are saved as expenses in this category, which is always there.
  const FEE_CATEGORY = 'Transfer fee';

  // Kinds of real-money account. debt: the balance is what's owed, so it counts against the total.
  const WALLET_TYPES = {
    bank: { emoji: '🏦', label: 'Bank account', hint: 'Savings or everyday account' },
    ewallet: { emoji: '📱', label: 'E-wallet', hint: 'Touch ’n Go, GrabPay, PayPal, Wise' },
    cash: { emoji: '💵', label: 'Cash', hint: 'Money in your purse' },
    savings: { emoji: '🐷', label: 'Savings & investments', hint: 'Term deposit, ASB, EPF, shares' },
    prepaid: { emoji: '🎫', label: 'Prepaid card', hint: 'Opal, Touch ’n Go card, gift cards' },
    card: { emoji: '💳', label: 'Credit card', hint: 'Shows how much you owe', debt: true },
    paylater: { emoji: '🧾', label: 'PayLater', hint: 'Afterpay, Atome, SPayLater', debt: true },
    lent: { emoji: '🤝', label: 'Money lent', hint: 'Someone owes you' },
    borrowed: { emoji: '🙏', label: 'Money borrowed', hint: 'You owe someone', debt: true },
  };

  // ---------- value helpers ----------

  const isBlank = v => v === '' || v === null || v === undefined;

  function num(v) {
    if (isBlank(v)) return 0;
    if (typeof v === 'number') return isFinite(v) ? v : 0;
    const n = Number(String(v).replace(/[$,\s]/g, ''));
    return isFinite(n) ? n : 0;
  }

  /** Accepts 0.25, 25 or "25%" and returns 0.25. */
  function pct(v) {
    if (typeof v === 'string' && v.indexOf('%') >= 0) return num(v.replace('%', '')) / 100;
    const n = num(v);
    return n > 1 ? n / 100 : n;
  }

  const yes = v => v === true || /^(y|yes|true)$/i.test(String(v).trim());

  /** Round to cents, halves away from zero. */
  const round2 = n => Math.sign(n) * Math.round(Math.abs(n) * 100 + 1e-7) / 100;

  const sum = list => list.reduce((s, x) => s + x, 0);
  const byDate = (a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0);

  // ---------- date helpers (dates are 'yyyy-mm-dd' strings) ----------

  const pad = n => (n < 10 ? '0' : '') + n;
  const validDate = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
  const toUTC = s => new Date(Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10)));
  const ymd = d => d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate());

  function todayISO() {
    const d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function addDays(s, n) {
    const d = toUTC(s);
    d.setUTCDate(d.getUTCDate() + n);
    return ymd(d);
  }

  const daysBetween = (a, b) => Math.round((toUTC(b) - toUTC(a)) / 86400000);
  const monthOf = s => s.slice(0, 7);

  /** Australian financial year: 1 July – 30 June. '2026-06-04' → 'FY2025-26'. */
  function fyOf(s) {
    const y = +s.slice(0, 4);
    const start = +s.slice(5, 7) >= 7 ? y : y - 1;
    return 'FY' + start + '-' + pad((start + 1) % 100);
  }

  const fyStartDate = fy => fy.slice(2, 6) + '-07-01';
  const fyEndDate = fy => (+fy.slice(2, 6) + 1) + '-06-30';

  function addMonths(ym, k) {
    let y = +ym.slice(0, 4);
    let m = +ym.slice(5, 7) - 1 + k;
    y += Math.floor(m / 12);
    m = ((m % 12) + 12) % 12;
    return y + '-' + pad(m + 1);
  }

  function monthRange(from, to) {
    const out = [];
    for (let m = from; m <= to; m = addMonths(m, 1)) out.push(m);
    return out;
  }

  /** The 12 months of a financial year, Jul → Jun. */
  const fyMonths = fy => monthRange(fy.slice(2, 6) + '-07', (+fy.slice(2, 6) + 1) + '-06');

  /** Monday of the week containing the date. */
  function weekStart(s) {
    const d = toUTC(s);
    d.setUTCDate(d.getUTCDate() - (d.getUTCDay() + 6) % 7);
    return ymd(d);
  }

  // ---------- settings ----------

  const normScale = v => String(v).trim().toUpperCase();

  /** '2025-26' or 'FY2025-26' → 'FY2025-26'. */
  function normFy(v) {
    const t = String(v === null || v === undefined ? '' : v).trim().replace(/^fy\s*/i, '');
    return /^\d{4}-\d{2}$/.test(t) ? 'FY' + t : String(v === null || v === undefined ? '' : v).trim();
  }

  /** 'FY2025-26' → '2025-26', for display. */
  const fyName = fy => String(fy || '').replace(/^FY/, '');

  function settingsOf(raw) {
    raw = raw || {};
    const g = raw.general || {};
    const people = (raw.people || []).filter(p => !isBlank(p.code)).map(p => ({
      code: String(p.code).trim(),
      name: isBlank(p.name) ? String(p.code).trim() : String(p.name).trim(),
      rate: num(p.rate),
      tft: isBlank(p.tft) ? true : yes(p.tft),
      residency: isBlank(p.residency) ? RESIDENT : String(p.residency).trim(),
      hoursPerDay: isBlank(p.hoursPerDay) ? 8 : num(p.hoursPerDay),
      medicare: isBlank(p.medicare) ? true : yes(p.medicare),
      scale: isBlank(p.scale) ? 'Auto' : String(p.scale).trim(),
      colour: p.colour || '#888888',
      usualDays: isBlank(p.usualDays) ? 3 : num(p.usualDays),
    }));
    const funds = (raw.funds || []).filter(f => !isBlank(f.name)).map(f => ({
      name: String(f.name).trim(),
      account: isBlank(f.account) ? 'Unassigned' : String(f.account).trim(),
      colour: f.colour || '#888888',
      icon: isBlank(f.icon) ? '' : String(f.icon).trim(),
    }));
    const allocations = (raw.allocations || []).filter(a => validDate(a.from)).map(a => {
      const p = {};
      funds.forEach(f => { p[f.name] = pct(a.pct && a.pct[f.name]); });
      return { from: a.from, pct: p, total: sum(funds.map(f => p[f.name])) };
    }).sort((a, b) => (a.from < b.from ? -1 : 1));
    const categories = (raw.categories || []).filter(c => !isBlank(c.name)).map(c => ({
      name: String(c.name).trim(),
      fund: String(c.fund || '').trim(),
      icon: isBlank(c.icon) ? '' : String(c.icon).trim(),
    }));
    if (funds.length && !categories.some(c => c.name === FEE_CATEGORY)) {
      categories.push({ name: FEE_CATEGORY, fund: (funds.find(f => f.name === 'Living Expenses') || funds[0]).name, icon: '💱' });
    }
    const taxYears = {};
    (raw.taxYears || []).filter(t => !isBlank(t.fy)).forEach(t => {
      taxYears[normFy(t.fy)] = {
        superRate: pct(t.superRate),
        litoMax: num(t.litoMax), litoT1: num(t.litoT1), litoR1: pct(t.litoR1),
        litoT2: num(t.litoT2), litoR2: pct(t.litoR2),
        medicareRate: pct(t.medicareRate), medicareThreshold: num(t.medicareThreshold),
        medicareShade: pct(t.medicareShade),
      };
    });
    const brackets = {};
    (raw.brackets || []).filter(b => !isBlank(b.fy)).forEach(b => {
      const k = normFy(b.fy) + '|' + String(b.residency).trim();
      (brackets[k] = brackets[k] || []).push({ over: num(b.over), rate: pct(b.rate) });
    });
    Object.keys(brackets).forEach(k => brackets[k].sort((a, b) => a.over - b.over));
    const withholding = {};
    (raw.withholding || []).filter(w => !isBlank(w.fy)).forEach(w => {
      const k = normFy(w.fy) + '|' + normScale(w.scale);
      (withholding[k] = withholding[k] || []).push({
        lessThan: isBlank(w.lessThan) ? Infinity : num(w.lessThan), a: num(w.a), b: num(w.b),
      });
    });
    Object.keys(withholding).forEach(k => withholding[k].sort((a, b) => a.lessThan - b.lessThan));
    return {
      general: {
        exchangeRate: num(g.exchangeRate),
        startDate: validDate(g.startDate) ? g.startDate : '2000-01-01',
        sharedSplit: isBlank(g.sharedSplit) ? 0.5 : pct(g.sharedSplit),
      },
      people, funds, allocations, categories, taxYears, brackets, withholding,
    };
  }

  /** The ATO withholding scale implied by a person's settings. */
  function autoScale(p) {
    if (p.residency === FOREIGN) return '3';
    if (p.residency === WHM) return 'WHM';
    return p.tft ? '2' : '1';
  }

  const scaleFor = p => (p.scale === 'Auto' ? autoScale(p) : normScale(p.scale));

  // ---------- tax ----------

  /**
   * ATO Schedule 1 weekly withholding: x = whole dollars of weekly earnings + 99 cents,
   * y = a·x − b with the coefficients of the first row where x < "less than",
   * rounded to the nearest dollar (50 cents rounds up). Returns null when the
   * financial year / scale has no coefficients.
   */
  function withhold(gross, fy, scale, S) {
    const rows = S.withholding[fy + '|' + scale];
    if (!rows || !rows.length) return null;
    const x = Math.floor(gross + 1e-9) + 0.99;
    const row = rows.find(r => x < r.lessThan) || rows[rows.length - 1];
    return Math.max(0, Math.round(row.a * x - row.b));
  }

  /** Tax payable on a year's income: brackets − Low Income Tax Offset + Medicare levy. */
  function annualTax(income, fy, person, S, warn) {
    const ty = S.taxYears[fy];
    const rows = S.brackets[fy + '|' + person.residency];
    if (!ty || !rows) {
      warn('Missing tax-year settings or ' + person.residency + ' tax brackets for ' + fy + ', so its end-of-year estimate is not shown.');
      return null;
    }
    const taxable = Math.floor(income + 1e-9);
    let incomeTax = 0;
    rows.forEach((r, i) => {
      const top = i + 1 < rows.length ? rows[i + 1].over : Infinity;
      if (taxable > r.over) incomeTax += (Math.min(taxable, top) - r.over) * r.rate;
    });
    let lito = 0;
    if (person.residency === RESIDENT) {
      if (taxable <= ty.litoT1) lito = ty.litoMax;
      else if (taxable <= ty.litoT2) lito = ty.litoMax - (taxable - ty.litoT1) * ty.litoR1;
      else lito = ty.litoMax - (ty.litoT2 - ty.litoT1) * ty.litoR1 - (taxable - ty.litoT2) * ty.litoR2;
      lito = Math.max(0, Math.min(lito, incomeTax)); // non-refundable
    }
    let medicare = 0;
    if (person.residency === RESIDENT && person.medicare && taxable > ty.medicareThreshold) {
      medicare = Math.min(taxable * ty.medicareRate, (taxable - ty.medicareThreshold) * ty.medicareShade);
    }
    return {
      taxable,
      incomeTax: round2(incomeTax),
      lito: round2(lito),
      medicare: round2(medicare),
      total: round2(incomeTax - lito + medicare),
    };
  }

  /**
   * Who owes whom, like Tricount. An expense paid by one person makes the other owe their
   * share (all of it if it was entirely theirs). A payback from A to B means B owes A more
   * (or A owes B less). `balance` = what the 2nd person owes the 1st (negative: the reverse).
   */
  function splitOf(expenses, paybacks, codes) {
    const a = codes[0];
    const b = codes[1];
    const events = [];
    if (codes.length >= 2) {
      expenses.forEach(r => {
        if (!r.paidBy) return;
        const other = r.paidBy === a ? b : a;
        const owed = r.shares[other] || 0;
        if (owed > 0.004) {
          events.push({ kind: 'expense', id: r.id, date: r.date, payer: r.paidBy, other, amount: r.amount, owed, title: r.description || r.category, category: r.category });
        }
      });
      paybacks.forEach(r => events.push({ kind: 'payback', id: r.id, date: r.date, from: r.from, to: r.to, amount: r.amount, note: r.note }));
    }
    events.sort(byDate);
    let balance = 0;
    let openFrom = 0;
    events.forEach((e, i) => {
      if (e.kind === 'expense') balance += e.payer === a ? e.owed : -e.owed;
      else balance += e.from === a ? e.amount : -e.amount;
      balance = round2(balance);
      e.balance = balance;
      if (Math.abs(balance) < 0.005) openFrom = i + 1; // everything up to here was settled
    });
    const debtor = balance > 0.004 ? b : balance < -0.004 ? a : '';
    return { balance, amount: Math.abs(balance), debtor, creditor: debtor ? (debtor === a ? b : a) : '', events, openFrom };
  }

  function allocationFor(date, versions) {
    let v = versions[0] || null;
    versions.forEach(a => { if (a.from <= date) v = a; });
    return v;
  }

  /**
   * What a transfer does. `rate` is always MYR per 1 AUD, whichever way the money goes. The fee is
   * in the sending currency: added on top of the amount, or (feeIn) taken out of it before converting.
   * An amount typed into "received" replaces the worked-out one.
   */
  function walletTransfer(fromCur, toCur, r, defaultRate) {
    const cross = fromCur !== toCur;
    const amount = round2(num(r.amount));
    const fee = round2(num(r.fee));
    const feeIn = yes(r.feeIn);
    const rate = cross ? num(r.rate) || defaultRate || 0 : 0;
    const converted = round2(feeIn ? amount - fee : amount);
    const left = round2(feeIn ? amount : amount + fee);
    const worked = !cross ? converted : !rate ? 0 : fromCur === 'AUD' ? converted * rate : converted / rate;
    const received = round2(!cross || isBlank(r.received) ? worked : num(r.received));
    const realRate = !cross || !left || !received ? 0 : fromCur === 'AUD' ? received / left : left / received;
    const fx = rate || defaultRate || 0;
    return { cross, amount, fee, feeIn, rate, converted, left, received, realRate, feeAUD: round2(fromCur === 'MYR' ? (fx ? fee / fx : 0) : fee) };
  }

  /** One account in one month: money in, money out, and its balance at the end of each day (as shown on the card). */
  function walletMonth(w, ym, today) {
    const changes = w.events.filter(e => e.month === ym).map(e => e.change);
    const daysInMonth = new Date(Date.UTC(+ym.slice(0, 4), +ym.slice(5, 7), 0)).getUTCDate();
    const lastDay = ym === monthOf(today) ? +today.slice(8, 10) : ym > monthOf(today) ? 0 : daysInMonth;
    const days = [];
    for (let d = 1; d <= lastDay; d++) {
      const date = ym + '-' + pad(d);
      const past = w.events.filter(e => e.date <= date);
      const value = past.length ? past[past.length - 1].balance : w.date && w.date <= date ? w.start : null;
      days.push({ date, balance: value === null ? null : (w.debt ? -value : value) });
    }
    return { in: round2(sum(changes.filter(c => c > 0))), out: round2(-sum(changes.filter(c => c < 0))), days };
  }

  // ---------- main ----------

  function compute(data, opts) {
    data = data || {};
    opts = opts || {};
    const today = opts.today || todayISO();
    const S = settingsOf(data.settings);
    const warnings = [];
    const warn = msg => { if (warnings.indexOf(msg) < 0) warnings.push(msg); };

    const codes = S.people.map(p => p.code);
    const keys = codes.concat(ALL);
    const byCode = {};
    S.people.forEach(p => { byCode[p.code] = p; });
    const fundNames = S.funds.map(f => f.name);
    const fundAccount = {};
    S.funds.forEach(f => { fundAccount[f.name] = f.account; });
    const catFund = {};
    S.categories.forEach(c => { catFund[c.name] = c.fund; });

    if (codes.length !== 2) warn('The tracker expects exactly two people in Settings → People (found ' + codes.length + ').');
    if (!S.allocations.length) warn('No budget allocation is set. Add one in Settings → Allocation.');
    S.allocations.forEach(a => {
      if (Math.abs(a.total - 1) > 0.00005) {
        warn('The budget allocation from ' + a.from + ' adds up to ' + (a.total * 100).toFixed(2) + '%, not 100%.');
      }
    });
    S.categories.forEach(c => {
      if (fundNames.indexOf(c.fund) < 0) warn('Category "' + c.name + '" is mapped to "' + c.fund + '", which is not a fund.');
    });

    // --- income ---
    const income = (data.income || []).map(r => {
      if (!validDate(r.date)) { warn('A pay entry has no valid date and was skipped.'); return null; }
      const p = byCode[r.person];
      if (!p) { warn('Pay on ' + r.date + ' is for unknown person "' + r.person + '" and was skipped.'); return null; }
      const fy = fyOf(r.date);
      const days = num(r.days);
      const hoursPerDay = isBlank(r.hoursPerDay) ? p.hoursPerDay : num(r.hoursPerDay);
      const extraHours = num(r.extraHours);
      const hours = days * hoursPerDay + extraHours;
      const rate = isBlank(r.rate) ? p.rate : num(r.rate);
      const gross = round2(hours * rate);
      const scale = isBlank(r.scale) || r.scale === 'Auto' ? scaleFor(p) : normScale(r.scale);
      let calcTax = withhold(gross, fy, scale, S);
      if (calcTax === null) {
        warn('No withholding coefficients for ' + fy + ' scale ' + scale + ', so tax shows as $0. Add them in Settings → Tax tables.');
        calcTax = 0;
      }
      const hasActual = !isBlank(r.actualTax);
      const actualTax = hasActual ? round2(num(r.actualTax)) : null;
      const tax = hasActual ? actualTax : calcTax;
      const ty = S.taxYears[fy];
      if (!ty) warn('No tax-year settings for ' + fy + ', so super shows as $0. Add a row in Settings → Tax tables.');
      const superRate = ty ? ty.superRate : 0;
      const otherNet = round2(num(r.otherNet)); // other income (gift, refund, side job…): added to net, no super
      const intoFund = fundNames.indexOf(String(r.intoFund || '').trim()) >= 0 ? String(r.intoFund).trim() : '';
      const otherTaxable = otherNet && yes(r.otherTaxable) ? otherNet : 0;
      const net = round2(gross - tax + otherNet);
      const version = allocationFor(r.date, S.allocations);
      const alloc = {};
      // Pay is split by the budget %; other income too, unless it goes into one chosen fund.
      const splitPart = intoFund ? net - otherNet : net;
      fundNames.forEach(f => { alloc[f] = version ? splitPart * (version.pct[f] || 0) : 0; });
      if (intoFund) alloc[intoFund] += otherNet;
      return {
        id: r.id, date: r.date, person: p.code, fy, month: monthOf(r.date), week: weekStart(r.date),
        days, hoursPerDay, extraHours, hours, rate, scale, gross, calcTax, actualTax, tax,
        taxDiff: hasActual ? round2(actualTax - calcTax) : 0,
        otherNet, intoFund, otherTaxable, net, superRate, superAmt: round2(gross * superRate), alloc, note: r.note || '',
        transferred: validDate(String(r.transferred || '')) ? r.transferred : '',
      };
    }).filter(Boolean).sort(byDate);

    // --- expenses ---
    const expenses = (data.expenses || []).map(r => {
      if (!validDate(r.date)) { warn('An expense has no valid date and was skipped.'); return null; }
      const amount = round2(num(r.amount));
      const category = String(r.category || '').trim();
      const chosen = String(r.fund || '').trim();
      const fund = fundNames.indexOf(chosen) >= 0 ? chosen : (catFund[category] || '');
      if (!fund) warn('Expense category "' + category + '" has no fund, so it is left out of fund balances. Map it in Settings → Categories.');
      const shares = {};
      let splitPct = null;
      if (r.person === SHARED && codes.length >= 2) {
        splitPct = isBlank(r.splitPct) ? S.general.sharedSplit : pct(r.splitPct);
        shares[codes[0]] = round2(amount * splitPct); // whole cents: an odd cent goes to the first person
        shares[codes[1]] = round2(amount - shares[codes[0]]);
      } else if (byCode[r.person]) {
        shares[r.person] = amount;
      } else {
        warn('An expense on ' + r.date + ' has unknown person "' + r.person + '" and was skipped.');
        return null;
      }
      return {
        id: r.id, date: r.date, month: monthOf(r.date), fy: fyOf(r.date), person: r.person,
        amount, category, description: r.description || '', splitPct, fund, shares,
        paidBy: byCode[r.paidBy] ? r.paidBy : '',
      };
    }).filter(Boolean).sort(byDate);

    // --- adjustments ---
    const adjustments = (data.adjustments || []).map(r => {
      if (!validDate(r.date)) { warn('An adjustment has no valid date and was skipped.'); return null; }
      if (!byCode[r.person]) { warn('An adjustment on ' + r.date + ' has unknown person "' + r.person + '" and was skipped.'); return null; }
      const fromFund = String(r.fromFund || '').trim();
      const toFund = String(r.toFund || '').trim();
      if (!fromFund && !toFund) { warn('An adjustment on ' + r.date + ' has no fund and was skipped.'); return null; }
      [fromFund, toFund].forEach(f => {
        if (f && fundNames.indexOf(f) < 0) warn('An adjustment on ' + r.date + ' uses unknown fund "' + f + '".');
      });
      const fromAccount = fundAccount[fromFund] || '';
      const toAccount = fundAccount[toFund] || '';
      return {
        id: r.id, date: r.date, month: monthOf(r.date), person: r.person, fromFund, toFund, fromAccount, toAccount,
        type: fromFund && toFund ? 'Transfer' : toFund ? 'Add' : 'Deduct',
        betweenAccounts: !!(fromAccount && toAccount && fromAccount !== toAccount),
        amount: round2(num(r.amount)), note: r.note || '',
      };
    }).filter(Boolean).sort(byDate);

    // --- bank interest (adds to a fund, and counts as taxable income) ---
    const interest = (data.interest || []).map(r => {
      if (!validDate(r.date)) { warn('An interest entry has no valid date and was skipped.'); return null; }
      const fund = String(r.fund || '').trim();
      if (!fundAccount[fund]) { warn('Interest on ' + r.date + ' uses unknown fund "' + fund + '" and was skipped.'); return null; }
      const amount = round2(num(r.amount));
      const shares = {};
      if (r.person === SHARED && codes.length >= 2) {
        shares[codes[0]] = round2(amount * S.general.sharedSplit);
        shares[codes[1]] = round2(amount - shares[codes[0]]);
      } else if (byCode[r.person]) {
        shares[r.person] = amount;
      } else {
        warn('Interest on ' + r.date + ' has unknown person "' + r.person + '" and was skipped.');
        return null;
      }
      return {
        id: r.id, date: r.date, month: monthOf(r.date), fy: fyOf(r.date), person: r.person,
        fund, account: fundAccount[fund], amount, shares, note: r.note || '',
      };
    }).filter(Boolean).sort(byDate);

    // --- paybacks: money one of us gave the other (paying back, or lending) ---
    const paybacks = (data.paybacks || []).map(r => {
      if (!validDate(r.date)) { warn('A payback has no valid date and was skipped.'); return null; }
      if (!byCode[r.from] || !byCode[r.to] || r.from === r.to) { warn('A payback on ' + r.date + ' needs two different people and was skipped.'); return null; }
      return { id: r.id, date: r.date, month: monthOf(r.date), from: r.from, to: r.to, amount: round2(num(r.amount)), note: r.note || '' };
    }).filter(Boolean).sort(byDate);
    const split = splitOf(expenses, paybacks, codes);

    // --- weekly / monthly / FY income totals ---
    function newTotals() {
      const t = { count: 0, hours: 0, gross: 0, calcTax: 0, tax: 0, taxDiff: 0, net: 0, superAmt: 0, otherNet: 0, otherTaxable: 0, alloc: {} };
      fundNames.forEach(f => { t.alloc[f] = 0; });
      return t;
    }
    function addTotals(t, r) {
      t.count++;
      ['hours', 'gross', 'calcTax', 'tax', 'taxDiff', 'net', 'superAmt', 'otherNet', 'otherTaxable'].forEach(k => { t[k] += r[k]; });
      fundNames.forEach(f => { t.alloc[f] += r.alloc[f]; });
    }
    function bucket(map, key, extra) {
      if (!map[key]) {
        map[key] = Object.assign({ by: {}, spend: {}, interest: {} }, extra);
        keys.forEach(k => { map[key].by[k] = newTotals(); map[key].spend[k] = 0; map[key].interest[k] = 0; });
      }
      return map[key];
    }
    const weekly = {};
    const monthly = {};
    const fyTotals = {};
    income.forEach(r => {
      [bucket(weekly, r.week, { week: r.week }), bucket(monthly, r.month, { month: r.month, fy: r.fy }), bucket(fyTotals, r.fy, { fy: r.fy })]
        .forEach(b => { addTotals(b.by[r.person], r); addTotals(b.by[ALL], r); });
    });

    // --- spending by month and category ---
    const catByMonth = {};
    keys.forEach(k => { catByMonth[k] = {}; });
    expenses.forEach(r => {
      const m = bucket(monthly, r.month, { month: r.month, fy: r.fy });
      const f = bucket(fyTotals, r.fy, { fy: r.fy });
      Object.keys(r.shares).forEach(c => {
        [c, ALL].forEach(k => {
          m.spend[k] += r.shares[c];
          f.spend[k] += r.shares[c];
          const cm = catByMonth[k][r.month] = catByMonth[k][r.month] || {};
          cm[r.category] = (cm[r.category] || 0) + r.shares[c];
        });
      });
    });

    interest.forEach(r => {
      [bucket(monthly, r.month, { month: r.month, fy: r.fy }), bucket(fyTotals, r.fy, { fy: r.fy })].forEach(b => {
        Object.keys(r.shares).forEach(c => { b.interest[c] += r.shares[c]; b.interest[ALL] += r.shares[c]; });
      });
    });

    // --- fund balances since the start date ---
    const start = S.general.startDate;
    let last = today;
    [income, expenses, adjustments, interest].forEach(list => list.forEach(r => { if (r.date > last) last = r.date; }));
    const balMonths = start <= last ? monthRange(monthOf(start), monthOf(last)) : [];
    const balances = {};
    keys.forEach(k => {
      const funds = {};
      fundNames.forEach(f => {
        const monthlySpend = {};
        balMonths.forEach(m => { monthlySpend[m] = 0; });
        funds[f] = { allocated: 0, monthly: monthlySpend, expenses: 0, adjIn: 0, adjOut: 0, interest: 0 };
      });
      balances[k] = { months: balMonths, funds, adjustments: [] };
    });
    income.forEach(r => {
      if (r.date < start) return;
      [r.person, ALL].forEach(k => fundNames.forEach(f => { balances[k].funds[f].allocated += r.alloc[f]; }));
    });
    expenses.forEach(r => {
      if (r.date < start || !balances[ALL].funds[r.fund]) return;
      Object.keys(r.shares).forEach(c => {
        [c, ALL].forEach(k => {
          const F = balances[k].funds[r.fund];
          F.monthly[r.month] += r.shares[c];
          F.expenses += r.shares[c];
        });
      });
    });
    adjustments.forEach(r => {
      if (r.date < start) return;
      [r.person, ALL].forEach(k => {
        const B = balances[k];
        if (B.funds[r.fromFund]) B.funds[r.fromFund].adjOut += r.amount;
        if (B.funds[r.toFund]) B.funds[r.toFund].adjIn += r.amount;
        B.adjustments.push(r);
      });
    });
    interest.forEach(r => {
      if (r.date < start) return;
      Object.keys(r.shares).forEach(c => [c, ALL].forEach(k => { balances[k].funds[r.fund].interest += r.shares[c]; }));
    });
    keys.forEach(k => {
      const B = balances[k];
      const total = { allocated: 0, expenses: 0, adjustments: 0, interest: 0, balance: 0, available: 0, monthly: {} };
      balMonths.forEach(m => { total.monthly[m] = 0; });
      const byAccount = {};
      fundNames.forEach(f => {
        const F = B.funds[f];
        F.adjustments = F.adjIn - F.adjOut;
        F.available = F.allocated + F.adjustments + F.interest;
        F.balance = F.available - F.expenses;
        F.usedPct = F.available > 0 ? F.expenses / F.available : (F.expenses > 0 ? 1 : 0);
        total.allocated += F.allocated;
        total.expenses += F.expenses;
        total.adjustments += F.adjustments;
        total.interest += F.interest;
        total.available += F.available;
        total.balance += F.balance;
        balMonths.forEach(m => { total.monthly[m] += F.monthly[m]; });
        byAccount[fundAccount[f]] = (byAccount[fundAccount[f]] || 0) + F.balance;
      });
      total.usedPct = total.available > 0 ? total.expenses / total.available : 0;
      total.balanceMYR = total.balance * S.general.exchangeRate;
      B.total = total;
      B.byAccount = byAccount;
    });

    // --- bank accounts since the start date ---
    // Each account holds the funds mapped to it, so its balance always equals the sum of
    // those funds' balances. Moves between funds in the same account don't touch the account.
    const accountNames = S.funds.map(f => f.account).filter((a, i, arr) => arr.indexOf(a) === i);
    const FLOWS = ['allocated', 'interest', 'spent', 'transferIn', 'transferOut', 'added', 'deducted'];
    const ledgers = {};
    keys.forEach(k => {
      ledgers[k] = {};
      accountNames.forEach(a => {
        const months = {};
        balMonths.forEach(m => {
          months[m] = {};
          FLOWS.forEach(x => { months[m][x] = 0; });
        });
        ledgers[k][a] = { months, funds: fundNames.filter(f => fundAccount[f] === a) };
        FLOWS.forEach(x => { ledgers[k][a][x] = 0; });
      });
    });
    const bump = (k, account, month, flow, v) => {
      const L = ledgers[k][account];
      if (!L) return;
      L[flow] += v;
      if (L.months[month]) L.months[month][flow] += v;
    };
    income.forEach(r => {
      if (r.date < start) return;
      [r.person, ALL].forEach(k => fundNames.forEach(f => bump(k, fundAccount[f], r.month, 'allocated', r.alloc[f])));
    });
    expenses.forEach(r => {
      if (r.date < start || !fundAccount[r.fund]) return;
      Object.keys(r.shares).forEach(c => [c, ALL].forEach(k => bump(k, fundAccount[r.fund], r.month, 'spent', r.shares[c])));
    });
    adjustments.forEach(r => {
      if (r.date < start || (r.fromAccount && r.fromAccount === r.toAccount)) return;
      [r.person, ALL].forEach(k => {
        if (r.fromAccount) bump(k, r.fromAccount, r.month, r.toAccount ? 'transferOut' : 'deducted', r.amount);
        if (r.toAccount) bump(k, r.toAccount, r.month, r.fromAccount ? 'transferIn' : 'added', r.amount);
      });
    });
    interest.forEach(r => {
      if (r.date < start) return;
      Object.keys(r.shares).forEach(c => [c, ALL].forEach(k => bump(k, r.account, r.month, 'interest', r.shares[c])));
    });
    const flowIn = x => x.allocated + x.interest + x.transferIn + x.added;
    const flowOut = x => x.spent + x.transferOut + x.deducted;
    keys.forEach(k => accountNames.forEach(a => {
      const L = ledgers[k][a];
      let running = 0;
      balMonths.forEach(m => {
        const x = L.months[m];
        x.in = flowIn(x);
        x.out = flowOut(x);
        running += x.in - x.out;
        x.balance = running;
      });
      L.in = flowIn(L);
      L.out = flowOut(L);
      L.balance = L.in - L.out;
      L.balanceMYR = L.balance * S.general.exchangeRate;
    }));

    // --- wallet: the real money in each account, in that account's own currency ---
    // `data.viewer` is whoever's device this is: the server only sends that person's accounts and shared ones.
    // Their bank accounts above come first, with the balances of the Accounts page; the rest are balances you record.
    const viewer = byCode[data.viewer] ? data.viewer : '';
    const walletById = {};
    const toWallet = r => {
      const type = WALLET_TYPES[r.type] ? r.type : 'bank';
      const currency = r.currency === 'MYR' ? 'MYR' : 'AUD';
      const debt = !!WALLET_TYPES[type].debt;
      const opening = round2(num(r.opening));
      const w = {
        id: String(r.id), date: validDate(r.date) ? r.date : '', name: String(r.name || '').trim(), currency, country: currency === 'MYR' ? 'MY' : 'AU',
        type, debt, owner: byCode[r.owner] ? r.owner : SHARED, number: String(r.number || ''), opening, start: debt ? -opening : opening,
        colour: r.colour || '', badge: String(r.badge || ''), logo: String(r.logo || ''), note: r.note || '', closed: yes(r.closed), linked: r.linked || '',
      };
      walletById[w.id] = w;
      return w;
    };
    const savedWallets = data.wallets || [];
    const linkedWallets = !viewer ? [] : accountNames.map(a => {
      const owner = /shared/i.test(a) ? SHARED : viewer;
      const id = 'link:' + owner + ':' + a;
      const look = savedWallets.find(r => String(r.id) === id) || {}; // the bank, colour and digits chosen for it
      return toWallet(Object.assign({ name: a }, look, { id, date: start, currency: 'AUD', type: 'bank', owner, opening: 0, closed: '', linked: a }));
    });
    const wallets = linkedWallets.concat(savedWallets.filter(r => String(r.id).indexOf('link:') !== 0).map(toWallet));
    const walletChecks = (data.walletChecks || []).map(r => {
      if (!validDate(r.date)) { warn('A wallet balance has no valid date and was skipped.'); return null; }
      if (!walletById[r.walletId]) { warn('A wallet balance on ' + r.date + ' is for an account that no longer exists and was skipped.'); return null; }
      return { id: r.id, date: r.date, month: monthOf(r.date), at: num(r.at), walletId: String(r.walletId), amount: round2(num(r.amount)), note: r.note || '' };
    }).filter(Boolean);
    const walletTransfers = (data.walletTransfers || []).map(r => {
      if (!validDate(r.date)) { warn('A wallet transfer has no valid date and was skipped.'); return null; }
      // An account of the other person's arrives with no ID: all that's known is its currency.
      const side = (id, name, cur) => walletById[id] || (id ? null : { id: '', name: name || 'Private account', currency: cur === 'MYR' ? 'MYR' : 'AUD', owner: '' });
      const from = side(r.fromId, r.fromName, r.fromCur);
      const to = side(r.toId, r.toName, r.toCur);
      if (!from || !to || from === to) { warn('A wallet transfer on ' + r.date + ' uses an account that no longer exists and was skipped.'); return null; }
      return Object.assign(walletTransfer(from.currency, to.currency, r, S.general.exchangeRate), {
        id: r.id, date: r.date, month: monthOf(r.date), at: num(r.at), from, to, note: r.note || '',
      });
    }).filter(Boolean).sort(byDate);
    // Same day: in the order they were recorded. Rows with no time (typed into the Sheet): transfers first.
    const eventOrder = (a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.at - b.at || a.rank - b.rank);
    /** A bank account's records: everything that makes up its Accounts page balance, for that person (or both, if shared). */
    function ledgerEvents(w) {
      const k = w.owner === SHARED ? ALL : w.owner;
      const here = f => fundAccount[f] === w.linked;
      const events = [];
      const add = (kind, r, title, note, change) => { if (Math.abs(change) >= 0.005) events.push({ kind, id: r.id, date: r.date, month: r.month, title, note, change }); };
      income.filter(r => r.date >= start && (k === ALL || r.person === k)).forEach(r => add('income', r, r.hours ? 'Pay' : 'Other income', r.note, sum(fundNames.filter(here).map(f => r.alloc[f]))));
      expenses.filter(r => r.date >= start && here(r.fund)).forEach(r => add('expenses', r, r.description || r.category, r.description ? r.category : '', -(k === ALL ? r.amount : r.shares[k] || 0)));
      adjustments.filter(r => r.date >= start && (k === ALL || r.person === k) && r.fromAccount !== r.toAccount).forEach(r =>
        add('adjustments', r, r.note || 'Transfer', '', (r.toAccount === w.linked ? r.amount : 0) - (r.fromAccount === w.linked ? r.amount : 0)));
      interest.filter(r => r.date >= start && here(r.fund)).forEach(r => add('interest', r, 'Interest', r.note, k === ALL ? r.amount : r.shares[k] || 0));
      let running = 0;
      // Fund shares aren't whole cents, so only round for showing: the last line must match the account's balance.
      events.sort(byDate).forEach(e => {
        running += e.change;
        e.balance = round2(running);
        e.change = round2(e.change);
      });
      return events;
    }
    wallets.forEach(w => {
      if (w.linked) {
        w.events = ledgerEvents(w);
        w.balance = round2(ledgers[w.owner === SHARED ? ALL : w.owner][w.linked].balance);
        w.shown = w.balance;
        w.checked = '';
        return;
      }
      const events = walletChecks.filter(c => c.walletId === w.id)
        .map(c => ({ kind: 'walletChecks', id: c.id, date: c.date, month: c.month, at: c.at, rank: 1, set: w.debt ? -c.amount : c.amount, note: c.note }));
      walletTransfers.forEach(t => {
        const base = { kind: 'walletTransfers', id: t.id, date: t.date, month: t.month, at: t.at, rank: 0, transfer: t, note: t.note };
        if (t.from === w) events.push(Object.assign({ delta: -t.left }, base));
        if (t.to === w) events.push(Object.assign({ delta: t.received }, base));
      });
      events.sort(eventOrder);
      let running = w.start;
      w.checked = w.date;
      events.forEach(e => {
        const before = running;
        running = e.kind === 'walletChecks' ? e.set : round2(running + e.delta);
        e.change = round2(running - before);
        e.balance = running;
        if (e.kind === 'walletChecks') w.checked = e.date;
      });
      w.events = events;
      w.balance = running; // negative when money is owed
      w.shown = w.debt ? -running : running;
    });
    const fxRate = S.general.exchangeRate;
    const inAUD = w => (w.currency === 'MYR' ? (fxRate ? w.balance / fxRate : 0) : w.balance);
    const walletTotals = {};
    keys.forEach(k => {
      const open = wallets.filter(w => !w.closed && (k === ALL || w.owner === k || w.owner === SHARED));
      const moved = walletTransfers.filter(t => k === ALL || [t.from.owner, t.to.owner].some(o => o === k || o === SHARED));
      const net = sum(open.map(inAUD));
      const toMY = moved.filter(t => t.cross && t.from.currency === 'AUD');
      const toAU = moved.filter(t => t.cross && t.from.currency === 'MYR');
      walletTotals[k] = {
        count: open.length, net, netMYR: net * fxRate,
        aud: sum(open.filter(w => w.currency === 'AUD').map(w => w.balance)),
        myr: sum(open.filter(w => w.currency === 'MYR').map(w => w.balance)),
        debts: -sum(open.filter(w => w.debt).map(inAUD)),
        toMY: { count: toMY.length, sent: sum(toMY.map(t => t.left)), received: sum(toMY.map(t => t.received)) },
        toAU: { count: toAU.length, sent: sum(toAU.map(t => t.left)), received: sum(toAU.map(t => t.received)) },
        feesAUD: sum(moved.map(t => t.feeAUD)),
      };
    });

    // --- end-of-year tax estimate ---
    const currentFY = fyOf(today);
    const estimates = {};
    Object.keys(fyTotals).forEach(fy => {
      estimates[fy] = {};
      codes.forEach(c => {
        const t = fyTotals[fy].by[c];
        const extra = (fyTotals[fy].interest[c] || 0) + (t.otherTaxable || 0); // interest + taxable other income
        if (!t.count && !extra) return;
        const p = byCode[c];
        const est = annualTax(t.gross + extra, fy, p, S, warn);
        const e = { gross: t.gross, interest: fyTotals[fy].interest[c] || 0, otherTaxable: t.otherTaxable || 0, withheld: t.tax, est, refund: est ? round2(t.tax - est.total) : null, projection: null };
        if (fy === currentFY && est && t.count) {
          // Project the year at the pace so far, counted from the person's first pay week.
          const first = income.find(r => r.person === c && r.fy === fy).date;
          const from = addDays(first, -6) > fyStartDate(fy) ? addDays(first, -6) : fyStartDate(fy);
          const elapsed = daysBetween(from, today) + 1;
          const span = daysBetween(from, fyEndDate(fy)) + 1;
          if (elapsed >= 28 && span > elapsed) {
            const factor = span / elapsed;
            const pe = annualTax(t.gross * factor + extra, fy, p, S, warn);
            e.projection = { gross: t.gross * factor, withheld: t.tax * factor, est: pe, refund: round2(t.tax * factor - pe.total) };
          }
        }
        estimates[fy][c] = e;
      });
    });

    // --- lists for filters ---
    const monthSet = {};
    const fySet = {};
    monthSet[monthOf(today)] = true;
    fySet[currentFY] = true;
    [income, expenses, adjustments, interest, paybacks].forEach(list => list.forEach(r => { monthSet[monthOf(r.date)] = true; fySet[fyOf(r.date)] = true; }));
    [wallets, walletChecks, walletTransfers].forEach(list => list.forEach(r => { if (r.date) monthSet[monthOf(r.date)] = true; }));

    return {
      today, currentFY,
      general: S.general,
      people: S.people, codes, keys, funds: S.funds, fundNames, categories: S.categories,
      accounts: accountNames, ledgers,
      allocations: S.allocations,
      currentAllocation: allocationFor(today, S.allocations),
      income, expenses, adjustments, interest, paybacks, split,
      viewer, wallets, walletTransfers, walletTotals,
      weekly: Object.keys(weekly).sort().map(k => weekly[k]),
      monthly, fyTotals, catByMonth, balances, estimates,
      months: Object.keys(monthSet).sort(),
      fys: Object.keys(fySet).sort(),
      warnings,
    };
  }

  return {
    compute, settingsOf, withhold, annualTax, autoScale, scaleFor, walletTransfer, walletMonth, WALLET_TYPES, FEE_CATEGORY,
    fyOf, fyMonths, fyName, normFy, monthOf, weekStart, addDays, addMonths, monthRange, todayISO,
    isBlank, num, pct, round2,
    ALL, SHARED, RESIDENT, FOREIGN, WHM,
  };
}

const Engine = TrackerEngine();
