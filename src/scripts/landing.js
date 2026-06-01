// dreamcat.app 랜딩 페이지 부트 스크립트.
// Astro 가 이 파일을 chunk 로 번들 + @rive-app/canvas 같은 npm 패키지를 정상 resolve.
// JSON 데이터는 index.astro 의 <script id="i18n-data"> 에서 DOM 으로 읽음.

import { Rive, Layout, Fit, Alignment } from '@rive-app/canvas';

// ───────── i18n ─────────
const dataEl = document.getElementById('i18n-data');
const I18N = dataEl ? JSON.parse(dataEl.textContent) : {};
const SUPPORTED = ['ko', 'en', 'ja', 'zh-TW'];

function detectLang() {
  const url = new URLSearchParams(location.search);
  const q = url.get('lang');
  if (q && SUPPORTED.includes(q)) return q;
  try {
    const stored = localStorage.getItem('dc_lang');
    if (stored && SUPPORTED.includes(stored)) return stored;
  } catch (e) {}
  const langs = navigator.languages?.length ? navigator.languages : [navigator.language || 'en'];
  for (const raw of langs) {
    const l = (raw || '').toLowerCase();
    if (l.startsWith('ko')) return 'ko';
    if (l.startsWith('ja')) return 'ja';
    if (l.startsWith('zh')) {
      if (l.includes('hant') || l.includes('tw') || l.includes('hk') || l.includes('mo')) return 'zh-TW';
    }
    if (l.startsWith('en')) return 'en';
  }
  return 'en';
}

function getDeep(obj, path) {
  return path.split('.').reduce((a, k) => (a == null ? undefined : a[k]), obj);
}

function applyLang(lang) {
  if (!SUPPORTED.includes(lang)) lang = 'ko';
  const D = I18N[lang];
  if (!D) return;

  document.documentElement.lang = D.htmlLang;
  document.title = D.title;
  const meta = document.getElementById('meta-desc');
  if (meta) meta.setAttribute('content', D.metaDesc);

  document.querySelectorAll('[data-tr]').forEach((el) => {
    const v = getDeep(D, el.getAttribute('data-tr'));
    if (typeof v === 'string') el.textContent = v;
  });
  document.querySelectorAll('[data-tr-html]').forEach((el) => {
    const v = getDeep(D, el.getAttribute('data-tr-html'));
    if (typeof v === 'string') el.innerHTML = v.replace(/\n/g, '<br/>');
  });

  const heroSub = document.querySelector('[data-tr="hero.sub"]');
  if (heroSub && D.hero?.sub) heroSub.innerHTML = D.hero.sub.replace(/\n/g, '<br/>');

  const labels = { ko: '한국어', en: 'English', ja: '日本語', 'zh-TW': '繁體中文' };
  document.querySelectorAll('[data-active-lang]').forEach((el) => {
    el.textContent = labels[lang];
  });

  document.querySelectorAll('[data-shot-key]').forEach((el) => {
    const key = el.getAttribute('data-shot-key');
    const img = el.querySelector('img');
    if (img) {
      img.src = `/screenshots/${lang}/${key}.jpg`;
      const altKey = el.getAttribute('data-shot-alt-key');
      if (altKey) {
        const alt = getDeep(D, altKey);
        if (alt) img.alt = alt;
      }
    }
  });

  const iconList = ['btn_diary', 'btn_alarm', 'btn_timer', 'btn_sleep', 'btn_breath', 'btn_memo'];
  document.querySelectorAll('[data-feature-icon]').forEach((el) => {
    const i = parseInt(el.getAttribute('data-feature-icon'), 10);
    const iconName = D.features?.items?.[i]?.icon || iconList[i];
    el.src = `/icons/${iconName}.png`;
    el.alt = D.features?.items?.[i]?.title || '';
  });

  document.querySelectorAll('[data-lang-btn]').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-lang-btn') === lang);
  });

  try {
    localStorage.setItem('dc_lang', lang);
  } catch (e) {}
}

applyLang(detectLang());

// 언어 메뉴 토글
const langPop = document.querySelector('[data-popup="lang"]');
const langBtn = langPop?.querySelector('.lang-btn');
langBtn?.addEventListener('click', (e) => {
  e.stopPropagation();
  langPop.classList.toggle('open');
  langBtn.setAttribute('aria-expanded', String(langPop.classList.contains('open')));
});
document.addEventListener('click', () => langPop?.classList.remove('open'));
document.querySelectorAll('[data-lang-btn]').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    applyLang(btn.getAttribute('data-lang-btn'));
    langPop?.classList.remove('open');
  });
});

// ───────── Scroll reveal ─────────
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -80px 0px' }
  );
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
} else {
  document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in'));
}

// ───────── Sticky nav scroll state ─────────
const nav = document.querySelector('.topnav');
const onScroll = () => {
  if (window.scrollY > 24) nav?.classList.add('scrolled');
  else nav?.classList.remove('scrolled');
};
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

// ───────── Rive (cat.riv) ─────────
function tryInit(opts) {
  return new Promise((resolve) => {
    let settled = false;
    const done = (ok) => {
      if (!settled) {
        settled = true;
        resolve(ok);
      }
    };
    try {
      const r = new Rive({
        ...opts,
        onLoad: () => {
          try {
            r.resizeDrawingSurfaceToCanvas();
          } catch (e) {}
          console.log('[Rive] onLoad OK', opts.stateMachines || '(no SM)', opts.src);
          done(true);
        },
        onLoadError: (e) => {
          console.warn('[Rive] onLoadError', opts.stateMachines || '(no SM)', opts.src, e);
          done(false);
        },
      });
    } catch (e) {
      console.error('[Rive] init threw', e);
      done(false);
    }
  });
}

let riveLoaded = false;
async function loadRive() {
  if (riveLoaded) return;
  riveLoaded = true;
  const canvas = document.getElementById('cat-canvas');
  if (!canvas) return;

  const layout = new Layout({ fit: Fit.Contain, alignment: Alignment.Center });
  const base = { canvas, autoplay: true, layout };

  // 시도 체인: 가장 가능성 높은 것부터
  const attempts = [
    { ...base, src: '/rive/cat.riv', autoBind: true, stateMachines: 'Main' },
    { ...base, src: '/rive/cat.riv', autoBind: true, stateMachines: 'State Machine 1' },
    { ...base, src: '/rive/cat.riv', autoBind: true },
    { ...base, src: '/rive/cat.riv' },
    { ...base, src: '/rive/cat_idle.riv', autoBind: true },
    { ...base, src: '/rive/cat_idle.riv' },
  ];

  for (let i = 0; i < attempts.length; i++) {
    const ok = await tryInit(attempts[i]);
    if (ok) {
      canvas.classList.add('loaded');
      console.log('[Rive] ✅ success on attempt', i + 1);
      return;
    }
  }
  console.error('[Rive] all attempts failed — fallback PNG remains visible');
}

// hero 영역 진입 시 lazy load
const heroCat = document.querySelector('.hero-cat');
if (heroCat && 'IntersectionObserver' in window) {
  const ho = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        loadRive();
        ho.disconnect();
      }
    },
    { threshold: 0.05 }
  );
  ho.observe(heroCat);
} else {
  loadRive();
}
