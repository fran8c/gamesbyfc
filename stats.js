/* Games by FC — visitor stats (GoatCounter, dashboard: https://fran8c.goatcounter.com)
   One file for the whole site. Every page loads it with one line in its <head>.
   No cookies and no names or IDs. The browser only keeps two small notes:
   "first visit date" and "last day visited", so we can tell new from returning visitors.

   What shows up in the dashboard:
     /gamesbyfc/...            page visits (landing page and each game)
     visitor-new               first time this browser visited the site (counted once)
     visitor-returning         came back on another day (counted once per day)
     play-<game>               clicked a game on the landing page
     out-gentlegames           clicked the Gentle Games panel
     time-<game>-<range>       time spent in a game (sent when the player leaves or switches away)
*/
(function () {
  var ENDPOINT = 'https://fran8c.goatcounter.com/count';
  var GAMES = {
    'velocity': 'Velocity',
    'just-a-moment': 'Just a Moment!',
    'skyduel': 'SkyDuel',
    'harvest-tide': 'Harvest Tide',
    'time-hole': 'Time Hole',
    'neon-3026': 'Neon 3026',
    'shaman': 'Shaman!',
    'pappies-monopoly': 'Pappies Monopoly'
  };

  // Don't count testing on your own computer
  if (location.protocol === 'file:' || /^(localhost|127\.|192\.168\.)/.test(location.hostname)) return;

  // --- load GoatCounter ---
  window.goatcounter = window.goatcounter || {};
  window.goatcounter.endpoint = ENDPOINT;
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://gc.zgo.at/count.js';
  s.setAttribute('data-goatcounter', ENDPOINT);
  (document.head || document.documentElement).appendChild(s);

  // Events wait in a queue until GoatCounter has loaded
  var queue = [];
  function send(path, title) {
    var gc = window.goatcounter;
    if (gc && typeof gc.count === 'function') {
      try { gc.count({ path: path, title: title, event: true }); } catch (e) {}
    } else {
      queue.push([path, title]);
    }
  }
  s.onload = function () { var q = queue; queue = []; q.forEach(function (x) { send(x[0], x[1]); }); };

  // Which game folder is this page in? ('' for the landing page)
  function folderOf(pathname) {
    var parts = pathname.split('/').filter(Boolean); // e.g. ['gamesbyfc', 'velocity', 'index.html']
    var i = parts.indexOf('gamesbyfc');
    var f = i >= 0 ? parts[i + 1] : parts[0];
    return f && GAMES[f] ? f : '';
  }
  var here = folderOf(location.pathname);

  // --- new vs returning visitors (once per day per browser) ---
  try {
    var today = new Date().toISOString().slice(0, 10);
    var first = localStorage.getItem('gbfc.stats.first');
    var last = localStorage.getItem('gbfc.stats.lastDay');
    if (!first) {
      localStorage.setItem('gbfc.stats.first', today);
      send('visitor-new', 'New visitor');
    } else if (last !== today) {
      send('visitor-returning', 'Returning visitor');
    }
    localStorage.setItem('gbfc.stats.lastDay', today);
  } catch (e) { /* private browsing: skip */ }

  // --- clicks on the landing page ---
  if (!here) {
    document.addEventListener('click', function (e) {
      var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (!a) return;
      var url;
      try { url = new URL(a.getAttribute('href'), location.href); } catch (err) { return; }
      if (/gentlegames/.test(url.pathname)) { send('out-gentlegames', 'Clicked Gentle Games'); return; }
      if (url.origin !== location.origin) return;
      var g = folderOf(url.pathname);
      if (g) send('play-' + g, 'Clicked: ' + GAMES[g]);
    }, true);
  }

  // --- time spent in a game ---
  if (here) {
    var shown = 0, since = document.visibilityState === 'visible' ? Date.now() : 0, sent = false;
    function range(min) {
      if (min < 1) return ['under-1min', 'under 1 min'];
      if (min < 5) return ['1-5min', '1–5 min'];
      if (min < 15) return ['5-15min', '5–15 min'];
      if (min < 30) return ['15-30min', '15–30 min'];
      return ['30min-plus', '30+ min'];
    }
    function leave() {
      if (since) { shown += Date.now() - since; since = 0; }
      if (sent) return;
      sent = true;
      var r = range(shown / 60000);
      send('time-' + here + '-' + r[0], 'Time in ' + GAMES[here] + ': ' + r[1]);
    }
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') leave();
      else if (!sent && !since) since = Date.now();
    });
    window.addEventListener('pagehide', leave);
  }
})();
