// dreamcat.app 랜딩 페이지 부트 스크립트.
// Astro 가 이 파일을 chunk 로 번들 + @rive-app/canvas 같은 npm 패키지를 정상 resolve.
// JSON 데이터는 index.astro 의 <script id="i18n-data"> 에서 DOM 으로 읽음.

import { Rive, Layout, Fit, Alignment } from '@rive-app/canvas';

// ───────── i18n ─────────
const dataEl = document.getElementById('i18n-data');
const I18N = dataEl ? JSON.parse(dataEl.textContent) : {};
const SUPPORTED = ['ko', 'en', 'ja', 'zh-CN', 'zh-TW', 'es', 'pt-BR', 'de', 'fr'];
// 스크린샷이 존재하는 언어 — 나머지는 'en' 폴더로 fallback.
const SHOT_LANGS = new Set(['ko', 'en', 'ja', 'zh-TW']);

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
      return 'zh-CN';
    }
    if (l.startsWith('es')) return 'es';
    if (l.startsWith('pt')) return 'pt-BR';
    if (l.startsWith('de')) return 'de';
    if (l.startsWith('fr')) return 'fr';
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
    if (typeof v === 'string') {
      // \n 이 있으면 <br/> 로 자동 변환 — 카피 줄바꿈 의도 살리기 위해
      if (v.indexOf('\n') >= 0) el.innerHTML = v.replace(/\n/g, '<br/>');
      else el.textContent = v;
    }
  });
  document.querySelectorAll('[data-tr-html]').forEach((el) => {
    const v = getDeep(D, el.getAttribute('data-tr-html'));
    if (typeof v === 'string') el.innerHTML = v.replace(/\n/g, '<br/>');
  });

  const heroSub = document.querySelector('[data-tr="hero.sub"]');
  if (heroSub && D.hero?.sub) heroSub.innerHTML = D.hero.sub.replace(/\n/g, '<br/>');

  const labels = {
    ko: '한국어',
    en: 'English',
    ja: '日本語',
    'zh-CN': '简体中文',
    'zh-TW': '繁體中文',
    es: 'Español',
    'pt-BR': 'Português',
    de: 'Deutsch',
    fr: 'Français',
  };
  document.querySelectorAll('[data-active-lang]').forEach((el) => {
    el.textContent = labels[lang] || lang;
  });

  // 스크린샷 — 4개 언어 (ko/en/ja/zh-TW) 만 실제 있고, 나머지는 en 폴더로 fallback
  const shotLang = SHOT_LANGS.has(lang) ? lang : 'en';
  document.querySelectorAll('[data-shot-key]').forEach((el) => {
    const key = el.getAttribute('data-shot-key');
    const img = el.querySelector('img');
    if (img) {
      img.src = `/screenshots/${shotLang}/${key}.jpg`;
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

// ───────── Hero 배경 자동 교체 (5초마다 cross-fade) ─────────
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
const BG_INTERVAL_MS = 5000;
const BG_FADE_MS = 1200;

(function startBgCycle() {
  const layerA = document.querySelector('[data-bg-layer="a"]');
  const layerB = document.querySelector('[data-bg-layer="b"]');
  if (!layerA || !layerB) return;

  let activeLayer = layerA;
  let inactiveLayer = layerB;
  let lastIdx = -1;

  function nextIndex() {
    let i = Math.floor(Math.random() * HERO_BACKGROUNDS.length);
    if (i === lastIdx && HERO_BACKGROUNDS.length > 1) i = (i + 1) % HERO_BACKGROUNDS.length;
    lastIdx = i;
    return i;
  }

  function showNext() {
    const url = HERO_BACKGROUNDS[nextIndex()];
    const img = new Image();
    img.onload = () => {
      // 비활성 레이어에 새 이미지 로드 후 활성화 swap
      inactiveLayer.style.backgroundImage = `url('${url}')`;
      requestAnimationFrame(() => {
        inactiveLayer.classList.add('active');
        activeLayer.classList.remove('active');
        // swap roles
        const tmp = activeLayer;
        activeLayer = inactiveLayer;
        inactiveLayer = tmp;
      });
    };
    img.onerror = () => {};
    img.src = url;
  }

  // 첫 배경 즉시 표시
  showNext();
  // 5초 간격 cycle
  setInterval(showNext, BG_INTERVAL_MS);
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

// 슬롯별 인덱스 범위 (app 의 catItems.ts 카탈로그 기준).
const OUTFIT_SLOTS = [
  { name: 'topIndex', min: 1, max: 6 },
  { name: 'bottomIndex', min: 1, max: 8 },
  { name: 'hatIndex', min: 1, max: 6 },
  { name: 'glassesIndex', min: 1, max: 4 },
  { name: 'shoesIndex', min: 1, max: 4 },
  { name: 'necklaceIndex', min: 1, max: 3 },
  { name: 'bagLeftIndex', min: 1, max: 4 },
  { name: 'bagRightIndex', min: 1, max: 4 },
];

function applyRandomOutfit(vm) {
  if (!vm) return;
  const equip = (chance, min, max) => (Math.random() < chance ? randInt(min, max) : 0);

  // 상의/하의 — 무조건 입음 (안 입은 상태 금지).
  // bottom 1~7 (bt08 잠옷 🌙 제외).
  setVmNumber(vm, 'topIndex', randInt(1, 6));
  setVmNumber(vm, 'bottomIndex', randInt(1, 7));

  // 액세서리 — 확률적으로 착용
  setVmNumber(vm, 'hatIndex', equip(0.55, 1, 6));
  setVmNumber(vm, 'glassesIndex', equip(0.4, 1, 4));
  setVmNumber(vm, 'shoesIndex', equip(0.7, 1, 4));
  setVmNumber(vm, 'necklaceIndex', equip(0.3, 1, 3));
  setVmNumber(vm, 'bagLeftIndex', equip(0.25, 1, 4));
  setVmNumber(vm, 'bagRightIndex', equip(0.25, 1, 4));

  // 명시적으로 끔 — 잠옷(원피스) / 의도 안 한 슬롯 누출 방지
  setVmNumber(vm, 'onepieceIndex', 0);
  setVmNumber(vm, 'glovesIndex', 0);
  setVmNumber(vm, 'backIndex', 0);
}

// 2초마다 전체 의상 랜덤 풀세팅.
let outfitTimerId = null;
function startOutfitCycle(vm) {
  if (!vm) return;
  if (outfitTimerId) clearInterval(outfitTimerId);
  outfitTimerId = setInterval(() => {
    if (!vm) return;
    applyRandomOutfit(vm);
  }, 2000);
}

// ───────── 표정 idle 루프 (앱 useCatAnimator 와 동일 패턴) ─────────
// cat.riv VM: eyeShapeIndex (0~7) / mouthIndex (0~7) / blushOn (0|1)
// 0:default 1:happy 2:blink 3:winkL 4:winkR 5:surprised 6:sad 7:sleepy (eye)
// 0:default 1:smile 2:open 3:yawn 4:pout 5:talkClosed 6:talkSmall 7:talkWide (mouth)
const IDLE_EXPRESSIONS = [
  // blink ×10 (가장 자주, 짧게)
  { eye: 2, mouth: 0, blush: 0, durationMs: 180 },
  { eye: 2, mouth: 0, blush: 0, durationMs: 160 },
  { eye: 2, mouth: 0, blush: 0, durationMs: 200 },
  { eye: 2, mouth: 0, blush: 0, durationMs: 170 },
  { eye: 2, mouth: 0, blush: 0, durationMs: 190 },
  { eye: 2, mouth: 0, blush: 0, durationMs: 175 },
  { eye: 2, mouth: 0, blush: 0, durationMs: 185 },
  { eye: 2, mouth: 0, blush: 0, durationMs: 165 },
  { eye: 2, mouth: 0, blush: 0, durationMs: 195 },
  { eye: 2, mouth: 0, blush: 0, durationMs: 178 },
  // 일반 표정
  { eye: 1, mouth: 1, blush: 0, durationMs: 2000 }, // happy + smile
  { eye: 1, mouth: 2, blush: 1, durationMs: 1800 }, // happy + open + blush
  { eye: 3, mouth: 1, blush: 0, durationMs: 200 },  // winkL + smile
  { eye: 4, mouth: 1, blush: 1, durationMs: 200 },  // winkR + smile + blush
  { eye: 7, mouth: 3, blush: 0, durationMs: 2000 }, // sleepy + yawn
  { eye: 0, mouth: 4, blush: 0, durationMs: 2000 }, // pout
  { eye: 0, mouth: 5, blush: 0, durationMs: 2000 }, // talkClosed
  { eye: 0, mouth: 6, blush: 0, durationMs: 2000 }, // talkSmall
  { eye: 0, mouth: 1, blush: 0, durationMs: 2000 }, // default + smile
];

function applyExpression(vm, eye, mouth, blush) {
  setVmNumber(vm, 'eyeShapeIndex', eye);
  setVmNumber(vm, 'mouthIndex', mouth);
  setVmNumber(vm, 'blushOn', blush);
}

let expressionTimerId = null;
function startExpressionCycle(vm) {
  if (!vm) return;
  if (expressionTimerId) clearTimeout(expressionTimerId);
  const loop = () => {
    const gapMs = 3000 + Math.random() * 2000; // 3~5초 간격
    expressionTimerId = setTimeout(() => {
      if (!vm) return;
      const e = IDLE_EXPRESSIONS[Math.floor(Math.random() * IDLE_EXPRESSIONS.length)];
      applyExpression(vm, e.eye, e.mouth, e.blush);
      expressionTimerId = setTimeout(() => {
        if (!vm) return;
        applyExpression(vm, 0, 0, 0); // 원상복귀
        loop();
      }, e.durationMs);
    }, gapMs);
  };
  loop();
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
        startOutfitCycle(riveVm);
        startExpressionCycle(riveVm);
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
