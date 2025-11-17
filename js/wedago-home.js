(function () {
  'use strict';

  // =========================
  //  DOM READY INIT
  // =========================
  document.addEventListener('DOMContentLoaded', function () {
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
  });

  // =========================
  //  HERO SLIDER (SWIPE + DOTS)
  // =========================
  function setupHeroSlider(options) {
    const hero  = document.getElementById('wgHero');
    const track = document.getElementById('wgHeroTrack');
    const slides = track ? track.querySelectorAll('.wg-slide') : [];
    const dots   = document.querySelectorAll('#wgHeroDots button');

    if (!hero || !track || slides.length <= 1 || dots.length !== slides.length) {
      return;
    }

    let index = 0;
    const intervalMs = (options && options.interval) || 6000;
    let timer = null;
    let isTouch = false;

    function goTo(i) {
      index = (i + slides.length) % slides.length;
      track.style.transform = 'translateX(-' + (index * 100) + '%)';
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
        'translateX(calc(-' + (index * 100) + '% + ' + pct + '%))';
    }

    function onEnd() {
      if (!hero.classList.contains('dragging')) return;
      const delta = currentX - startX;
      hero.classList.remove('dragging');

      if (Math.abs(delta) > hero.clientWidth * 0.25) {
        if (delta < 0) next();
        else goTo(index - 1);
      } else {
        goTo(index); // balik ke posisi awal
      }
      startAutoplay();
    }

    hero.addEventListener('touchstart', onStart, { passive: true });
    hero.addEventListener('touchmove', onMove, { passive: true });
    hero.addEventListener('touchend', onEnd);
    hero.addEventListener('mousedown', onStart);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);

    // Mulai
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

    // Default: index 0 (misal: Kuliner)
    setActive(0);
  }

  // =========================
  //  CSV LOADER KARTU BERANDA
  // =========================
  const CSV_URL_KATEGORI =
    'https://cdn.jsdelivr.net/gh/aishasanuddin14/beranda_kategori_csv/csv/home_kategori.csv';

  function parseCSV(text) {
    // Pecah per baris, buang yang kosong
    const lines = text
      .split('\n')
      .map(function (l) { return l.trim(); })
      .filter(function (l) { return l.length > 0; });

    if (!lines.length) return [];

    // Header pakai delimiter ;
    const header = lines[0].split(';').map(function (h) { return h.trim(); });

    return lines.slice(1).map(function (line) {
      const cols = line.split(';');
      const obj = {};

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
      if (!row.name || !row.drive_image_id) return;

      // drive_image_id di CSV kamu sudah berisi URL gambar full
      const img = row.drive_image_id;

      const href = row.action_url || row.web_url || '#';
      const tagline = row.tagline || '';
      const rating = row.rating ? '⭐ ' + row.rating : '';
      const jarak = row.jarak_km ? row.jarak_km + ' km' : '';
      const status = row.status_buka || '';
      const kategori = row.kategori || row.category || '';

      const art = document.createElement('article');
      art.className = 'home-card ' + catClass(kategori);
      art.innerHTML =
        '<a href="' + href + '">' +
          '<img src="' + img + '" alt="' + row.name + '">' +
          '<div class="body">' +
            '<h3 class="name">' + row.name + '</h3>' +
            '<p class="desc">' + tagline + '</p>' +
            '<div class="meta">' +
              (rating ? '<span>' + rating + '</span>' : '') +
              (jarak ? '<span>' + jarak + '</span>' : '') +
              (status ? '<span>' + status + '</span>' : '') +
            '</div>' +
          '</div>' +
        '</a>';

      container.appendChild(art);
    });

    // Setelah render, terapkan filter sesuai pill aktif (kalau ada)
    if (typeof window.homeSetCategory === 'function') {
      const activeBtn = document.querySelector(
        '#segKategori .segpill__btn.active'
      );
      const cat = activeBtn ? activeBtn.dataset.cat : 'kuliner';
      window.homeSetCategory(cat);
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


 // ===== DATA LOKAL (bisa nantinya diganti pipeline CSV) =====
  const data = [
    { name:'SNEKTAIM', action_url:'action://p/68a93cb680ac3', web_url:'https://jgjk.mobi/p/68a93cb680ac3', drive_image_id:'https://umkmdigital.app/api/listimage/v/SNEKTAIM-0-73568a93cb680ac3.jpg', rating:'4,9', kategori:'Kuliner' },
    { name:'90 Derajat', action_url:'action://p/68a9696da1653', web_url:'https://jgjk.mobi/p/68a9696da1653', drive_image_id:'https://umkmdigital.app/api/listimage/v/90-Derajat-0-77268a9696da1653.jpg', rating:'4,8', kategori:'Kuliner' },
    { name:'oneafreshealthy', action_url:'action://p/68e26afbd15b5', web_url:'https://jgjk.mobi/p/68e26afbd15b5', drive_image_id:'https://umkmdigital.app/api/listimage/v/oneafreshealthy-0-53768e26afbd15b5.jpg', rating:'4,8', kategori:'Kuliner' },
    { name:'RUMAH SELADA WEDANA', action_url:'action://p/691560a3711a6', web_url:'https://jgjk.mobi/p/691560a3711a6', drive_image_id:'https://umkmdigital.app/api/listimage/v/RUMAH-SELADA-WEDANA--0-865691560a3711a6.jpg', rating:'4,8', kategori:'Fresh Mart' },
    { name:'Tiga Putra', action_url:'action://p/68e1edd891fe7', web_url:'https://jgjk.mobi/p/68e1edd891fe7', drive_image_id:'https://umkmdigital.app/api/listimage/v/Tiga-Putra-0-35768e1edd891fe7.jpg', rating:'4,8', kategori:'Kuliner' },
    { name:'Putryarisa', action_url:'action://p/68e1d29baa0da', web_url:'https://jgjk.mobi/p/68e1d29baa0da', drive_image_id:'https://umkmdigital.app/api/listimage/v/Putryarisa-0-88768e1d29baa0da.jpg', rating:'4,8', kategori:'Kuliner' },
    { name:'LAPAK DAGING', action_url:'action://p/68d0e4a408af7', web_url:'https://jgjk.mobi/p/68d0e4a408af7', drive_image_id:'https://umkmdigital.app/api/listimage/v/LAPAL-DAGING-0-14768d0e4a408af7.jpg', rating:'4,8', kategori:'Fresh Mart' },
    { name:'PENJUAL KEPITING', action_url:'action://p/68d0e3990564a', web_url:'https://jgjk.mobi/p/68d0e3990564a', drive_image_id:'https://umkmdigital.app/api/listimage/v/PENJUAL-KEPITING-0-66968d0e3990564a.jpg', rating:'4,8', kategori:'Fresh Mart' },
    { name:'IKAN SEGAR', action_url:'action://p/68d0e38f330b2', web_url:'https://jgjk.mobi/p/68d0e38f330b2', drive_image_id:'https://umkmdigital.app/api/listimage/v/IKAN-SEGAR-0-25768d0e38f330b2.jpg', rating:'4,8', kategori:'Fresh Mart' },
    { name:'IKAN TORE WOYO KLA', action_url:'action://p/68d0c7eb8871d', web_url:'https://jgjk.mobi/p/68d0c7eb8871d', drive_image_id:'https://umkmdigital.app/api/listimage/v/IKAN-TORE-WOYO-KLA-0-76268d0c7eb8871d.jpg', rating:'4,8', kategori:'UMKM' },
    { name:'Were Creative', action_url:'action://p/68d0bf444e7f0', web_url:'https://jgjk.mobi/p/68d0bf444e7f0', drive_image_id:'https://umkmdigital.app/api/listimage/v/Were-Creative-0-58468d0bf444e7f0.jpg', rating:'4,8', kategori:'UMKM' },
    { name:'Lapak Ci Ida', action_url:'action://p/68cbdfdc81d25', web_url:'https://jgjk.mobi/p/68cbdfdc81d25', drive_image_id:'https://umkmdigital.app/api/listimage/v/Lapak-Ci-Ida-0-43568cbdfdc81d25.jpg', rating:'4,8', kategori:'Fresh Mart' },
    { name:'DPRCOFFEESTREET', action_url:'action://p/68cad7a9b5c4f', web_url:'https://jgjk.mobi/p/68cad7a9b5c4f', drive_image_id:'https://umkmdigital.app/api/listimage/v/DPRCOFFEESTREET--0-85968cad7a9b5c4f.jpg', rating:'4,8', kategori:'Kuliner' },
    { name:'Teras Depan Kue Pia Weda', action_url:'action://p/68bf9289545fb', web_url:'https://jgjk.mobi/p/68bf9289545fb', drive_image_id:'https://umkmdigital.app/api/listimage/v/Teras-Depan-Kue-Pia-Weda-0-45968bf9289545fb.jpg', rating:'4,8', kategori:'Kuliner' },
    { name:'Lapak Sayur Om Anto', action_url:'action://p/68ab375a0cfe3', web_url:'https://jgjk.mobi/p/68ab375a0cfe3', drive_image_id:'https://umkmdigital.app/api/listimage/v/Lapak-Sayur-Om-Anto-0-83768ab375a0cfe3.jpg', rating:'4,8', kategori:'Fresh Mart' },
    { name:'PANGKALAN BUAH WEDA', action_url:'action://p/68ab33cc209cc', web_url:'https://jgjk.mobi/p/68ab33cc209cc', drive_image_id:'https://umkmdigital.app/api/listimage/v/PANGKALAN-BUAH-WEDA-0-38068ab33cc209cc.jpg', rating:'4,8', kategori:'Fresh Mart' },
    { name:'Bengkel Kreatif Cogoipa', action_url:'action://p/68ab316503d2f', web_url:'https://jgjk.mobi/p/68ab316503d2f', drive_image_id:'https://umkmdigital.app/api/listimage/v/Bengkel-Kreatif-Cogoipa-0-70968ab316503d2f.jpg', rating:'4,8', kategori:'UMKM' }
  ];

