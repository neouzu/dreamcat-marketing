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

// ───────── 랜덤 hero 배경 이미지 ─────────
// roomskin / garden 중에서 매번 다른 분위기로 깔림 (sky blue 위에 luminosity blend).
const HERO_BACKGROUNDS = [
  '/bg/roomskin_01.jpg',
  '/bg/roomskin_02.jpg',
  '/bg/roomskin_03.jpg',
  '/bg/roomskin_04.jpg',
  '/bg/roomskin_05.jpg',
  '/bg/roomskin_06.jpg',
  '/bg/roomskin_07.jpg',
  '/bg/roomskin_08.jpg',
  '/bg/roomskin_09.jpg',
  '/bg/bg_cat_room.jpg',
  '/bg/bg_garden_loop.jpg',
  '/bg/bg_garden_top.jpg',
];
(function setRandomHeroBg() {
  const el = document.getElementById('hero-bg-image');
  if (!el) return;
  const pick = HERO_BACKGROUNDS[Math.floor(Math.random() * HERO_BACKGROUNDS.length)];
  // 부드러운 fade-in
  const img = new Image();
  img.onload = () => {
    el.style.backgroundImage = `url('${pick}')`;
  };
  img.onerror = () => {
    /* 무시 — 단색 sky blue 만 보임 */
  };
  img.src = pick;
})();

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
// 앱과 동일하게 'Main' SM + ViewModel Data Binding (autoBind: true).
// + 랜덤 의상 적용 + 마우스 시선 추적 (eyeGazeX/Y).
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function setVmNumber(vm, name, value) {
  if (!vm) return;
  try {
    const prop = vm.number(name);
    if (prop) prop.value = value;
  } catch (e) {
    /* prop 없음 — 무시 */
  }
}

function applyRandomOutfit(vm) {
  if (!vm) return;
  // 슬롯별 사용 가능 인덱스 (app 의 catItems.ts 기준).
  // 0 = 없음. 일부 슬롯은 자주 안 노출되게 70% 확률로만 활성.
  const equip = (chance, min, max) => (Math.random() < chance ? randInt(min, max) : 0);

  setVmNumber(vm, 'topIndex', equip(0.85, 1, 6));      // 상의 1~6
  setVmNumber(vm, 'bottomIndex', equip(0.85, 1, 8));   // 하의 1~8
  setVmNumber(vm, 'hatIndex', equip(0.55, 1, 6));      // 모자 — 가끔만
  setVmNumber(vm, 'glassesIndex', equip(0.4, 1, 4));   // 안경 — 가끔만
  setVmNumber(vm, 'shoesIndex', equip(0.7, 1, 4));     // 신발
  setVmNumber(vm, 'necklaceIndex', equip(0.3, 1, 3));  // 목걸이 — 가끔만
  setVmNumber(vm, 'bagLeftIndex', equip(0.25, 1, 4));  // 왼쪽 가방
  setVmNumber(vm, 'bagRightIndex', equip(0.25, 1, 4)); // 오른쪽 가방
}

let riveLoaded = false;
let riveInstance = null;
let riveVm = null;
let lastMouse = { x: 0, y: 0 };
let gazeRafId = null;

function loadRive() {
  if (riveLoaded) return;
  riveLoaded = true;
  const canvas = document.getElementById('cat-canvas');
  if (!canvas) return;

  const r = new Rive({
    src: '/rive/cat.riv',
    canvas,
    autoplay: true,
    autoBind: true,
    stateMachines: 'Main',
    layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
    onLoad: () => {
      try {
        r.resizeDrawingSurfaceToCanvas();
      } catch (e) {}
      canvas.classList.add('loaded');
      riveInstance = r;
      // autoBind 로 자동 바인딩된 instance.
      // @rive-app/canvas v2 API: r.viewModelInstance
      try {
        riveVm = r.viewModelInstance || null;
      } catch (e) {
        riveVm = null;
      }
      if (riveVm) {
        applyRandomOutfit(riveVm);
        startMouseGaze();
      }
    },
  });
}

// ───────── 마우스 시선 추적 ─────────
function startMouseGaze() {
  const stage = document.querySelector('.hero-cat-stage');
  if (!stage) return;

  const onMove = (e) => {
    lastMouse.x = e.clientX;
    lastMouse.y = e.clientY;
    if (gazeRafId == null) {
      gazeRafId = requestAnimationFrame(updateGaze);
    }
  };

  function updateGaze() {
    gazeRafId = null;
    if (!riveVm) return;
    const rect = stage.getBoundingClientRect();
    // 캐릭터 얼굴 중심 추정 — 스테이지의 중상단.
    const faceCx = rect.left + rect.width * 0.5;
    const faceCy = rect.top + rect.height * 0.42;
    const dx = lastMouse.x - faceCx;
    // 화면 좌표 y 는 아래로 증가, Rive eyeGazeY 는 위가 양수 → 부호 뒤집기.
    const dy = faceCy - lastMouse.y;
    // 화면 전체 절반 거리를 1로 정규화 (멀리 있어도 부드럽게).
    const norm = Math.max(window.innerWidth, window.innerHeight) * 0.5;
    let gx = dx / norm;
    let gy = dy / norm;
    // -1 ~ 1 클램프.
    gx = Math.max(-1, Math.min(1, gx));
    gy = Math.max(-1, Math.min(1, gy));
    setVmNumber(riveVm, 'eyeGazeX', gx);
    setVmNumber(riveVm, 'eyeGazeY', gy);
  }

  window.addEventListener('mousemove', onMove, { passive: true });

  // 터치 디바이스: pointer 도 캐치 (모바일 hover 안 됨)
  window.addEventListener('pointermove', onMove, { passive: true });
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
