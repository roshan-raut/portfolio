(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Theme toggle */
  var themeBtn = $('#theme-toggle');
  if (themeBtn) themeBtn.addEventListener('click', function () {
    var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
    document.dispatchEvent(new CustomEvent('themechange'));
  });

  /* Mobile menu */
  var menuBtn = $('#menu-toggle'), links = $('#nav-links');
  if (menuBtn && links) menuBtn.addEventListener('click', function () {
    var open = links.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', open);
  });

  /* Card spotlight follows the cursor */
  document.addEventListener('pointermove', function (e) {
    var card = e.target.closest && e.target.closest('a.card');
    if (!card) return;
    var r = card.getBoundingClientRect();
    card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    card.style.setProperty('--my', (e.clientY - r.top) + 'px');
  });

  /* Typed command in hero terminal */
  var typed = $('#typed');
  if (typed) {
    var cmds = ['kubectl get pods -n inference', 'vllm serve --enable-prefix-caching', 'nvidia-smi --query-gpu=utilization.gpu', 'terraform plan -target=module.gpu_pool', 'claude "review this helm chart"'];
    if (reduceMotion) { typed.textContent = cmds[0]; }
    else {
      var ci = 0, li = 0, del = false;
      (function tick() {
        var c = cmds[ci];
        typed.textContent = c.slice(0, li);
        if (!del && li < c.length) { li++; setTimeout(tick, 45 + Math.random() * 40); }
        else if (!del) { del = true; setTimeout(tick, 1800); }
        else if (li > 0) { li--; setTimeout(tick, 18); }
        else { del = false; ci = (ci + 1) % cmds.length; setTimeout(tick, 300); }
      })();
    }
  }

  /* Reveal sections on scroll */
  if ('IntersectionObserver' in window && !reduceMotion) {
    var els = $$('.section, .card-grid > .card, .timeline-item');
    els.forEach(function (el) { el.classList.add('reveal'); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  /* Blog filter: series segments + tag chips + search */
  var grid = $('#post-grid');
  if (grid) {
    var search = $('#post-search'), chips = $$('#tag-filters .chip-btn'), empty = $('#no-results');
    var segs = $$('#segments .segment'), blocks = $$('.series-block', grid);
    var params = new URLSearchParams(location.search);
    var activeTag = params.get('tag') || '', activeSeries = params.get('series') || '';
    var setParam = function (k, v) {
      var u = new URL(location.href);
      if (v) u.searchParams.set(k, v); else u.searchParams.delete(k);
      history.replaceState(null, '', u);
    };
    var apply = function () {
      var q = (search.value || '').toLowerCase().trim(), shown = 0;
      blocks.forEach(function (b) {
        var inSeg = !activeSeries || b.dataset.series === activeSeries, inBlock = 0;
        $$('.post-card', b).forEach(function (c) {
          var okTag = !activeTag || (' ' + c.dataset.tags + ' ').indexOf(' ' + activeTag + ' ') > -1;
          var okQ = !q || c.dataset.title.indexOf(q) > -1 || c.dataset.tags.indexOf(q) > -1;
          var vis = inSeg && okTag && okQ; c.hidden = !vis; if (vis) inBlock++;
        });
        b.hidden = inBlock === 0; shown += inBlock;
      });
      chips.forEach(function (ch) { ch.classList.toggle('active', ch.dataset.tag === activeTag); });
      segs.forEach(function (sg) {
        var on = sg.dataset.series === activeSeries;
        sg.classList.toggle('active', on); sg.setAttribute('aria-selected', on);
      });
      empty.hidden = shown > 0;
    };
    chips.forEach(function (ch) {
      ch.addEventListener('click', function () { activeTag = ch.dataset.tag; setParam('tag', activeTag); apply(); });
    });
    segs.forEach(function (sg) {
      sg.addEventListener('click', function () { activeSeries = sg.dataset.series; setParam('series', activeSeries); apply(); });
    });
    search.addEventListener('input', apply);
    apply();
  }

  /* Post enhancements: TOC, copy buttons, progress */
  var prose = $('#prose');
  if (prose) {
    var toc = $('#toc');
    var heads = $$('h2[id], h3[id]', prose);
    if (toc && heads.length) {
      heads.forEach(function (h) {
        var a = document.createElement('a');
        a.href = '#' + h.id; a.textContent = h.textContent;
        a.className = 'lvl-' + h.tagName.charAt(1);
        toc.appendChild(a);
      });
      if ('IntersectionObserver' in window) {
        var tocLinks = $$('a', toc);
        var hio = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) {
            if (en.isIntersecting) {
              tocLinks.forEach(function (l) { l.classList.toggle('active', l.getAttribute('href') === '#' + en.target.id); });
            }
          });
        }, { rootMargin: '-80px 0px -70% 0px' });
        heads.forEach(function (h) { hio.observe(h); });
      }
    } else if (toc) { toc.parentElement.hidden = true; }

    /* Mermaid diagrams: ```mermaid fences become themed SVG diagrams */
    var mBlocks = $$('code.language-mermaid', prose).map(function (code) {
      return code.closest('div.highlighter-rouge') || code.closest('pre') || code;
    });
    if (mBlocks.length) {
      var diagrams = mBlocks.map(function (block) {
        var fig = document.createElement('figure');
        fig.className = 'diagram diagram-mermaid';
        fig.dataset.src = block.textContent.trim();
        fig.innerHTML = '<div class="diagram-loading mono small muted">// rendering diagram…</div>';
        block.parentNode.replaceChild(fig, block);
        return fig;
      });
      var css = function (n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); };
      var renderAll = function (mermaid) {
        mermaid.initialize({
          startOnLoad: false, securityLevel: 'strict', theme: 'base',
          fontFamily: 'Geist, system-ui, sans-serif',
          flowchart: { curve: 'basis', htmlLabels: true },
          sequence: { mirrorActors: false, messageAlign: 'center' },
          themeVariables: {
            background: css('--bg-elev'), mainBkg: css('--surface-solid'),
            primaryColor: css('--surface-solid'), primaryTextColor: css('--text'),
            primaryBorderColor: css('--accent'), secondaryColor: css('--bg-elev'),
            tertiaryColor: css('--bg-elev'), lineColor: css('--muted'), textColor: css('--text'),
            clusterBkg: css('--bg-elev'), clusterBorder: css('--border-strong'),
            actorBkg: css('--surface-solid'), actorBorder: css('--accent'), actorTextColor: css('--text'),
            actorLineColor: css('--border-strong'), signalColor: css('--text-2'), signalTextColor: css('--text'),
            noteBkgColor: css('--bg-elev'), noteBorderColor: css('--accent-2'), noteTextColor: css('--text-2'),
            labelBoxBkgColor: css('--surface-solid'), labelBoxBorderColor: css('--border-strong'),
            edgeLabelBackground: css('--bg-elev'), fontSize: '15px'
          }
        });
        // Render one at a time: concurrent mermaid.render calls can clobber each other.
        var stamp = Date.now();
        diagrams.reduce(function (chain, fig, i) {
          return chain.then(function () {
            return mermaid.render('mmd-' + i + '-' + stamp, fig.dataset.src).then(function (r) {
              fig.innerHTML = r.svg;
            }).catch(function () {
              fig.innerHTML = '<pre><code></code></pre>';
              fig.querySelector('code').textContent = fig.dataset.src;
            });
          });
        }, Promise.resolve());
      };
      import('https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.esm.min.mjs').then(function (mod) {
        var mermaid = mod.default;
        renderAll(mermaid);
        document.addEventListener('themechange', function () { renderAll(mermaid); });
      }).catch(function () {
        diagrams.forEach(function (fig) {
          fig.innerHTML = '<pre><code></code></pre>';
          fig.querySelector('code').textContent = fig.dataset.src;
        });
      });
    }

    /* Animated SVG diagrams: honour reduced motion, add a replay control */
    $$('figure.diagram-anim', prose).forEach(function (fig) {
      var svg = fig.querySelector('svg');
      if (!svg || !svg.pauseAnimations) return;
      var btn = document.createElement('button');
      btn.className = 'diagram-btn mono'; btn.type = 'button';
      var setLabel = function () { btn.innerHTML = svg.animationsPaused() ? '<i class="fas fa-play"></i> play' : '<i class="fas fa-pause"></i> pause'; };
      btn.addEventListener('click', function () {
        if (svg.animationsPaused()) svg.unpauseAnimations(); else svg.pauseAnimations();
        setLabel();
      });
      if (reduceMotion) svg.pauseAnimations();
      fig.appendChild(btn); setLabel();
    });

    $$('div.highlighter-rouge', prose).forEach(function (block) {
      var m = block.className.match(/language-(\w+)/);
      if (m && m[1] !== 'plaintext') {
        var lang = document.createElement('span'); lang.className = 'code-lang'; lang.textContent = m[1];
        block.appendChild(lang);
      }
      var btn = document.createElement('button');
      btn.className = 'copy-btn'; btn.type = 'button'; btn.textContent = 'copy';
      btn.addEventListener('click', function () {
        var code = block.querySelector('code');
        if (!code || !navigator.clipboard) return;
        navigator.clipboard.writeText(code.innerText).then(function () {
          btn.textContent = 'copied ✓'; setTimeout(function () { btn.textContent = 'copy'; }, 1400);
        });
      });
      block.appendChild(btn);
    });

    var bar = $('.read-progress');
    var onScroll = function () {
      var r = prose.getBoundingClientRect();
      var total = r.height - window.innerHeight;
      var pct = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
      bar.style.width = (pct * 100) + '%';
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* Command palette (⌘K / Ctrl+K or "/") */
  var pal = $('#palette'), input = $('#palette-input'), list = $('#palette-results');
  var index = window.SEARCH_INDEX || [], sel = 0, results = [];
  var esc = function (s) { return String(s || '').replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var render = function () {
    var q = input.value.toLowerCase().trim();
    results = index.filter(function (it) {
      if (!q) return true;
      return (it.t + ' ' + (it.d || '') + ' ' + (it.g || '')).toLowerCase().indexOf(q) > -1;
    }).slice(0, 12);
    sel = Math.min(sel, Math.max(0, results.length - 1));
    list.innerHTML = results.length ? results.map(function (it, i) {
      return '<li class="' + (i === sel ? 'sel' : '') + '"><a href="' + esc(it.u) + '"><span class="pr-kind">' + esc(it.k) + '</span><span class="pr-title">' + esc(it.t) + '</span>' + (it.d ? '<span class="pr-sub">' + esc(it.d) + '</span>' : '') + '</a></li>';
    }).join('') : '<li class="muted mono" style="padding:12px">// nothing found</li>';
  };
  var openPal = function () { pal.hidden = false; input.value = ''; sel = 0; render(); setTimeout(function () { input.focus(); }, 10); };
  var closePal = function () { pal.hidden = true; };
  if (pal) {
    $('#open-palette').addEventListener('click', openPal);
    pal.addEventListener('click', function (e) { if (e.target.hasAttribute('data-close')) closePal(); });
    input.addEventListener('input', function () { sel = 0; render(); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(sel + 1, results.length - 1); render(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(sel - 1, 0); render(); }
      else if (e.key === 'Enter' && results[sel]) { location.href = results[sel].u; }
    });
    document.addEventListener('keydown', function (e) {
      var typing = /INPUT|TEXTAREA/.test(document.activeElement.tagName);
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing && pal.hidden)) { e.preventDefault(); pal.hidden ? openPal() : closePal(); }
      else if (e.key === 'Escape' && !pal.hidden) closePal();
    });
  }
})();
