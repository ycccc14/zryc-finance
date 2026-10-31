// Starts the installed iPhone app: pairing, cached start-up, and a google.script.run look-alike
// that sends each call to the Apps Script API (Api.gs) with this phone's device token.
(function () {
  'use strict';

  var API = window.__API__;
  var TOKEN = 'tracker.token';
  var CACHE = 'tracker.cache';
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage full or blocked */ } },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } },
  };
  var started = false;
  window.__PWA__ = true;
  // The app saves changes in the background; keep the copy used for instant start-up current.
  window.__trackerCache = function (app) { store.set(CACHE, JSON.stringify(app)); };

  if ('serviceWorker' in navigator) {
    var hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.register('sw.js').catch(function () { /* app still works, just not cached */ });
    // A new version was installed: reload once so it's used straight away.
    navigator.serviceWorker.addEventListener('controllerchange', function () { if (hadController) location.reload(); });
  }

  function post(payload) {
    return fetch(API, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) })
      .catch(function () { throw new Error('No connection. Check your internet and try again.'); })
      .then(function (res) { return res.json(); });
  }

  function api(fn, args) {
    return post({ token: store.get(TOKEN), fn: fn, args: args || [] }).then(function (body) {
      if (body.ok) {
        var r = body.result;
        if (r && r.data && r.data.settings) store.set(CACHE, JSON.stringify(r)); // open instantly next time
        return r;
      }
      if (body.code === 'UNPAIRED') {
        store.del(TOKEN);
        store.del(CACHE);
        showPairing(body.error);
      }
      throw new Error(body.error || 'Something went wrong.');
    });
  }

  // google.script.run look-alike: google.script.run.withSuccessHandler(f).withFailureHandler(g).anyFunction(args…)
  window.google = {
    script: {
      get run() {
        var ok = function () {};
        var fail = function () {};
        var proxy;
        var base = {
          withSuccessHandler: function (f) { ok = f; return proxy; },
          withFailureHandler: function (f) { fail = f; return proxy; },
        };
        proxy = new Proxy(base, {
          get: function (t, name) {
            if (name in t) return t[name];
            return function () { api(String(name), Array.prototype.slice.call(arguments)).then(ok, fail); };
          },
        });
        return proxy;
      },
    },
  };

  function start(app) {
    window.__BOOT__ = app;
    window.__PARAMS__ = {};
    var s = document.createElement('script');
    s.src = 'app.js?v=' + window.__BUILD__;
    document.body.appendChild(s);
    started = true;
  }

  function message(html) {
    var view = document.getElementById('view');
    if (view) view.innerHTML = '<section class="card"><div class="empty">' + html + '</div></section>';
  }

  function boot() {
    if (!store.get(TOKEN)) { showPairing(); return; }
    var cached = null;
    try { cached = JSON.parse(store.get(CACHE) || 'null'); } catch (e) { cached = null; }
    if (cached) {
      start(cached); // show what we had straight away, then refresh
      setTimeout(function () { if (window.__trackerReload) window.__trackerReload(true); }, 200);
      return;
    }
    message('<span class="e">⏳</span>Loading your data…');
    api('getAppData').then(start).catch(function (err) {
      message('<span class="e">📡</span>' + err.message + '<div style="margin-top:12px"><button class="btn primary" onclick="location.reload()">Try again</button></div>');
    });
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  }

  function showPairing(note) {
    var el = document.getElementById('pair');
    var prefill = (location.hash.match(/pair=([A-Za-z0-9-]+)/) || [])[1] || '';
    el.hidden = false;
    el.innerHTML =
      '<div class="wrap">' +
      '<img src="icons/icon-180.png" alt="" width="84" height="84" style="margin:0 auto;border-radius:20px;box-shadow:var(--shadow)">' +
      '<div><h1>ZR &amp; YC Finance</h1><p class="muted" style="margin:6px 0 0">Pair this phone once to see your data.</p></div>' +
      (note ? '<div class="notice" style="text-align:left">' + esc(note) + '</div>' : '') +
      '<section class="card" style="text-align:left"><ol class="small" style="padding-left:20px;margin:0 0 12px;display:grid;gap:4px">' +
      '<li>On a computer (or in Safari), open the tracker and go to <strong>Me ▸ Settings ▸ Install on iPhone</strong>.</li>' +
      '<li>Press <strong>Get pairing code</strong>.</li><li>Type the code here.</li></ol>' +
      '<form id="pair-form" class="form" autocomplete="off">' +
      '<label class="field"><span>Pairing code</span><input class="code" id="pair-code" maxlength="9" autocapitalize="characters" autocorrect="off" spellcheck="false" placeholder="XXXX-XXXX" value="' + esc(prefill) + '" required></label>' +
      '<label class="field"><span>Name this phone</span><input id="pair-name" maxlength="40" placeholder="e.g. ZR’s iPhone" required></label>' +
      '<button class="btn primary block" id="pair-go" type="submit">🔑 Pair this phone</button>' +
      '<p class="flag" id="pair-err" style="margin:0"></p></form></section>' +
      '<p class="muted small">🔒 Only paired phones can reach your data. Codes work once and expire after 30 minutes.</p></div>';
    document.getElementById('pair-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = document.getElementById('pair-go');
      var err = document.getElementById('pair-err');
      btn.disabled = true;
      err.textContent = '';
      post({ fn: 'pair', code: document.getElementById('pair-code').value, device: document.getElementById('pair-name').value })
        .then(function (body) {
          if (!body.ok) throw new Error(body.error);
          store.set(TOKEN, body.result.token);
          el.hidden = true;
          if (started) location.reload(); else boot();
        })
        .catch(function (e2) { btn.disabled = false; err.textContent = e2.message; });
    });
  }

  boot();
})();
