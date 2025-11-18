(function () {
  'use strict';

  console.log('WEDAGO HOME JS – FINAL CSV WEDAGO-FRONTEND');

  // =========================
  //  INIT BERANDA (AMAN DI JAGEL)
  // =========================
  function initHome() {
    const prefersReduce =
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Hero slider (autoplay nonaktif kalau user pilih reduce motion)
    setupHeroSlider({
      interval: 6000,
      autoplay: !prefersReduce
    });

    // Efek tap di menu & wallet
    setupTapFeedback();

    // State awal beranda
    window.homeSetCategory('kuliner');
    window.homeSetView('grid');

    // Tombol toggle view (masonry / grid / list)
    setupViewToggleButtons();

    // Segmented kategori (pill)
    initSegKategori();

    // Load data kartu dari CSV
    loadBerandaKategori();
  }

  // Kalau DOM masih loading → tunggu DOMContentLoaded
  // Kalau sudah selesai → langsung jalankan initHome
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHome);
  } else {
    initHome();
  }

  // =========================
  //  HERO SLIDER (SWIPE + DOTS)
  // =========================
  function setupHeroSlider(options) {
    const hero = document.getElementById('wgHero');
    const track = document.getElementById('wgHeroTrack');
    const slides = track ? track.querySelectorAll('.wg-slide') : [];
    const dots = document.querySelectorAll('#wgHeroDots button');

    if (!hero || !track || slides.length <= 1 || dots.length !== slides.length) {
      return;
    }

    let index = 0;
    const intervalMs = (options && options.interval) || 6000;
    let timer = null;
    let isTouch = false;

    function goTo(i) {
      index = (i + slides.length) % slides.length;
      track.style.transform = 'translateX(-' + index * 100 + '%)';
      dots.forEach(function (d, idx) {
        d.classList.toggle('is-active', idx === index);
      });
    }

    function next() {
      goTo(index + 1);
    }

    function startAutoplay() {
      if (options && options.autoplay === false) return;
      stopAutoplay();
      timer = setInterval(next, intervalMs);
    }

    function stopAutoplay() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    // Klik dots
    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        goTo(i);
        startAutoplay();
      });
    });

    // Swipe sederhana
    let startX = 0;
    let currentX = 0;

    function onStart(e) {
      isTouch = e.type === 'touchstart';
      startX = isTouch ? e.touches[0].clientX : e.clientX;
      currentX = startX;
      hero.classList.add('dragging');
      stopAutoplay();
    }

    function onMove(e) {
      if (!hero.classList.contains('dragging')) return;
      currentX = isTouch ? e.touches[0].clientX : e.clientX;
      const delta = currentX - startX;
      const pct = (delta / hero.clientWidth) * 100;
      track.style.transform =
        'translateX(calc(-' + index * 100 + '% + ' + pct + '%))';
    }

    function onEnd() {
      if (!hero.classList.contains('dragging')) return;
      const delta = currentX - startX;
      hero.classList.remove('dragging');

      if (Math.abs(delta) > hero.clientWidth * 0.25) {
        if (delta < 0) next();
        else goTo(index - 1);
      } else {
        goTo(index);
      }
      startAutoplay();
    }

    hero.addEventListener('touchstart', onStart, { passive: true });
    hero.addEventListener('touchmove', onMove, { passive: true });
    hero.addEventListener('touchend', onEnd);
    hero.addEventListener('mousedown', onStart);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);

    goTo(0);
    startAutoplay();
  }

  // =========================
  //  TAP FEEDBACK
  // =========================
  function setupTapFeedback() {
    const els = document.querySelectorAll('.wg-menu a, .wg-wallet__action');
    els.forEach(function (el) {
      el.addEventListener(
        'pointerdown',
        function () {
          el.classList.add('is-touch');
        },
        { passive: true }
      );
      el.addEventListener(
        'pointerup',
        function () {
          el.classList.remove('is-touch');
        },
        { passive: true }
      );
      el.addEventListener(
        'pointercancel',
        function () {
          el.classList.remove('is-touch');
        },
        { passive: true }
      );
      el.addEventListener('blur', function () {
        el.classList.remove('is-touch');
      });
    });
  }

  // =========================
  //  VIEW TOGGLE
  // =========================
  window.homeSetView = function (mode) {
    const list = document.getElementById('homeList');
    if (!list) return;

    const bM = document.getElementById('home-btn-masonry');
    const bG = document.getElementById('home-btn-grid');
    const bL = document.getElementById('home-btn-list');

    list.classList.remove('masonry', 'grid', 'list');
    [bM, bG, bL].forEach(function (b) {
      if (b) b.setAttribute('aria-pressed', 'false');
    });

    if (mode === 'grid') {
      list.classList.add('grid');
      bG && bG.setAttribute('aria-pressed', 'true');
    } else if (mode === 'list') {
      list.classList.add('list');
      bL && bL.setAttribute('aria-pressed', 'true');
    } else {
      list.classList.add('masonry');
      bM && bM.setAttribute('aria-pressed', 'true');
    }
  };

  function setupViewToggleButtons() {
    const vBtns = [
      { id: 'home-btn-masonry', mode: 'masonry' },
      { id: 'home-btn-grid', mode: 'grid' },
      { id: 'home-btn-list', mode: 'list' }
    ];
    vBtns.forEach(function (cfg) {
      const el = document.getElementById(cfg.id);
      if (!el) return;
      el.addEventListener('click', function () {
        window.homeSetView(cfg.mode);
      });
    });
  }

  // =========================
  //  FILTER KATEGORI
  // =========================
  window.homeSetCategory = function (cat) {
    const cards = document.querySelectorAll('#homeList .home-card');
    cards.forEach(function (c) {
      if (!cat) {
        c.style.display = '';
        return;
      }
      c.style.display = c.classList.contains('cat-' + cat) ? '' : 'none';
    });
  };

  function catClass(kat) {
    const k = (kat || '').toLowerCase();
    if (k.includes('umkm')) return 'cat-umkm';
    if (k.includes('fresh')) return 'cat-fresh';
    if (k.includes('mart')) return 'cat-fresh';
    return 'cat-kuliner';
  }

  // =========================
  //  SEGMENTED KATEGORI (SEGPILL)
  // =========================
  function initSegKategori() {
    const pill = document.getElementById('segKategori');
    if (!pill) return;

    const btns = Array.prototype.slice.call(
      pill.querySelectorAll('.segpill__btn')
    );

    pill.style.setProperty('--seg-count', btns.length);

    function setActive(i) {
      pill.style.setProperty('--seg-index', i);

      btns.forEach(function (b, idx) {
        const on = idx === i;
        b.classList.toggle('active', on);
        b.setAttribute('aria-selected', on ? 'true' : 'false');
      });

      if (typeof window.homeSetCategory === 'function') {
        const cat = btns[i].dataset.cat;
        window.homeSetCategory(cat);
      }
    }

    btns.forEach(function (b, idx) {
      b.addEventListener('click', function () {
        setActive(idx);
      });
    });

    pill.addEventListener('keydown', function (e) {
      const i = btns.findIndex(function (b) {
        return b.classList.contains('active');
      });
      if (i < 0) return;

      if (e.key === 'ArrowRight') {
        const ni = (i + 1) % btns.length;
        setActive(ni);
        btns[ni].focus();
      }
      if (e.key === 'ArrowLeft') {
        const pi = (i - 1 + btns.length) % btns.length;
        setActive(pi);
        btns[pi].focus();
      }
      if (e.key === 'Home') {
        setActive(0);
        btns[0].focus();
      }
      if (e.key === 'End') {
        const last = btns.length - 1;
        setActive(last);
        btns[last].focus();
      }
    });

    setActive(0);
  }

  // =========================
  //  CSV LOADER KARTU BERANDA
  // =========================

  const CSV_URL_KATEGORI =
  'https://cdn.jsdelivr.net/gh/aishasanuddin14/WEDAGO-FRONTEND@main/csv/home_kategori.csv';


  function parseCSV(text) {
  const lines = text
    .split('\n')
    .map(function (l) {
      return l.trim();
    })
    .filter(function (l) {
      return l.length > 0;
    });

  if (!lines.length) return [];

  // === AUTO DETEK DELIMITER (; atau ,) ===
  var headerLine = lines[0];
  var delimiter = ';';

  // Kalau tidak ada ';' tapi ada ',' → pakai koma
  if (headerLine.indexOf(';') === -1 && headerLine.indexOf(',') !== -1) {
    delimiter = ',';
  }

  var header = headerLine.split(delimiter).map(function (h) {
    return h.trim();
  });

  return lines.slice(1).map(function (line) {
    var cols = line.split(delimiter);
    var obj = {};
    header.forEach(function (h, i) {
      obj[h] = (cols[i] || '').trim();
    });
    return obj;
  });
}


  async function loadBerandaKategori() {
    try {
      const res = await fetch(CSV_URL_KATEGORI, { cache: 'no-cache' });
      if (!res.ok) throw new Error('HTTP ' + res.status);

      const text = await res.text();
      const data = parseCSV(text);
      console.log('WEDAGO – rows CSV:', data.length);
      renderKategori(data);
    } catch (err) {
      console.error('Gagal load kategori:', err);
    }
  }

  function renderKategori(rows) {
    const container = document.querySelector('#homeList');
    if (!container) return;
    container.innerHTML = '';

    rows.forEach(function (row) {
        const name = row.name || row.nama || '';
        if (!name) return;

        const href = row.action_url || row.url_tindakan || row.web_url || row.url_web || '#';
        const img = row.drive_image_id || row.id_gambar_drive || 'https://via.placeholder.com/600x400?text=WedaGo';
        const tagline = row.tagline || '';
        const ratingRaw = row.rating || row.nilai || '';
        const rating = ratingRaw ? '⭐ ' + ratingRaw : '';
        const jarakRaw = row.jarak_km || row.jarak || '';
        const jarak = jarakRaw ? jarakRaw + ' km' : '';
        const status = row.status_buka || row.status || '';
        const kategori = row.kategori || row.category || row.kategori_pilihan || '';

        const art = document.createElement('article');
        art.className = 'home-card ' + catClass(kategori);
        art.innerHTML = `
            <a href="${href}">
                <img src="${img}" alt="${name}">
                <div class="body">
                    <h3 class="name">${name}</h3>
                    <p class="desc">${tagline}</p>
                    <div class="meta">
                        ${rating ? '<span>' + rating + '</span>' : ''}
                        ${jarak ? '<span>' + jarak + '</span>' : ''}
                        ${status ? '<span>' + status + '</span>' : ''}
                    </div>
                </div>
            </a>`;
        container.appendChild(art);
    });

    // === PERBAIKAN DI SINI ===
    // Jangan langsung filter kategori saat render selesai
    // Biarkan semua card tampil dulu, nanti segmented pill yang akan filter
    // Cukup pastikan kategori default sesuai pill pertama atau yang active
    const firstPill = document.querySelector('#segKategori .segpill__btn');
    if (firstPill) {
        const defaultCat = firstPill.dataset.cat || 'kuliner';
        // Force set ke kategori pertama (biasanya kuliner)
        window.homeSetCategory(''); // tampilkan semua dulu (opsional)
        setTimeout(() => {
            window.homeSetCategory(defaultCat);
        }, 100); // kasih jeda kecil biar initSegKategori() sempat nambahin class active
    }
}

  // =========================
  //  ROUTER RINGAN + BACK
  // =========================
  (function () {
    if (!history.state) {
      history.replaceState({ page: 'home' }, '', '#home');
    }

    function goHome() {
      if (typeof window.homeSetCategory === 'function') {
        window.homeSetCategory('kuliner');
      }
      if (typeof window.homeSetView === 'function') {
        window.homeSetView('grid');
      }
      window.scrollTo({
        top: 0,
        behavior: 'instant' in window ? 'instant' : 'auto'
      });
    }

    document.addEventListener(
      'click',
      function (e) {
        const a = e.target.closest('a[href]');
        if (!a) return;

        const href = a.getAttribute('href') || '';
        const isInternal =
          href.startsWith('action://') || href.startsWith('https://jgjk.mobi/');
        if (isInternal) {
          history.pushState({ page: 'inner', href: href }, '', '');
        }
      },
      { passive: true }
    );

    window.addEventListener('popstate', function (e) {
      if (e.state && e.state.page === 'inner') {
        goHome();
        history.replaceState({ page: 'home' }, '', '#home');
      } else {
        history.pushState({ page: 'home' }, '', '#home');
      }
    });

    document.addEventListener(
      'backbutton',
      function (e) {
        e.preventDefault();
        if (history.state && history.state.page === 'inner') {
          history.back();
        } else {
          history.pushState({ page: 'home' }, '', '#home');
        }
      },
      false
    );
  })();

  // =========================
  //  DEBUG OVERLAY (OPSIONAL)
  // =========================
  window.addEventListener('error', function (e) {
    const box = document.createElement('pre');
    box.style.cssText =
      'position:fixed;left:8px;bottom:8px;right:8px;' +
      'max-height:40vh;overflow:auto;background:#111;color:#0f0;' +
      'padding:8px;border-radius:8px;font:12px/1.4 monospace;z-index:99999';
    box.textContent = 'ERROR: ' + (e.message || e.error);
    document.body.appendChild(box);
  });

  window.addEventListener('unhandledrejection', function (e) {
    const box = document.createElement('pre');
    box.style.cssText =
      'position:fixed;left:8px;bottom:8px;right:8px;' +
      'max-height:40vh;overflow:auto;background:#111;color:#ff0;' +
      'padding:8px;border-radius:8px;font:12px/1.4 monospace;z-index:99999';
    box.textContent =
      'PROMISE: ' +
      (e.reason && e.reason.stack ? e.reason.stack : e.reason);
    document.body.appendChild(box);
  });
})();
