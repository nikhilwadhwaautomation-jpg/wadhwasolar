(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var money = function (n) { return '\u20B9' + Math.round(n).toLocaleString('en-IN'); };

  /* Headline words rise one by one */
  document.querySelectorAll('[data-split]').forEach(function (el) {
    var words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map(function (w, i) {
      return '<span class="w" style="animation-delay:' + (i * 0.07 + 0.35).toFixed(2) + 's">' + w + '</span>';
    }).join(' ');
    if (reduce) el.querySelectorAll('.w').forEach(function (s) { s.style.opacity = 1; s.style.transform = 'none'; });
  });

  /* Sections fade up on scroll */
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

  /* Numbers count up once visible */
  var cio = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target, end = parseFloat(el.dataset.count), dec = (el.dataset.dec || 0) | 0;
      var pre = el.dataset.pre || '', suf = el.dataset.suf || '', t0 = null;
      var fmt = function (v) { return dec ? v.toFixed(dec) : Math.round(v).toLocaleString('en-IN'); };
      if (reduce) { el.textContent = pre + fmt(end) + suf; cio.unobserve(el); return; }
      requestAnimationFrame(function step(t) {
        if (!t0) t0 = t;
        var p = Math.min((t - t0) / 1400, 1), e2 = 1 - Math.pow(1 - p, 3);
        el.textContent = pre + fmt(end * e2) + suf;
        if (p < 1) requestAnimationFrame(step);
      });
      cio.unobserve(el);
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('[data-count]').forEach(function (el) { cio.observe(el); });

  /* Live "rupees saved while you read this" ticker */
  var live = document.getElementById('liveSave');
  if (live && !reduce) {
    var start = performance.now();
    (function tick(t) {
      var secs = (t - start) / 1000;
      live.textContent = money(secs * 41);   // ~₹41 a second across installed rooftops
      requestAnimationFrame(tick);
    })(start);
  } else if (live) {
    live.textContent = money(0);
  }

  /* Sun travels along the arc as you scroll the process section */
  var arc = document.getElementById('arcPath'), sunDot = document.getElementById('arcSun'),
      trail = document.getElementById('arcTrail'), arcBox = document.getElementById('arcBox');
  if (arc && sunDot && arcBox) {
    var len = arc.getTotalLength();
    if (trail) { trail.style.strokeDasharray = len; trail.style.strokeDashoffset = len; }
    var move = function () {
      var r = arcBox.getBoundingClientRect(), vh = window.innerHeight;
      var p = Math.min(Math.max((vh - r.top) / (vh + r.height), 0), 1);
      var pt = arc.getPointAtLength(len * p);
      sunDot.setAttribute('cx', pt.x); sunDot.setAttribute('cy', pt.y);
      if (trail) trail.style.strokeDashoffset = len * (1 - p);
    };
    move();
    window.addEventListener('scroll', function () { requestAnimationFrame(move); }, { passive: true });
    window.addEventListener('resize', move);
  }

  /* Savings calculator */
  var bill = document.getElementById('bill');
  if (bill) {
    var set = function (id, v) { var n = document.getElementById(id); if (n) n.textContent = v; };
    var run = function () {
      var b = +bill.value;
      var kw = Math.min(15, Math.max(1, Math.round((b / 8 / 135) * 2) / 2));
      var rate = kw <= 3 ? 68000 : (kw <= 10 ? 58000 : 50000);
      var cost = kw * rate;
      var sub = kw >= 3 ? 78000 : (kw >= 2 ? 60000 + (kw - 2) * 18000 : kw * 30000);
      if (kw > 10) sub = 0;
      var net = cost - sub, save = b * 0.9, after = b - save, yrs = net / (save * 12);
      set('billOut', money(b));
      set('size', kw + ' kW');
      set('units', Math.round(kw * 135).toLocaleString('en-IN') + ' units a month');
      set('cost', money(cost));
      set('sub', kw > 10 ? 'Not applicable' : money(sub));
      set('net', money(net));
      set('pay', yrs.toFixed(1) + ' years');
      set('save25', money(save * 12 * 25 - net));
      set('beforeLbl', money(b) + ' a month');
      set('afterLbl', money(after) + ' a month');
      var ba = document.getElementById('barAfter');
      if (ba) ba.style.width = Math.max(4, (after / b) * 100) + '%';
    };
    bill.addEventListener('input', run);
    run();
  }

  /* Contact form -> opens email app */
  var send = document.getElementById('send');
  if (send) {
    var g = function (id) { var n = document.getElementById(id); return n ? n.value.trim() : ''; };
    send.addEventListener('click', function () {
      var warn = document.getElementById('warn');
      if (!g('name') || !g('phone')) { warn.textContent = 'Add your name and phone number so we can call you back.'; return; }
      warn.textContent = '';
      var body = 'Name: ' + g('name') + '\nPhone: ' + g('phone') + '\nCity: ' + g('city') +
        '\nProperty: ' + g('type') + '\nAverage monthly bill: ' + g('billamt') + '\n\n' + g('msg');
      window.location.href = 'mailto:hello@wadhwasolar.com?subject=' +
        encodeURIComponent('Solar enquiry from ' + g('name')) + '&body=' + encodeURIComponent(body);
    });
    ['name', 'phone'].forEach(function (id) {
      var n = document.getElementById(id);
      if (n) n.addEventListener('input', function () { document.getElementById('warn').textContent = ''; });
    });
  }
})();
