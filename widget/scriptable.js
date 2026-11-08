// ZR & YC widget for iPhone. Runs in the free Scriptable app.
// Copy it from the ZR & YC app ▸ Me ▸ Settings ▸ Home Screen widgets: that fills in this phone's code below.
// The server works the numbers out on every refresh, so they include the other person's new entries without
// anyone opening the app. The look (background, colour, picture, whose numbers) is chosen in the app, and the
// script keeps itself up to date from the website (selfUpdate below), so it never needs copying again.
//   Small widget: this month's everyday (Living Expenses) budget left.
//   Medium widget: this month's income, expenses and what's left.
// Optional: type ZR, YC or Both under Parameter (Edit Widget) to show someone else's numbers on this widget.

const CODE = '__WIDGET_CODE__';
const STORE = 'zryc-widget.json';
const REFRESH_MINUTES = 5; // a request: iOS decides when widgets really refresh
// How much a picture background is darkened. Enough that white words stay readable on bright photos, and on a
// Clear or Tinted Home Screen, where iOS dims and recolours the picture but keeps the words.
const PICTURE_SHADE = 0.45;

const parts = CODE.split('|');
const connected = parts[0] === 'ZRW1' && parts.length === 3 && /^https:\/\//.test(parts[1]);
const fm = FileManager.local();
const inDocs = (name) => fm.joinPath(fm.documentsDirectory(), name);
const storeFile = inDocs(STORE);
const picFile = (size) => inDocs(`zryc-widget-${size}.jpg`);

function readStore() {
  try { return fm.fileExists(storeFile) ? JSON.parse(fm.readString(storeFile)) || {} : {}; } catch (e) { return {}; }
}
const writeStore = (store) => fm.writeString(storeFile, JSON.stringify(store));

// ============================== keeping itself up to date ==============================
// The newest script is on the ZR & YC website. At most every UPDATE_HOURS this fetches it and, if it changed, saves it
// over this script, keeping this phone's code. The new version runs from the next refresh. Anything that doesn't look
// like this script (an error page, a half download) is ignored, so a bad download can't break the widget.
const SOURCE_URL = 'https://ycccc14.github.io/zryc-finance/widget/scriptable.js';
const UPDATE_HOURS = 6;
const FIRST_LINE = '// ZR & YC widget for iPhone.';
const PLACEHOLDER = "'__WIDGET" + "_CODE__'"; // split, so the placeholder appears only once in this file

async function selfUpdate() {
  if (!connected || typeof module === 'undefined' || !module.filename) return;
  const store = readStore();
  if (Date.now() - (store._checked || 0) < UPDATE_HOURS * 3600000) return;
  store._checked = Date.now();
  writeStore(store);
  try {
    const req = new Request(SOURCE_URL + '?t=' + Date.now());
    req.timeoutInterval = 15;
    const text = await req.loadString();
    if (typeof text !== 'string' || !text.startsWith(FIRST_LINE) || text.split(PLACEHOLDER).length !== 2 || !/Script\.complete\(\);\s*$/.test(text)) return;
    const next = text.replace(PLACEHOLDER, () => "'" + CODE + "'");
    const files = FileManager.iCloud().isFileStoredIniCloud(module.filename) ? FileManager.iCloud() : FileManager.local();
    if (files.readString(module.filename) !== next) files.writeString(module.filename, next);
  } catch (e) { /* offline or a hiccup: try again next time */ }
}

function forget() {
  ['s', 'm'].forEach((size) => { if (fm.fileExists(picFile(size))) fm.remove(picFile(size)); });
  if (fm.fileExists(storeFile)) fm.remove(storeFile);
}

async function fetchFeed(size, param, have) {
  const req = new Request(parts[1]);
  req.method = 'POST';
  req.headers = { 'Content-Type': 'text/plain;charset=utf-8' };
  req.body = JSON.stringify({ fn: 'widget', t: parts[2], size, param, have });
  req.timeoutInterval = 25;
  return req.loadJSON();
}

// The latest numbers, or the last ones seen when there's no internet. The picture only comes when it changed.
async function load(size, param) {
  if (!connected) return { message: 'Copy the script again from ZR & YC ▸ Me ▸ Settings ▸ Home Screen widgets.' };
  const store = readStore();
  const key = size + '|' + param;
  const last = store[key];
  const have = last && last.picVer && fm.fileExists(picFile(size)) ? last.picVer : '';
  let res = null;
  try { res = await fetchFeed(size, param, have); } catch (e) { /* offline: the last numbers below */ }
  if (res && !res.ok && res.code === 'WIDGET_OFF') {
    forget();
    return { message: res.error };
  }
  if (res && res.ok) {
    const d = res.result;
    if (d.pic) fm.write(picFile(size), Data.fromBase64String(d.pic));
    delete d.pic;
    d.at = Date.now();
    store[key] = d;
    writeStore(store);
    return { data: d };
  }
  if (last) return { data: last, stale: true };
  return { message: res && res.error ? res.error : 'Waiting for the internet.' };
}

// ============================== drawing ==============================

function money(v, cur, short) {
  const n = Math.abs(Number(v) || 0);
  const sign = Number(v) < -0.004 ? '−' : '';
  if (short && n >= 1000) return sign + cur + (n >= 1e6 ? (n / 1e6).toFixed(1) + 'm' : (n / 1e3).toFixed(1) + 'k');
  return sign + cur + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Apple's widget sizes (points) by screen width.
function widgetSize(family) {
  const screen = Device.screenSize();
  const width = Math.min(screen.width, screen.height);
  const row = [[428, 170, 364], [414, 169, 360], [390, 158, 338], [375, 155, 329], [0, 141, 292]].find((r) => width >= r[0]);
  return family === 'small' ? new Size(row[1], row[1]) : new Size(row[2], row[1]);
}

const hex = (c) => String(c || '').replace('#', '');
function isLight(color) {
  const h = hex(color);
  if (h.length !== 6) return false;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return 0.299 * r + 0.587 * g + 0.114 * b > 165;
}

// Colours for the chosen background. Rings are pictures, so they use colours that work in light and dark.
function palette(d, hasPicture) {
  const white = new Color('#FFFFFF');
  const accent = new Color(d.color);
  const back = d.back === 'picture' && !hasPicture ? 'dark' : d.back;
  const onDark = { ink: white, soft: new Color('#FFFFFF', 0.72), track: new Color('#FFFFFF', 0.16), bad: new Color('#FF8A8A'),
    rings: [new Color('#4ADE80'), new Color('#FF8A8A'), accent], ringTrack: new Color('#FFFFFF', 0.18), bar: accent };
  const onLight = { ink: new Color('#1E2A3A'), soft: new Color('#667085'), track: new Color('#000000', 0.08), bad: new Color('#D33A3A'),
    rings: [new Color('#16A34A'), new Color('#E5484D'), accent], ringTrack: new Color('#8E8E93', 0.22), bar: accent };
  if (back === 'picture') {
    const all = new Color('#FFFFFF', 0.95);
    return Object.assign({}, onDark, { back, soft: new Color('#FFFFFF', 0.82), track: new Color('#FFFFFF', 0.3), rings: [all, all, all], ringTrack: new Color('#FFFFFF', 0.3) });
  }
  if (back === 'dark') return Object.assign({ back, bg: new Color('#1C1C1E') }, onDark);
  if (back === 'light') return Object.assign({ back, bg: white }, onLight);
  if (back === 'colour') {
    const ink = isLight(d.color) ? new Color('#1E2A3A') : white;
    const inkHex = isLight(d.color) ? '#1E2A3A' : '#FFFFFF';
    return { back, bg: accent, ink, soft: new Color(inkHex, 0.75), track: new Color(inkHex, 0.22), bad: ink, rings: [ink, ink, ink], ringTrack: new Color(inkHex, 0.25), bar: ink };
  }
  // auto: follows the iPhone's light / dark appearance
  const dyn = (a, b) => Color.dynamic(a, b);
  return { back: 'auto', bg: dyn(white, new Color('#1C1C1E')), ink: dyn(onLight.ink, onDark.ink), soft: dyn(onLight.soft, onDark.soft),
    track: dyn(onLight.track, onDark.track), bad: dyn(onLight.bad, onDark.bad), rings: onLight.rings, ringTrack: onLight.ringTrack, bar: accent };
}

// The picture, cut to the widget's shape and darkened (PICTURE_SHADE) so white words stay readable on any photo.
function pictureBackground(size, family) {
  if (!fm.fileExists(picFile(size))) return null;
  const pic = Image.fromFile(picFile(size));
  if (!pic) return null;
  const box = widgetSize(family);
  const ctx = new DrawContext();
  ctx.size = box;
  ctx.opaque = true;
  ctx.respectScreenScale = true;
  const zoom = Math.max(box.width / pic.size.width, box.height / pic.size.height);
  const w = pic.size.width * zoom;
  const h = pic.size.height * zoom;
  ctx.drawImageInRect(pic, new Rect((box.width - w) / 2, (box.height - h) / 2, w, h));
  ctx.setFillColor(new Color('#000000', PICTURE_SHADE));
  ctx.fillRect(new Rect(0, 0, box.width, box.height));
  return ctx.getImage();
}

// A progress ring (part 0–1) with round ends, as a picture for a stack's background.
function ringImage(part, color, track, side, width) {
  const ctx = new DrawContext();
  ctx.size = new Size(side, side);
  ctx.opaque = false;
  ctx.respectScreenScale = true;
  ctx.setLineWidth(width);
  ctx.setStrokeColor(track);
  ctx.strokeEllipse(new Rect(width / 2, width / 2, side - width, side - width));
  const p = Math.max(0, Math.min(1, part || 0));
  if (p > 0) {
    const c = side / 2;
    const r = (side - width) / 2;
    const steps = Math.max(2, Math.ceil(120 * p));
    const pts = [];
    for (let i = 0; i <= steps; i++) {
      const a = -Math.PI / 2 + Math.PI * 2 * p * (i / steps);
      pts.push(new Point(c + r * Math.cos(a), c + r * Math.sin(a)));
    }
    const path = new Path();
    path.addLines(pts);
    ctx.addPath(path);
    ctx.setStrokeColor(color);
    ctx.strokePath();
    ctx.setFillColor(color);
    [pts[0], pts[pts.length - 1]].forEach((pt) => ctx.fillEllipse(new Rect(pt.x - width / 2, pt.y - width / 2, width, width)));
  }
  return ctx.getImage();
}

// On a picture every word gets a soft grey shadow, so it stays readable over bright parts of the photo. Grey, not
// black: a Tinted Home Screen recolours the shadow too, and a black one came out as a bright white glow there.
let textShadow = false;

function addText(stack, text, font, color, opts) {
  const t = stack.addText(String(text));
  t.font = font;
  t.textColor = color;
  t.lineLimit = 1;
  t.minimumScaleFactor = (opts && opts.shrink) || 0.75;
  if (textShadow) {
    t.shadowColor = new Color('#5A5A5A', 0.55);
    t.shadowRadius = 3;
    t.shadowOffset = new Point(0, 1);
  }
  return t;
}

function symbol(name, fallback) {
  try {
    const s = SFSymbol.named(name);
    if (s) {
      s.applyFont(Font.semiboldSystemFont(22));
      return s.image;
    }
  } catch (e) { /* older iOS: the emoji instead */ }
  return fallback;
}

function startWidget(d, size, family) {
  const w = new ListWidget();
  const picture = d.back === 'picture' ? pictureBackground(size, family) : null;
  const p = palette(d, !!picture);
  if (picture) w.backgroundImage = picture; else w.backgroundColor = p.bg;
  textShadow = !!picture;
  w.url = tapUrl;
  w.refreshAfterDate = new Date(Date.now() + REFRESH_MINUTES * 60000);
  return { w, p };
}

// Medium: this month's Income, Expenses and Remaining, each in a ring.
function drawWide(d, stale, family) {
  const { w, p } = startWidget(d, 'm', family);
  const box = widgetSize(family);
  w.setPadding(12, 14, 12, 14);
  const head = w.addStack();
  head.centerAlignContent();
  addText(head, d.monthLong + (stale ? ' · offline' : ''), Font.boldSystemFont(14), p.ink);
  head.addSpacer();
  addText(head, d.who === 'All' ? 'Both of us' : d.name, Font.mediumSystemFont(12), p.soft);
  w.addSpacer();
  const income = Math.max(0, d.income);
  const share = (v) => (income > 0 ? Math.max(0, v) / income : v > 0 ? 1 : 0);
  const cols = [
    ['Income', 'briefcase.fill', '💼', d.income, income > 0 ? 1 : 0, p.ink],
    ['Expenses', 'cart.fill', '🧾', d.spent, share(d.spent), p.ink],
    ['Remaining', 'banknote.fill', '💰', d.left, share(d.left), d.left < -0.004 ? p.bad : p.ink],
  ];
  const row = w.addStack();
  row.layoutHorizontally();
  const colWidth = Math.floor((box.width - 28) / 3);
  const side = Math.min(62, Math.round(box.height * 0.38));
  cols.forEach(([label, sym, emoji, value, part, color], i) => {
    const col = row.addStack();
    col.layoutVertically();
    col.size = new Size(colWidth, 0);
    const ringRow = col.addStack(); // centres the ring in the column
    ringRow.addSpacer();
    const ring = ringRow.addStack();
    ring.size = new Size(side, side);
    ring.backgroundImage = ringImage(part, p.rings[i], p.ringTrack, side, 6);
    ring.centerAlignContent();
    ring.addSpacer();
    const icon = symbol(sym, null);
    if (icon) {
      const img = ring.addImage(icon);
      img.imageSize = new Size(Math.round(side * 0.36), Math.round(side * 0.36));
      img.tintColor = p.rings[i];
    } else {
      addText(ring, emoji, Font.systemFont(Math.round(side * 0.34)), p.ink);
    }
    ring.addSpacer();
    ringRow.addSpacer();
    col.addSpacer(6);
    [[label, Font.mediumSystemFont(12), p.soft], [money(value, d.cur, d.short), Font.boldSystemFont(15), color]].forEach(([text, font, c], j) => {
      const line = col.addStack();
      line.addSpacer();
      addText(line, text, font, c, { shrink: j ? 0.55 : 0.8 });
      line.addSpacer();
      if (!j) col.addSpacer(1);
    });
  });
  w.addSpacer();
  return w;
}

// Small: this month's everyday budget (pay put into the Everyday Account) and what's left of it.
function drawSmall(d, stale, family) {
  const { w, p } = startWidget(d, 's', family);
  const box = widgetSize(family);
  w.setPadding(16, 16, 16, 16);
  const head = w.addStack();
  head.centerAlignContent();
  addText(head, d.who === 'All' ? 'Budget' : d.whose + ' budget', Font.mediumSystemFont(15), p.soft, { shrink: 0.7 });
  head.addSpacer(4);
  addText(head, stale ? d.month + ' ·' : d.month, Font.boldSystemFont(15), p.ink);
  w.addSpacer();
  const none = !(d.budget > 0) && !(d.budgetSpent > 0);
  const over = d.budgetLeft < -0.004;
  addText(w, none ? 'No budget yet' : money(d.budgetLeft, d.cur, d.short) + ' left', Font.boldSystemFont(none ? 19 : 23), over ? p.bad : p.ink, { shrink: 0.5 });
  w.addSpacer(10);
  const barWidth = box.width - 32;
  const bar = w.addStack();
  bar.size = new Size(barWidth, 12);
  bar.cornerRadius = 6;
  bar.backgroundColor = p.track;
  const part = d.budget > 0 ? Math.min(1, Math.max(0, d.budgetSpent) / d.budget) : d.budgetSpent > 0 ? 1 : 0;
  if (part > 0) {
    const fill = bar.addStack();
    fill.size = new Size(Math.max(12, Math.round(barWidth * part)), 12);
    fill.cornerRadius = 6;
    fill.backgroundColor = over ? p.bad : p.bar;
  }
  bar.addSpacer();
  w.addSpacer();
  addText(w, none ? 'Add this month’s pay' : `${money(d.budgetSpent, d.cur, d.short)} of ${money(d.budget, d.cur, d.short)}`, Font.mediumSystemFont(13), p.soft, { shrink: 0.6 });
  return w;
}

// Lock Screen widgets: just the budget left.
function drawAccessory(d, family) {
  const w = new ListWidget();
  w.url = tapUrl;
  w.refreshAfterDate = new Date(Date.now() + REFRESH_MINUTES * 60000);
  const left = money(d.budgetLeft, d.cur, true) + ' left';
  if (family === 'accessoryInline') { w.addText(left); return w; }
  const t1 = w.addText(family === 'accessoryCircular' ? d.month : `${d.who === 'All' ? 'Budget' : d.whose + ' budget'} · ${d.month}`);
  t1.font = Font.mediumSystemFont(12);
  t1.lineLimit = 1;
  const t2 = w.addText(family === 'accessoryCircular' ? money(d.budgetLeft, d.cur, true) : left);
  t2.font = Font.boldSystemFont(family === 'accessoryCircular' ? 12 : 17);
  t2.minimumScaleFactor = 0.5;
  t2.lineLimit = 1;
  return w;
}

function drawMessage(text) {
  const w = new ListWidget();
  w.backgroundColor = Color.dynamic(new Color('#FFFFFF'), new Color('#1C1C1E'));
  w.setPadding(14, 14, 14, 14);
  const t = w.addText(text);
  t.font = Font.mediumSystemFont(13);
  t.textColor = Color.dynamic(new Color('#1E2A3A'), new Color('#FFFFFF'));
  t.minimumScaleFactor = 0.6;
  w.refreshAfterDate = new Date(Date.now() + REFRESH_MINUTES * 60000);
  return w;
}

// A tap opens Scriptable and runs this script for the tapped widget (its size and Parameter), which shows it with
// the latest numbers. Not Safari: an iPhone can't open the Home Screen app from a widget anyway.
let tapUrl = '';

async function build(family, param) {
  const accessory = /^accessory/.test(family || '');
  const size = family === 'small' || accessory ? 's' : 'm'; // large shows the medium layout
  tapUrl = URLScheme.forRunningScript() + '?size=' + size + (param ? '&p=' + encodeURIComponent(param) : '');
  const state = await load(size, param);
  if (!state.data) return drawMessage(state.message);
  const stale = !!state.stale && Date.now() - (state.data.at || 0) > 3600000;
  if (accessory) return drawAccessory(state.data, family);
  return size === 's' ? drawSmall(state.data, stale, 'small') : drawWide(state.data, stale, 'medium');
}

await selfUpdate();
const query = args.queryParameters || {};
if (config.runsInWidget) {
  Script.setWidget(await build(config.widgetFamily, String(args.widgetParameter || '').trim()));
} else if (query.size) { // a widget was tapped: show that one, freshly loaded
  const w = await build(query.size === 's' ? 'small' : 'medium', String(query.p || '').trim());
  if (query.size === 's') await w.presentSmall(); else await w.presentMedium();
} else { // opened in Scriptable itself: show both
  await (await build('medium', '')).presentMedium();
  await (await build('small', '')).presentSmall();
}
Script.complete();
