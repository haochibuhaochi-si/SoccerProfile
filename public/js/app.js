/**
 * 足球风格测试 H5 - 主应用逻辑
 */
const STORAGE_KEY = 'soccer_profile_answers';
const REPORT_KEY = 'soccer_profile_report';
const MODE_KEY = 'soccer_profile_mode';
const LITE_STYLE_COUNT = 12;
const FULL_QUIZ_COUNT = 35;
const UPGRADE_QUESTION_START = 13;
const PAYWALL_PRICES = { lite: 0.99, upgrade: 3.9, pro: 4.9 };
const UPGRADE_KEY = 'soccer_profile_upgrade_pending';
const LITE_LOCK_KEY = 'soccer_profile_lite_lock';

let questions = null;
let quizItems = [];
let quizMode = 'pro';
let currentIndex = 0;
let answers = {
  q0: [],
  map: {},
};
let reportData = null;
let isSharedView = false;
let silhouetteVariant = null;
let reportExpanded = false;
let quizAdvanceTimer = null;
let isAdvancingQuiz = false;

const LOADING_MSGS = [
  '正在读取你的比赛 DNA...',
  '正在匹配主 Archetype 与副型基因...',
  '正在计算 PlayLevel 与球探五维...',
  '正在渲染风格星图与球星卡主视觉...',
  '正在生成一份全面球探报告...',
];

const CARD_THEME_PRESETS = {
  legendGold: {
    accent: '#f7cf67',
    accent2: '#ff8d4d',
    foilA: '#fff0b5',
    foilB: '#ffb35c',
    glow: 'rgba(247, 207, 103, 0.55)',
    panel: 'rgba(10, 12, 20, 0.74)',
  },
  royalIce: {
    accent: '#7ae4ff',
    accent2: '#8caeff',
    foilA: '#e8fbff',
    foilB: '#7ad5ff',
    glow: 'rgba(122, 228, 255, 0.5)',
    panel: 'rgba(8, 14, 28, 0.74)',
  },
  infernoRed: {
    accent: '#ff6678',
    accent2: '#ffb347',
    foilA: '#ffd6dd',
    foilB: '#ff8757',
    glow: 'rgba(255, 102, 120, 0.52)',
    panel: 'rgba(20, 8, 14, 0.74)',
  },
  emeraldStrike: {
    accent: '#63e6be',
    accent2: '#b4ff61',
    foilA: '#dbfff3',
    foilB: '#89f06a',
    glow: 'rgba(99, 230, 190, 0.5)',
    panel: 'rgba(8, 18, 15, 0.74)',
  },
  holoPurple: {
    accent: '#c7a4ff',
    accent2: '#ff8be8',
    foilA: '#f3e6ff',
    foilB: '#b695ff',
    glow: 'rgba(199, 164, 255, 0.5)',
    panel: 'rgba(14, 10, 24, 0.74)',
  },
  obsidianChrome: {
    accent: '#d9dde8',
    accent2: '#6fb7ff',
    foilA: '#ffffff',
    foilB: '#bcc7d8',
    glow: 'rgba(217, 221, 232, 0.42)',
    panel: 'rgba(7, 9, 16, 0.8)',
  },
};

const ARCHETYPE_CARD_PROFILES = {
  F2_A: { family: 'defender', theme: 'royalIce', artCode: 'F2', artWord: 'ANCHOR' },
  F2_BS: { family: 'defender', theme: 'emeraldStrike', artCode: 'F2', artWord: 'BALLPLAY' },
  F2_AG: { family: 'defender', theme: 'infernoRed', artCode: 'F2', artWord: 'PRESS' },
  F2_FB: { family: 'defender', theme: 'royalIce', artCode: 'F2', artWord: 'LOCKDOWN' },
  F2_SW: { family: 'defender', theme: 'obsidianChrome', artCode: 'F2', artWord: 'SWEEPER' },
  F3_RO: { family: 'midfielder', theme: 'holoPurple', artCode: 'F3', artWord: 'REGISTA' },
  F3_DE: { family: 'midfielder', theme: 'emeraldStrike', artCode: 'F3', artWord: 'DESTROY' },
  F3_B2B: { family: 'midfielder', theme: 'legendGold', artCode: 'F3', artWord: 'B2B' },
  F3_AM: { family: 'midfielder', theme: 'holoPurple', artCode: 'F3', artWord: 'MAESTRO' },
  F3_CTR: { family: 'midfielder', theme: 'obsidianChrome', artCode: 'F3', artWord: 'CONTROL' },
  F3_CAR: { family: 'midfielder', theme: 'emeraldStrike', artCode: 'F3', artWord: 'CARRIER' },
  F3_HB: { family: 'midfielder', theme: 'royalIce', artCode: 'F3', artWord: 'SHIELD' },
  F3_SS: { family: 'midfielder', theme: 'infernoRed', artCode: 'F3', artWord: 'LATE RUN' },
  F4_CR: { family: 'wing', theme: 'legendGold', artCode: 'F4', artWord: 'CROSSER' },
  F4_IN: { family: 'wing', theme: 'infernoRed', artCode: 'F4', artWord: 'INSIDE' },
  F4_WB: { family: 'wing', theme: 'emeraldStrike', artCode: 'F4', artWord: 'WINGBACK' },
  F4_WP: { family: 'wing', theme: 'royalIce', artCode: 'F4', artWord: 'WIDE PLAY' },
  F4_SP: { family: 'wing', theme: 'infernoRed', artCode: 'F4', artWord: 'SPRINTER' },
  F5_PO: { family: 'striker', theme: 'legendGold', artCode: 'F5', artWord: 'POACHER' },
  F5_TG: { family: 'striker', theme: 'obsidianChrome', artCode: 'F5', artWord: 'TARGET' },
  F5_RF: { family: 'striker', theme: 'holoPurple', artCode: 'F5', artWord: 'RAUM' },
  F5_PF: { family: 'striker', theme: 'emeraldStrike', artCode: 'F5', artWord: 'PRESS 9' },
  F5_AF: { family: 'striker', theme: 'infernoRed', artCode: 'F5', artWord: 'ARROW' },
  F5_CF: { family: 'striker', theme: 'legendGold', artCode: 'F5', artWord: 'PHENOM' },
};

const CARD_ART_VERSION = '2025061218';

/** 高频中性原型：匹配后 A/B 版球星卡随机二选一，增加视觉多样性 */
const CARD_ART_VARIANT_POOL = {
  F3_RO: 'F3_RO_B',
  F3_CTR: 'F3_CTR_B',
  F3_CAR: 'F3_CAR_B',
  F3_B2B: 'F3_B2B_B',
  F5_PO: 'F5_PO_B',
  F5_TG: 'F5_TG_B',
  F4_IN: 'F4_IN_B',
  F2_SW: 'F2_SW_B',
};

function getCardArtUrl(assetId) {
  return `./assets/scout-cards/${assetId}.png?v=${CARD_ART_VERSION}`;
}

const CARD_ART_ASSETS = Object.fromEntries(
  Object.keys(ARCHETYPE_CARD_PROFILES).map((id) => [id, getCardArtUrl(id)]),
);

function getLitePrimaryLock() {
  try {
    const raw = localStorage.getItem(LITE_LOCK_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function embedLockFields(data) {
  if (!data?.archetype_id) return data;
  data.locked_primary_id = data.locked_primary_id || data.archetype_id;
  data.locked_card_art_asset_id =
    data.locked_card_art_asset_id || data.card_art_asset_id || data.archetype_id;
  data.locked_card_variant = data.locked_card_variant || data.card_art_variant || 'A';
  return data;
}

function saveLitePrimaryLock(data) {
  if (!data?.archetype_id) return;
  embedLockFields(data);
  localStorage.setItem(
    LITE_LOCK_KEY,
    JSON.stringify({
      primary_archetype_id: data.locked_primary_id || data.archetype_id,
      archetype_title: data.archetype_title,
      card_art_asset_id: data.locked_card_art_asset_id || data.card_art_asset_id || data.archetype_id,
      card_art_variant: data.locked_card_variant || data.card_art_variant || 'A',
    }),
  );
}

function shouldPreserveCardLock(data) {
  return Boolean(
    data?.primary_locked ||
    data?.locked_primary_id ||
    data?.locked_card_art_asset_id ||
    getLitePrimaryLock()?.primary_archetype_id,
  );
}

function applyLiteUpgradeContinuity(data) {
  if (!data) return data;
  const lock = getLitePrimaryLock();
  const primaryId = lock?.primary_archetype_id || data.locked_primary_id;
  const cardArt = lock?.card_art_asset_id || data.locked_card_art_asset_id;
  const cardVariant = lock?.card_art_variant || data.locked_card_variant;
  if (!primaryId && !cardArt) return data;

  data.primary_locked = true;
  if (primaryId) {
    data.locked_primary_id = primaryId;
    data.archetype_id = primaryId;
    if (lock?.archetype_title) data.archetype_title = lock.archetype_title;
  }
  if (cardArt) {
    data.locked_card_art_asset_id = cardArt;
    data.card_art_asset_id = cardArt;
  }
  if (cardVariant) {
    data.locked_card_variant = cardVariant;
    data.card_art_variant = cardVariant;
  }
  return data;
}

function ensureLitePrimaryLock() {
  if (getLitePrimaryLock()?.primary_archetype_id) return true;
  try {
    const cached = localStorage.getItem(REPORT_KEY);
    if (!cached) return false;
    const data = JSON.parse(cached);
    const primaryId = data.locked_primary_id || data.archetype_id;
    if (primaryId && (data.report_tier === 'lite' || data.locked_card_art_asset_id)) {
      saveLitePrimaryLock({
        archetype_id: primaryId,
        archetype_title: data.archetype_title,
        card_art_asset_id: data.locked_card_art_asset_id || data.card_art_asset_id || primaryId,
        card_art_variant: data.locked_card_variant || data.card_art_variant || 'A',
        locked_primary_id: primaryId,
        locked_card_art_asset_id: data.locked_card_art_asset_id || data.card_art_asset_id || primaryId,
        locked_card_variant: data.locked_card_variant || data.card_art_variant || 'A',
      });
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

/** 为报告锁定一张球星卡素材（同次测试内保持一致） */
function assignCardArtVariant(data, options = {}) {
  if (!data?.archetype_id) return data;
  if (options.preserveLiteLock || shouldPreserveCardLock(data)) {
    return applyLiteUpgradeContinuity(data);
  }
  const altId = CARD_ART_VARIANT_POOL[data.archetype_id];
  if (!altId || data.card_art_asset_id) return data;
  const useAlt = Math.random() < 0.5;
  data.card_art_asset_id = useAlt ? altId : data.archetype_id;
  data.card_art_variant = useAlt ? 'B' : 'A';
  embedLockFields(data);
  return data;
}

function resolveCardArtAssetId(data) {
  if (shouldPreserveCardLock(data)) {
    applyLiteUpgradeContinuity(data);
  } else if (!data?.card_art_asset_id) {
    assignCardArtVariant(data);
  }
  return data?.card_art_asset_id || data?.archetype_id || 'F3_B2B';
}

const CARD_RENDER_TARGETS = {
  main: {
    card: 'player-card',
    illustration: 'player-illustration',
    fallback: 'card-art-fallback',
    radar: 'card-radar',
    fields: {
      archetypeId: 'card-archetype-id',
      rating: 'card-rating',
      title: 'card-title',
      playlevel: 'card-playlevel',
      match: 'card-match',
      tagline: 'card-tagline',
      kicker: 'card-kicker',
      artCode: 'card-art-code',
      artWord: 'card-art-word',
    },
  },
  share: {
    card: 'share-player-card',
    illustration: 'share-player-illustration',
    fallback: 'share-card-art-fallback',
    radar: null,
    fields: {
      archetypeId: 'share-card-archetype-id',
      rating: 'share-card-rating',
      title: 'share-card-title',
      playlevel: 'share-card-playlevel',
      match: 'share-card-match',
      tagline: 'share-card-tagline',
      kicker: 'share-card-kicker',
      artCode: 'share-card-art-code',
      artWord: 'share-card-art-word',
    },
  },
};

const $ = (id) => document.getElementById(id);

function showStep(stepId) {
  document.querySelectorAll('.step').forEach((el) => {
    el.classList.toggle('active', el.id === stepId);
  });
}

function buildAllQuizItems() {
  return [
    { part: '基本信息', type: 'checkbox', data: questions.q0, answerKey: 'q0' },
    ...questions.style.map((q, styleIndex) => ({
      part: '风格定位',
      type: 'radio',
      data: q,
      answerKey: 'style',
      styleIndex,
    })),
    ...questions.intensity.map((q, intensityIndex) => ({
      part: '强度与环境',
      type: 'radio',
      data: q,
      answerKey: 'intensity',
      intensityIndex,
    })),
    ...questions.literacy.map((q, literacyIndex) => ({
      part: '战术素养',
      type: 'radio',
      data: q,
      answerKey: 'literacy',
      literacyIndex,
    })),
  ];
}

function buildQuizItems(mode = quizMode) {
  const allItems = buildAllQuizItems();
  if (mode === 'lite') {
    quizItems = [allItems[0], ...allItems.slice(1, 1 + LITE_STYLE_COUNT)];
    return;
  }
  quizItems = allItems;
}

function pickDefaultOptionKey(question) {
  const options = question?.options || [];
  if (!options.length) return null;
  const middle = options[Math.floor((options.length - 1) / 2)];
  return middle?.key ?? options[0].key;
}

function buildUpgradeQuizItems() {
  const allItems = buildAllQuizItems();
  const styleEnd = 1 + questions.style.length;
  quizItems = [
    ...allItems.slice(1 + LITE_STYLE_COUNT, styleEnd),
    ...allItems.slice(styleEnd),
  ];
}

function isLiteReportMode(mode = quizMode) {
  return mode === 'lite';
}

/** 报告展示仅以 report_tier 为准，避免 upgrade 流程与直接 Pro 版版式不一致 */
function isLiteReportData(data) {
  return data?.report_tier === 'lite';
}

function isUpgradePending() {
  return localStorage.getItem(UPGRADE_KEY) === '1';
}

function resetQuizSession() {
  answers = { q0: [], map: {} };
  currentIndex = 0;
  isAdvancingQuiz = false;
  if (quizAdvanceTimer) {
    clearTimeout(quizAdvanceTimer);
    quizAdvanceTimer = null;
  }
}

function startQuiz(mode) {
  if (!questions) {
    alert('题库尚未加载完成，请刷新页面后重试');
    return;
  }

  quizMode = mode === 'lite' ? 'lite' : 'pro';
  localStorage.setItem(MODE_KEY, quizMode);
  resetQuizSession();
  buildQuizItems(quizMode);
  showStep('step-quiz');
  renderQuestion();
}

function bindQuizTierButtons() {
  const pricing = document.querySelector('.welcome-pricing');
  if (!pricing || pricing.dataset.bound === '1') return;
  pricing.dataset.bound = '1';

  pricing.addEventListener('click', (event) => {
    const liteBtn = event.target.closest('#btn-start-lite');
    const proBtn = event.target.closest('#btn-start-pro');
    if (liteBtn) {
      event.preventDefault();
      startQuiz('lite');
      return;
    }
    if (proBtn) {
      event.preventDefault();
      startQuiz('pro');
    }
  });
}

function getQuestionKey(item) {
  if (item.answerKey === 'q0') return '__q0__';
  return item.data?.id || item.answerKey;
}

function getAnswerForItem(item) {
  if (item.answerKey === 'q0') return answers.q0;
  return answers.map[getQuestionKey(item)] ?? null;
}

function setAnswerForItem(item, value) {
  if (item.answerKey === 'q0') {
    answers.q0 = value;
    return;
  }
  answers.map[getQuestionKey(item)] = value;
}

function buildSubmitPayload() {
  const payload = {
    q0: [...(answers.q0 || [])],
    style: questions.style.map((q) => answers.map[q.id] ?? null),
    intensity: questions.intensity.map((q) => answers.map[q.id] ?? null),
    literacy: questions.literacy.map((q) => answers.map[q.id] ?? null),
  };
  if (quizMode === 'lite') {
    payload.report_tier = 'lite';
  }
  if (quizMode === 'upgrade') {
    payload.report_tier = 'pro';
    const lock = getLitePrimaryLock();
    if (lock?.primary_archetype_id) {
      payload.locked_primary_id = lock.primary_archetype_id;
    }
  }
  return payload;
}

function findFirstUnansweredIndex() {
  for (let i = 0; i < quizItems.length; i += 1) {
    const item = quizItems[i];
    const ans = getAnswerForItem(item);
    if (item.type === 'checkbox') {
      if (!Array.isArray(ans) || ans.length === 0) return i;
    } else if (ans == null || ans === '') {
      return i;
    }
  }
  return -1;
}

function gotoFirstUnanswered() {
  const idx = findFirstUnansweredIndex();
  if (idx >= 0) {
    isAdvancingQuiz = false;
    if (quizAdvanceTimer) {
      clearTimeout(quizAdvanceTimer);
      quizAdvanceTimer = null;
    }
    currentIndex = idx;
    renderQuestion();
  }
}

function validateSubmitPayload(payload, mode = quizMode) {
  if (!Array.isArray(payload.q0) || payload.q0.length === 0) {
    return '请至少选择一个场上位置';
  }

  if (mode === 'lite') {
    let answered = 0;
    for (let i = 0; i < LITE_STYLE_COUNT; i += 1) {
      if (payload.style[i] != null && payload.style[i] !== '') answered += 1;
    }
    if (answered < LITE_STYLE_COUNT) {
      return `风格题未完成（${answered}/${LITE_STYLE_COUNT}）`;
    }
    return null;
  }

  if (mode === 'upgrade') {
    for (let i = LITE_STYLE_COUNT; i < questions.style.length; i += 1) {
      if (payload.style[i] == null || payload.style[i] === '') {
        return `风格题未完成，请完成剩余 Part1 题目（P${i + 1}）`;
      }
    }
    const upgradeChecks = [
      ['intensity', '强度', questions.intensity.length],
      ['literacy', '素养', questions.literacy.length],
    ];
    for (const [key, label, expected] of upgradeChecks) {
      const list = payload[key];
      let answered = 0;
      for (let i = 0; i < expected; i += 1) {
        if (list[i] != null && list[i] !== '') answered += 1;
      }
      if (answered < expected) {
        return `${label}题未完成（${answered}/${expected}）`;
      }
    }
    return null;
  }

  const checks = [
    ['style', '风格', questions.style.length],
    ['intensity', '强度', questions.intensity.length],
    ['literacy', '素养', questions.literacy.length],
  ];

  for (const [key, label, expected] of checks) {
    const list = payload[key];
    let answered = 0;
    for (let i = 0; i < expected; i += 1) {
      if (list[i] != null && list[i] !== '') answered += 1;
    }
    if (answered < expected) {
      const missing = questions[key]
        .filter((q, i) => list[i] == null || list[i] === '')
        .map((q) => q.id)
        .join('、');
      return `${label}题未完成（${answered}/${expected}）${missing ? `，缺：${missing}` : ''}`;
    }
  }

  return null;
}

/** S1–S10 选项展示时去掉括号内提示语，避免心理暗示；JSON 与计分 tags 不变 */
function formatIntensityOptionLabel(label) {
  return String(label)
    .replace(/[（(][^）)]*[）)]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getQuestionDisplayNumber(index = currentIndex) {
  if (quizMode === 'upgrade') {
    return UPGRADE_QUESTION_START + index;
  }
  return index + 1;
}

function getQuestionDisplayTotal() {
  if (quizMode === 'upgrade') {
    return FULL_QUIZ_COUNT;
  }
  return quizItems.length;
}

function renderQuestion() {
  const item = quizItems[currentIndex];
  const q = item.data;
  const total = quizItems.length;
  const displayNum = getQuestionDisplayNumber();
  const displayTotal = getQuestionDisplayTotal();

  $('progress-bar').style.width = `${(displayNum / displayTotal) * 100}%`;
  $('progress-text').textContent = `${displayNum} / ${displayTotal}`;
  $('part-badge').textContent = item.part;

  const wm = $('question-watermark');
  if (wm) wm.textContent = String(displayNum).padStart(2, '0');

  const prefix = q.id ? `${q.id}. ` : '';
  const titleText = q.text || (item.answerKey === 'q0' ? '你最常踢的位置是？（多选，最多2项）' : '');
  $('question-title').textContent = prefix + titleText;

  if (item.type === 'checkbox') {
    $('question-hint').textContent = '最多选择 2 项';
  } else {
    $('question-hint').textContent = '点击选项后自动进入下一题';
  }

  const container = $('options');
  container.innerHTML = '';
  const currentAns = getAnswerForItem(item);

  q.options.forEach((opt, optIdx) => {
    const el = document.createElement('div');
    el.className = 'option';
    const isSelected =
      item.type === 'checkbox'
        ? Array.isArray(currentAns) && currentAns.includes(opt.key)
        : currentAns === opt.key;
    if (isSelected) el.classList.add('selected');

    const keyLabel =
      item.type === 'checkbox' ? String(optIdx + 1) : opt.key;
    const displayLabel =
      item.answerKey === 'intensity'
        ? formatIntensityOptionLabel(opt.label)
        : opt.label;
    el.innerHTML = `
      <span class="option-key">${keyLabel}</span>
      <span class="option-label">${displayLabel}</span>
    `;

    el.addEventListener('click', () => onOptionClick(item, opt.key, el));
    container.appendChild(el);
  });

  $('btn-prev').disabled = currentIndex === 0;
  $('btn-next').textContent = currentIndex === total - 1 ? '提交答案' : '下一题';
}

function onOptionClick(item, key, el) {
  if (isAdvancingQuiz) return;

  if (item.type === 'checkbox') {
    let selected = [...(answers.q0 || [])];
    const idx = selected.indexOf(key);
    if (idx >= 0) selected.splice(idx, 1);
    else {
      if (selected.length >= 2) return;
      selected.push(key);
    }
    setAnswerForItem(item, selected);
    document.querySelectorAll('#options .option').forEach((node, i) => {
      const k = item.data.options[i]?.key;
      node.classList.toggle('selected', selected.includes(k));
    });
    if (selected.length > 0 && currentIndex < quizItems.length - 1) {
      $('btn-next').disabled = false;
    }
    return;
  }

  setAnswerForItem(item, key);
  document.querySelectorAll('#options .option').forEach((n) => n.classList.remove('selected'));
  el.classList.add('selected');

  isAdvancingQuiz = true;
  if (quizAdvanceTimer) clearTimeout(quizAdvanceTimer);
  quizAdvanceTimer = setTimeout(() => {
    quizAdvanceTimer = null;
    if (currentIndex < quizItems.length - 1) {
      currentIndex += 1;
      renderQuestion();
    } else {
      submitQuiz();
    }
    isAdvancingQuiz = false;
  }, 280);
}

function canProceed() {
  const item = quizItems[currentIndex];
  const ans = getAnswerForItem(item);
  if (item.type === 'checkbox') return Array.isArray(ans) && ans.length > 0;
  return !!ans;
}

function nextQuestion() {
  if (!canProceed()) {
    alert('请先选择答案');
    return;
  }
  if (currentIndex < quizItems.length - 1) {
    currentIndex += 1;
    renderQuestion();
  } else {
    submitQuiz();
  }
}

function prevQuestion() {
  if (currentIndex > 0) {
    currentIndex -= 1;
    renderQuestion();
  }
}

async function submitQuiz() {
  let payload = buildSubmitPayload();
  const submitMode = quizMode === 'upgrade' ? 'upgrade' : quizMode;
  const validationError = validateSubmitPayload(payload, submitMode);
  if (validationError) {
    alert(`${validationError}\n\n已跳转到第一道未完成的题目。`);
    gotoFirstUnanswered();
    return;
  }

  if (quizMode === 'upgrade') {
    payload.report_tier = 'pro';
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  localStorage.setItem(MODE_KEY, quizMode);
  if (quizMode === 'upgrade') {
    localStorage.setItem(UPGRADE_KEY, '1');
  }
  showStep('step-loading');

  let msgIdx = 0;
  const msgTimer = setInterval(() => {
    msgIdx = (msgIdx + 1) % LOADING_MSGS.length;
    $('loading-msg').textContent = LOADING_MSGS[msgIdx];
  }, 1200);

  if (!window.SoccerAPI?.submitAnswers) {
    clearInterval(msgTimer);
    alert(
      '页面资源加载不完整（API 模块未就绪）。\n\n请完全关闭页面后重新打开，或在浏览器中选择「强制刷新」后再试。'
    );
    showStep('step-quiz');
    return;
  }

  try {
    const minLoading = new Promise((resolve) => setTimeout(resolve, 2600));
    const [result] = await Promise.all([
      window.SoccerAPI.submitAnswers(payload),
      minLoading,
    ]);
    if (quizMode === 'lite') {
      reportData = assignCardArtVariant(result);
      embedLockFields(reportData);
      saveLitePrimaryLock(reportData);
    } else if (quizMode === 'upgrade') {
      result.report_tier = 'pro';
      reportData = assignCardArtVariant(result, { preserveLiteLock: true });
      embedLockFields(reportData);
    } else {
      reportData = assignCardArtVariant(result);
    }
    localStorage.setItem(REPORT_KEY, JSON.stringify(reportData));
    clearInterval(msgTimer);
    if (quizMode === 'upgrade') {
      localStorage.setItem(MODE_KEY, 'upgrade');
      localStorage.setItem(UPGRADE_KEY, '1');
    }
    showPaywallPreview(reportData);
    showStep('step-paywall');
  } catch (err) {
    clearInterval(msgTimer);
    console.error(err);
    alert(
      '报告生成失败：' +
        (err.message || '请检查云函数是否已部署') +
        '\n\n如刚更新过题库，请刷新页面后重新测试。'
    );
    showStep('step-quiz');
  }
}

function showPaywallPreview(data) {
  $('preview-title').textContent = data.archetype_title || '已匹配原型';
  const storedMode = localStorage.getItem(MODE_KEY);
  if (storedMode === 'lite' || storedMode === 'pro' || storedMode === 'upgrade') {
    quizMode = storedMode;
  }

  const isLite = isLiteReportData(data);
  const isUpgrade = !isLite && (quizMode === 'upgrade' || isUpgradePending());
  $('preview-score').textContent = isLite
    ? `Style Match · ${Math.round(data?.hybrid_percentage || 100)}%`
    : `PlayLevel · ${Number(data.playlevel_score ?? 0).toFixed(2)}`;

  const price = isUpgrade
    ? PAYWALL_PRICES.upgrade
    : PAYWALL_PRICES[quizMode] ?? PAYWALL_PRICES.pro;
  const priceEl = $('paywall-price');
  if (priceEl) priceEl.textContent = `¥${price}`;

  const titleEl = $('paywall-title');
  const descEl = $('paywall-desc');
  const noteEl = $('paywall-note');
  const unlockBtn = $('btn-unlock');
  if (isLite) {
    if (titleEl) titleEl.textContent = '解锁球迷版报告';
    if (descEl) descEl.textContent = '含专属球星卡、风格星图、核心解析与前两条训练建议';
    if (noteEl) noteEl.textContent = '一次解锁 · 可升级完整版';
    if (unlockBtn) unlockBtn.textContent = '解锁球迷版报告';
  } else if (isUpgrade) {
    if (titleEl) titleEl.textContent = '解锁完整版报告';
    if (descEl) descEl.textContent = '含十二维雷达、球探五维、短板深拆与风格参照系';
    if (noteEl) noteEl.textContent = '补差价解锁 · 永久查看';
    if (unlockBtn) unlockBtn.textContent = '解锁完整版报告';
    localStorage.removeItem(UPGRADE_KEY);
  } else {
    if (titleEl) titleEl.textContent = '解锁完整报告';
    if (descEl) descEl.textContent = '含雷达图、深度解析、强度分析、训练建议与风格参照系';
    if (noteEl) noteEl.textContent = '一次解锁 · 永久查看';
    if (unlockBtn) unlockBtn.textContent = '解锁我的报告';
  }
}

function getCardVariant(data) {
  if (silhouetteVariant) return silhouetteVariant;
  const seed = `${data?.archetype_id || 'F3_B2B'}-${data?.hybrid_percentage || 0}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 9973;
  }
  silhouetteVariant = (hash % 3) + 1;
  return silhouetteVariant;
}

function setCardText(id, value) {
  const el = $(id);
  if (el) el.textContent = value;
}

function applyCardTheme(card, profile) {
  const theme = CARD_THEME_PRESETS[profile.theme] || CARD_THEME_PRESETS.legendGold;
  card.style.setProperty('--card-accent', theme.accent);
  card.style.setProperty('--card-accent-2', theme.accent2);
  card.style.setProperty('--card-foil-a', theme.foilA);
  card.style.setProperty('--card-foil-b', theme.foilB);
  card.style.setProperty('--card-glow', theme.glow);
  card.style.setProperty('--card-panel', theme.panel);
}

function setupPlayerCardInteraction() {
  const card = $('player-card');
  if (!card) return;

  card.addEventListener('mouseenter', () => {
    card.classList.add('is-hover');
  });

  card.addEventListener('mouseleave', () => {
    card.classList.remove('is-hover');
    card.style.setProperty('--tilt-x', '0deg');
    card.style.setProperty('--tilt-y', '0deg');
    card.style.setProperty('--mx', '50%');
    card.style.setProperty('--my', '50%');
    card.style.setProperty('--foil-x', '50%');
    card.style.setProperty('--foil-y', '50%');
  });

  card.addEventListener('mousemove', (event) => {
    const rect = card.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    const rotateY = (px - 0.5) * 30;
    const rotateX = (0.5 - py) * 30;
    card.style.setProperty('--tilt-x', `${rotateX.toFixed(2)}deg`);
    card.style.setProperty('--tilt-y', `${rotateY.toFixed(2)}deg`);
    card.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
    card.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
    card.style.setProperty('--foil-x', `${(100 - px * 70).toFixed(1)}%`);
    card.style.setProperty('--foil-y', `${(py * 100).toFixed(1)}%`);
  });
}

const ARCHETYPE_ACTIONS = {
  F2_A: { lean: 0, head: [72, 40], body: [72, 92], arms: [[46, 88, 24, 108], [98, 88, 120, 108]], legs: [[58, 132, 48, 190], [86, 132, 96, 190]], shield: true },
  F2_BS: { lean: -4, head: [70, 38], body: [68, 90], arms: [[48, 86, 28, 72], [88, 88, 116, 86]], legs: [[58, 132, 40, 188], [82, 132, 104, 178]], ball: [114, 184], lines: [[24, 70, 6, 62], [116, 84, 136, 78]] },
  F2_AG: { lean: -18, head: [62, 42], body: [58, 98], arms: [[42, 94, 18, 118], [74, 92, 102, 82]], legs: [[50, 136, 18, 186], [72, 136, 118, 178]], ball: [24, 188], lines: [[12, 150, 34, 142], [18, 172, 44, 162]] },
  F2_FB: { lean: -8, head: [64, 40], body: [62, 94], arms: [[44, 90, 20, 92], [80, 90, 104, 104]], legs: [[54, 132, 36, 190], [76, 132, 112, 178]], line: [16, 194, 126, 194] },
  F2_SW: { lean: 5, head: [78, 38], body: [76, 90], arms: [[58, 86, 36, 76], [94, 86, 116, 70]], legs: [[66, 130, 52, 188], [88, 130, 112, 184]], sweep: true },
  F3_RO: { lean: 6, head: [76, 38], body: [74, 90], arms: [[56, 86, 36, 76], [92, 86, 120, 76]], legs: [[66, 132, 46, 188], [86, 132, 122, 178]], ball: [124, 182], lines: [[102, 176, 138, 160], [98, 166, 132, 142]] },
  F3_DE: { lean: -10, head: [66, 40], body: [64, 94], arms: [[46, 90, 18, 102], [82, 90, 108, 84]], legs: [[56, 134, 30, 190], [78, 134, 118, 176]], ball: [30, 190], shield: true },
  F3_B2B: { lean: -14, head: [66, 36], body: [62, 88], arms: [[44, 84, 18, 66], [80, 84, 110, 100]], legs: [[54, 128, 28, 190], [76, 128, 126, 166]], lines: [[18, 48, 4, 34], [112, 112, 138, 122]] },
  F3_AM: { lean: 10, head: [76, 38], body: [78, 92], arms: [[60, 88, 42, 110], [96, 88, 124, 78]], legs: [[68, 132, 54, 190], [90, 132, 120, 178]], ball: [126, 178], lines: [[104, 76, 132, 58], [106, 92, 138, 84]] },
  F3_CTR: { lean: 0, head: [72, 38], body: [72, 90], arms: [[54, 86, 30, 84], [90, 86, 114, 84]], legs: [[64, 132, 48, 188], [82, 132, 102, 188]], orbit: true },
  F3_CAR: { lean: -16, head: [62, 38], body: [60, 90], arms: [[42, 86, 18, 76], [78, 86, 106, 98]], legs: [[52, 130, 26, 190], [74, 130, 120, 168]], ball: [116, 170], lines: [[12, 84, 34, 92], [104, 150, 134, 140]] },
  F3_HB: { lean: 4, head: [74, 40], body: [74, 94], arms: [[56, 90, 32, 102], [92, 90, 116, 102]], legs: [[64, 134, 42, 188], [86, 134, 106, 188]], shield: true, line: [26, 160, 118, 160] },
  F3_SS: { lean: -12, head: [64, 38], body: [62, 90], arms: [[44, 86, 20, 76], [80, 86, 106, 72]], legs: [[54, 130, 34, 190], [76, 130, 122, 170]], ball: [124, 168], lines: [[98, 152, 134, 126], [16, 64, 4, 48]] },
  F4_CR: { lean: 12, head: [78, 38], body: [78, 90], arms: [[60, 86, 36, 74], [96, 86, 122, 94]], legs: [[68, 132, 44, 186], [90, 132, 128, 176]], ball: [128, 176], lines: [[110, 158, 140, 138], [108, 148, 138, 120]] },
  F4_IN: { lean: -8, head: [66, 38], body: [64, 90], arms: [[46, 86, 22, 94], [82, 86, 108, 70]], legs: [[56, 132, 36, 190], [78, 132, 120, 172]], ball: [118, 172], curl: true },
  F4_WB: { lean: -14, head: [62, 38], body: [60, 90], arms: [[42, 86, 18, 70], [78, 86, 108, 98]], legs: [[52, 130, 24, 190], [74, 130, 120, 168]], lines: [[18, 52, 2, 34], [28, 190, 8, 206]] },
  F4_WP: { lean: 8, head: [76, 38], body: [76, 90], arms: [[58, 86, 36, 76], [94, 86, 120, 72]], legs: [[66, 132, 44, 188], [88, 132, 118, 180]], ball: [120, 180], lines: [[102, 72, 138, 50], [104, 88, 138, 82]] },
  F4_SP: { lean: -20, head: [58, 38], body: [56, 88], arms: [[38, 84, 12, 64], [74, 84, 104, 104]], legs: [[50, 128, 20, 190], [70, 128, 126, 158]], ball: [128, 160], lines: [[8, 50, 0, 34], [18, 74, 2, 66], [112, 146, 142, 136]] },
  F5_PO: { lean: -22, head: [58, 40], body: [54, 92], arms: [[38, 88, 18, 106], [70, 88, 96, 74]], legs: [[48, 132, 30, 188], [68, 132, 124, 172]], ball: [128, 172], goal: true },
  F5_TG: { lean: 0, head: [72, 30], body: [72, 86], arms: [[50, 82, 20, 64], [94, 82, 124, 64]], legs: [[62, 128, 42, 190], [84, 128, 106, 190]], ball: [72, 16], jump: true },
  F5_RF: { lean: -10, head: [66, 38], body: [64, 90], arms: [[46, 86, 22, 74], [82, 86, 112, 98]], legs: [[56, 132, 30, 188], [78, 132, 124, 168]], ball: [120, 170], orbit: true },
  F5_PF: { lean: -16, head: [62, 38], body: [60, 90], arms: [[42, 86, 14, 96], [78, 86, 108, 82]], legs: [[52, 130, 24, 190], [74, 130, 118, 170]], ball: [28, 190], lines: [[10, 104, 34, 96], [16, 128, 44, 116]] },
  F5_AF: { lean: -24, head: [54, 38], body: [52, 88], arms: [[34, 84, 12, 66], [70, 84, 100, 104]], legs: [[46, 128, 18, 190], [66, 128, 128, 156]], ball: [130, 158], lines: [[6, 54, 0, 38], [14, 82, 0, 74], [112, 148, 142, 130]] },
  F5_CF: { lean: 6, head: [74, 36], body: [74, 88], arms: [[54, 84, 30, 70], [94, 84, 120, 92]], legs: [[64, 130, 44, 188], [86, 130, 120, 174]], ball: [122, 176], orbit: true, shield: true },
};

function buildSilhouetteSvg(archetypeId, variant) {
  const cfg = ARCHETYPE_ACTIONS[archetypeId] || ARCHETYPE_ACTIONS.F3_B2B;
  const variantTilt = variant === 2 ? -4 : variant === 3 ? 4 : 0;
  const groupTilt = (cfg.lean || 0) + variantTilt;
  const [headX, headY] = cfg.head;
  const [bodyX, bodyY] = cfg.body;
  const [lArm, rArm] = cfg.arms;
  const [lLeg, rLeg] = cfg.legs;
  const line = (p, cls = 'sil-limb') =>
    `<line class="${cls}" x1="${p[0]}" y1="${p[1]}" x2="${p[2]}" y2="${p[3]}" />`;
  const motionLines = (cfg.lines || [])
    .map((p) => line(p, 'sil-motion'))
    .join('');
  const ball = cfg.ball
    ? `<circle class="sil-ball" cx="${cfg.ball[0]}" cy="${cfg.ball[1]}" r="8" /><path class="sil-ball-cut" d="M${cfg.ball[0] - 5} ${cfg.ball[1]}h10M${cfg.ball[0]} ${cfg.ball[1] - 5}v10" />`
    : '';
  const goal = cfg.goal
    ? '<path class="sil-extra" d="M108 90h28v88M112 118h24M112 146h24" />'
    : '';
  const shield = cfg.shield
    ? '<path class="sil-extra" d="M24 118c24-20 72-20 96 0" />'
    : '';
  const orbit = cfg.orbit
    ? '<path class="sil-extra" d="M36 116c20-26 58-34 88-12" />'
    : '';
  const curl = cfg.curl
    ? '<path class="sil-extra" d="M104 152c28-18 30-42 8-58" />'
    : '';
  const jump = cfg.jump
    ? '<path class="sil-motion" d="M48 204c14-10 34-10 48 0" />'
    : '';

  return `
    <svg viewBox="0 0 144 220" class="silhouette-svg">
      <defs>
        <linearGradient id="silGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f8fbff"/>
          <stop offset="55%" stop-color="var(--card-accent)"/>
          <stop offset="100%" stop-color="#1b2438"/>
        </linearGradient>
      </defs>
      <g transform="rotate(${groupTilt} 72 116)">
        ${goal}${shield}${orbit}${curl}${jump}${motionLines}
        <circle class="sil-head" cx="${headX}" cy="${headY}" r="16" />
        <path class="sil-body" d="M${bodyX - 22} ${bodyY - 24}c10-12 34-12 44 0l10 58c2 10-8 18-20 18H${bodyX - 12}c-12 0-22-8-20-18l10-58Z" />
        ${line(lArm)}
        ${line(rArm)}
        ${line(lLeg)}
        ${line(rLeg)}
        ${ball}
      </g>
    </svg>
  `;
}

function renderPlayerCard(data, targetKey = 'main', options = {}) {
  const target = CARD_RENDER_TARGETS[targetKey] || CARD_RENDER_TARGETS.main;
  if (shouldPreserveCardLock(data)) {
    applyLiteUpgradeContinuity(data);
  } else {
    assignCardArtVariant(data);
  }
  const archetypeId = data?.archetype_id || 'F3_B2B';
  const profile = ARCHETYPE_CARD_PROFILES[archetypeId] || ARCHETYPE_CARD_PROFILES.F3_B2B;
  const copy = data?.copy_data || {};
  const liteCard = options.liteCard ?? isLiteReportData(data);
  const rating = Math.round(Number(data?.playlevel_score || 0) * 10);
  const fields = target.fields;

  setCardText(fields.archetypeId, archetypeId);
  setCardText(fields.rating, liteCard ? '--' : String(rating).padStart(2, '0'));
  setCardText(fields.title, data?.archetype_title || copy.title || '未知原型');
  setCardText(fields.playlevel, liteCard ? '--' : Number(data?.playlevel_score || 0).toFixed(2));
  setCardText(fields.match, `${Math.round(data?.hybrid_percentage || 100)}%`);
  setCardText(
    fields.tagline,
    copy.tagline || '你的主 Archetype 已锁定，全面球探报告正在展开。',
  );

  const card = $(target.card);
  const illustration = $(target.illustration);
  const fallback = $(target.fallback);
  const cardRadar = target.radar ? $(target.radar) : null;
  if (!card || !illustration || !fallback) return false;

  card.className = `player-card${targetKey === 'share' ? ' share-player-card' : ''} family-${profile.family} is-reveal${liteCard ? ' is-lite-card' : ''}`;
  card.classList.remove('has-art');
  card.dataset.archetype = archetypeId;
  card.style.removeProperty('--card-shield-mask');
  applyCardTheme(card, profile);

  setCardText(fields.kicker, profile.artWord || 'ELITE');
  setCardText(fields.artCode, profile.artCode || archetypeId.slice(0, 2));
  setCardText(fields.artWord, profile.artWord || 'ELITE');

  fallback.classList.add('hidden');
  illustration.classList.add('hidden');
  illustration.removeAttribute('src');
  illustration.removeAttribute('crossorigin');
  const artAssetId = resolveCardArtAssetId(data);
  const artUrl = getCardArtUrl(artAssetId);
  illustration.onload = () => {
    illustration.classList.remove('hidden');
    fallback.classList.add('hidden');
    card.classList.add('has-art');
    card.style.setProperty('--card-shield-mask', `url("${artUrl}")`);
  };
  illustration.onerror = () => {
    illustration.classList.add('hidden');
    fallback.classList.remove('hidden');
    card.classList.remove('has-art');
    card.style.removeProperty('--card-shield-mask');
  };
  illustration.src = artUrl;

  if (cardRadar && data?.radar_data?.length && window.drawRadarChart) {
    drawRadarChart(cardRadar, data.radar_data);
  }

  return true;
}

function collapseReportBody() {
  reportExpanded = false;
  const body = $('report-body');
  if (body) {
    body.classList.add('is-collapsed');
    body.classList.remove('is-expanded');
  }
  const btn = $('btn-view-report');
  if (btn) btn.classList.remove('hidden');
}

function celebrateCardReveal(data) {
  if (!window.SoccerConfetti) return;
  const archetypeId = data?.archetype_id || 'F3_B2B';
  const profile = ARCHETYPE_CARD_PROFILES[archetypeId] || ARCHETYPE_CARD_PROFILES.F3_B2B;
  const theme = CARD_THEME_PRESETS[profile.theme] || CARD_THEME_PRESETS.legendGold;
  const card = $('player-card');

  card?.classList.add('is-celebrating');
  window.setTimeout(() => card?.classList.remove('is-celebrating'), 1400);

  window.setTimeout(() => {
    const rect = card?.getBoundingClientRect();
    const originY = rect ? rect.top + rect.height * 0.32 : window.innerHeight * 0.38;
    window.SoccerConfetti.fireCardCelebration({
      colors: [theme.accent, theme.accent2, theme.foilA, theme.foilB, '#ffffff', '#59f1ff', '#ff6bb5'],
      originY,
    });
  }, 320);
}

function setSharedViewUI(active) {
  $('btn-view-report')?.classList.toggle('hidden', active);
}

function setReportFooterMode(mode) {
  const shareBtn = $('btn-share');
  const restartBtn = $('btn-restart');
  if (restartBtn) restartBtn.textContent = '我要测试';
  if (mode === 'shared') {
    shareBtn?.classList.add('hidden');
  } else {
    shareBtn?.classList.remove('hidden');
  }
}

function buildSharedReportData(archetypeId, playlevel, copyPack) {
  const arch = copyPack?.archetypes?.[archetypeId];
  const base = arch?.base || {};
  const score = Number.parseFloat(playlevel) || 0;
  return {
    archetype_id: archetypeId,
    archetype_title: base.title || archetypeId,
    playlevel_score: score,
    hybrid_percentage: 100,
    is_hybrid: false,
    copy_data: {
      title: base.title || archetypeId,
      tagline: base.tagline || '',
      description: base.description || '',
      strengths: base.strengths || [],
      weaknesses: base.weaknesses || [],
    },
    radar_data: [],
  };
}

function openSharedReport(data) {
  isSharedView = true;
  reportData = data;
  if (!renderPlayerCard(data)) return;
  setSharedViewUI(true);
  window.SoccerShare?.applyReport(data);
  setReportFooterMode('shared');
  collapseReportBody();
  showStep('step-report');
}

function openUnlockedReport(data) {
  isSharedView = false;
  if (shouldPreserveCardLock(data)) applyLiteUpgradeContinuity(data);
  const lite = isLiteReportData(data);
  setLiteReportLayout(lite);
  if (!renderPlayerCard(data, 'main', { liteCard: lite })) return;
  setSharedViewUI(false);
  window.SoccerShare?.applyReport(data);
  setReportFooterMode('owner');
  collapseReportBody();
  showStep('step-report');
  celebrateCardReveal(data);
}

function expandReportSections() {
  if (!reportData) return;
  if (reportExpanded) return;
  if (shouldPreserveCardLock(reportData)) applyLiteUpgradeContinuity(reportData);
  renderReport(reportData);
  reportExpanded = true;
  const body = $('report-body');
  if (body) {
    body.classList.remove('is-collapsed');
    body.classList.add('is-expanded');
  }
  const btn = $('btn-view-report');
  if (btn) btn.classList.add('hidden');
  requestAnimationFrame(() => {
    body?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

function animatePlayLevel(target, el) {
  const start = 0;
  const duration = 1200;
  const t0 = performance.now();
  function frame(now) {
    const p = Math.min((now - t0) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    const val = start + (target - start) * eased;
    el.textContent = val.toFixed(2);
    if (p < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function renderTextList(container, items, formatter) {
  container.innerHTML = '';
  (items || []).filter(Boolean).forEach((item) => {
    const node = document.createElement('div');
    node.className = 'insight-card';
    node.innerHTML = formatter(item);
    container.appendChild(node);
  });
}

function renderRadarLegend(radarData, q0) {
  const legendEl = $('radar-legend');
  if (!legendEl) return;
  const families = window.RADAR_FAMILIES || {};
  const activeFamilies =
    q0?.length > 0
      ? q0
      : radarData?.filter((d) => d.active).map((d) => d.family) || [];
  const activeSet = new Set(activeFamilies);
  legendEl.innerHTML = Object.entries(families)
    .map(([key, meta]) => {
      const active = activeSet.has(key);
      return `<span class="radar-legend-item${active ? ' active' : ''}" style="--family-color:${meta.color}">${meta.label}</span>`;
    })
    .join('');
}

function renderDeepReport(deep) {
  renderTextList($('report-signatures'), deep?.axis_insights?.signatures, (item) => `
    <div class="insight-score">${item.value.toFixed(1)}</div>
    <div>
      <strong>${item.label}</strong>
      <p>${item.tone}</p>
    </div>
  `);

  const script = deep?.match_script || {};
  const scriptItems = [
    ['持球', script.with_ball],
    ['无球', script.without_ball],
    ['转换', script.transition],
    ['抗压', script.pressure],
    ['战术任务', script.game_context],
  ].filter(([, text]) => text);
  const scriptEl = $('report-match-script');
  scriptEl.innerHTML = '';
  scriptItems.forEach(([label, text]) => {
    const row = document.createElement('div');
    row.className = 'script-row';
    row.innerHTML = `<span>${label}</span><p>${text}</p>`;
    scriptEl.appendChild(row);
  });

  renderScoutProfile(deep?.scout_profile);
}

function renderScoutProfile(profile) {
  const summaryEl = $('report-scout-summary');
  const gridEl = $('report-scout-grid');
  if (!summaryEl || !gridEl) return;

  summaryEl.textContent = profile?.scout_summary || '';
  gridEl.innerHTML = '';
  (profile?.dimensions || []).forEach((item) => {
    const card = document.createElement('article');
    card.className = 'scout-card';
    card.innerHTML = `
      <div class="scout-card-head">
        <strong>${item.label}</strong>
        <span>${item.score.toFixed(1)}</span>
      </div>
      <div class="scout-bar"><i style="width:${Math.max(8, item.score * 10)}%"></i></div>
      <em>${item.band}</em>
    `;
    gridEl.appendChild(card);
  });
}

function setLiteReportLayout(active) {
  const body = $('report-body');
  const upgradeWrap = $('report-upgrade-wrap');
  const premiumSections = $('report-premium-sections');
  const caption = $('radar-caption');
  body?.classList.toggle('is-lite', active);
  upgradeWrap?.classList.toggle('hidden', !active);
  premiumSections?.classList.toggle('is-locked', active);
  if (caption) {
    caption.textContent = active
      ? '已测维度显示参考分 · 未测维度已高斯模糊'
      : '亮色 = 你的主踢位置族 · 灰色 = 其他位置参考维度';
  }
}

function renderReport(data) {
  const copy = data.copy_data || {};
  const lite = isLiteReportData(data);
  setLiteReportLayout(lite);

  $('report-title').textContent = copy.title || data.archetype_title;
  $('report-tagline').textContent = copy.tagline || '';
  const labelEl = $('report-label');
  if (labelEl) {
    labelEl.textContent = data.primary_locked
      ? '你的足球 DNA · 主原型已确认'
      : '你的足球 DNA';
  }

  if (!lite) {
    $('badge-intensity').textContent =
      (copy.intensity_suffix || '') + ' · ' + (copy.intensity_label || data.intensity_band);
    $('badge-literacy').textContent = copy.literacy_tag || data.literacy_band;
    animatePlayLevel(data.playlevel_score, $('playlevel-value'));
  }

  drawRadarChart($('radar-canvas'), data.radar_data);
  renderRadarLegend(data.radar_data, data.q0_positions);

  $('report-description').textContent = copy.description || '';
  renderDeepReport(data.deep_report);

  const strEl = $('report-strengths');
  strEl.innerHTML = '';
  (copy.strengths || []).forEach((s) => {
    const li = document.createElement('li');
    li.textContent = s;
    strEl.appendChild(li);
  });
  (data.deep_report?.axis_insights?.dominant_traits || []).forEach((item) => {
    const li = document.createElement('li');
    li.textContent = `${item.label} ${item.value.toFixed(1)}：${item.tone}`;
    strEl.appendChild(li);
  });
  const weakEl = $('report-weaknesses');
  weakEl.innerHTML = '';
  (copy.weaknesses || []).forEach((s) => {
    const li = document.createElement('li');
    li.textContent = s;
    weakEl.appendChild(li);
  });
  (data.deep_report?.axis_insights?.growth_edges || []).forEach((item) => {
    const li = document.createElement('li');
    li.textContent = `${item.label} ${item.value.toFixed(1)}：${item.advice}`;
    weakEl.appendChild(li);
  });

  $('report-intensity-tone').textContent = copy.intensity_tone || '';

  const literacyNoteEl = $('report-literacy-note');
  if (literacyNoteEl) {
    literacyNoteEl.textContent = copy.literacy_desc || '';
  }

  const trainEl = $('report-training');
  const trainHighlightEl = $('report-training-highlight');
  trainEl.innerHTML = '';
  if (trainHighlightEl) {
    trainHighlightEl.textContent = '';
    trainHighlightEl.classList.add('hidden');
  }

  const trainingItems =
    copy.training?.items?.length
      ? copy.training.items
      : [copy.training?.priority_1, copy.training?.priority_2]
          .filter(Boolean)
          .map((text) => ({ tag: '风格专项', text }));

  const visibleTraining = lite ? trainingItems.slice(0, 2) : trainingItems;
  visibleTraining.forEach((item) => {
    const li = document.createElement('li');
    if (item.tag) {
      const tag = document.createElement('span');
      tag.className = 'training-item-tag';
      tag.textContent = item.tag;
      li.appendChild(tag);
    }
    const text = document.createElement('span');
    text.className = 'training-item-text';
    text.textContent = item.text;
    li.appendChild(text);
    trainEl.appendChild(li);
  });

  if (trainHighlightEl && copy.training?.highlight) {
    trainHighlightEl.textContent = `本期划重点：${copy.training.highlight}`;
    trainHighlightEl.classList.remove('hidden');
  }
  if (copy.formation_fit) {
    const f = copy.formation_fit;
    $('report-formation').textContent = `最佳阵型：${f.best} · 推荐位置：${f.position} · 避免：${f.avoid}`;
  }

  const ref = copy.style_reference || {};
  const setRefText = (id, value) => {
    const el = $(id);
    if (!el) return;
    const text = value || '';
    el.textContent = text;
    el.classList.toggle('hidden', !text);
  };

  setRefText('report-disclaimer', ref.disclaimer || '');
  setRefText('report-ref-spirit', ref.spirit_line || '');
  setRefText('report-core-ref', ref.core_ref || '');
  setRefText('report-core-scene', ref.core_scene || '');
  setRefText('report-sub-ref', ref.sub_ref || '');
  setRefText('report-sub-scene', ref.sub_scene || '');
  setRefText('report-avoid-ref', ref.avoid_ref || '');
  setRefText('report-avoid-why', ref.avoid_why || '');
  setRefText('report-watch-tip', ref.watch_tip ? `看球学习：${ref.watch_tip}` : '');
  setRefText('report-grassroots-note', ref.grassroots_note || '');

  const hybridEl = $('report-hybrid-ref');
  if (hybridEl) {
    const hybridText =
      (data.is_hybrid && copy.hybrid_desc ? copy.hybrid_desc + ' ' : '') +
      (ref.hybrid_add || '');
    hybridEl.textContent = hybridText;
    hybridEl.classList.toggle('hidden', !hybridText);
  }

  document.querySelector('.paywall-preview')?.classList.remove('blurred');
}

function unlockReport() {
  if (!reportData) {
    const cached = localStorage.getItem(REPORT_KEY);
    if (cached) reportData = JSON.parse(cached);
  }
  if (!reportData) {
    alert('暂无报告数据');
    return;
  }
  if (isLiteReportData(reportData)) {
    assignCardArtVariant(reportData);
    embedLockFields(reportData);
    saveLitePrimaryLock(reportData);
    localStorage.setItem(REPORT_KEY, JSON.stringify(reportData));
  } else if (reportData.report_tier === 'pro' || quizMode === 'upgrade' || isUpgradePending()) {
    reportData.report_tier = 'pro';
    if (shouldPreserveCardLock(reportData)) applyLiteUpgradeContinuity(reportData);
    quizMode = 'pro';
    localStorage.setItem(MODE_KEY, 'pro');
    localStorage.removeItem(UPGRADE_KEY);
    localStorage.setItem(REPORT_KEY, JSON.stringify(reportData));
  }
  openUnlockedReport(reportData);
}

function startUpgradeQuiz() {
  if (!questions) {
    alert('题库尚未加载完成，请刷新页面后重试');
    return;
  }
  if (!ensureLitePrimaryLock()) {
    alert('未找到球迷版主原型锁定记录，请重新完成球迷版测试');
    return;
  }
  const cachedAnswers = localStorage.getItem(STORAGE_KEY);
  if (!cachedAnswers) {
    alert('未找到球迷版答题记录，请重新测试');
    return;
  }
  try {
    const payload = JSON.parse(cachedAnswers);
    answers.q0 = [...(payload.q0 || [])];
    answers.map = {};
    questions.style.forEach((q, i) => {
      if (payload.style[i]) answers.map[q.id] = payload.style[i];
    });
    questions.intensity.forEach((q, i) => {
      if (payload.intensity[i]) answers.map[q.id] = payload.intensity[i];
    });
    questions.literacy.forEach((q, i) => {
      if (payload.literacy[i]) answers.map[q.id] = payload.literacy[i];
    });
  } catch (err) {
    console.error(err);
    alert('答题记录损坏，请重新测试');
    return;
  }

  quizMode = 'upgrade';
  localStorage.setItem(MODE_KEY, 'upgrade');
  localStorage.setItem(UPGRADE_KEY, '1');
  currentIndex = 0;
  isAdvancingQuiz = false;
  buildUpgradeQuizItems();
  showStep('step-quiz');
  renderQuestion();
}

function shareReport() {
  if (!reportData) {
    const cached = localStorage.getItem(REPORT_KEY);
    if (cached) reportData = JSON.parse(cached);
  }
  if (!reportData) {
    alert('暂无报告数据，请先完成测试');
    return;
  }
  if (window.SoccerShare?.shareFromReport) {
    window.SoccerShare.shareFromReport(reportData);
    return;
  }
  const title = $('report-title')?.textContent || reportData.archetype_title || '足球 DNA';
  const text = `我的足球 DNA：${title} · PlayLevel ${reportData?.playlevel_score}`;
  navigator.clipboard?.writeText(text + '\n' + location.href);
  alert('报告摘要已复制');
}

function restart() {
  window.SoccerConfetti?.stopCelebration();
  isSharedView = false;
  reportExpanded = false;
  silhouetteVariant = null;
  collapseReportBody();
  resetQuizSession();
  reportData = null;
  quizMode = 'pro';
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(REPORT_KEY);
  localStorage.removeItem(MODE_KEY);
  localStorage.removeItem(UPGRADE_KEY);
  localStorage.removeItem(LITE_LOCK_KEY);
  setSharedViewUI(false);
  setLiteReportLayout(false);
  setReportFooterMode('owner');
  const cleanUrl = location.origin + location.pathname;
  if (location.href.split('#')[0] !== cleanUrl) {
    history.replaceState(null, '', cleanUrl);
  }
  showStep('step-welcome');
}

async function init() {
  try {
    const res = await fetch('./data/questions.json?v=2025061004');
    if (!res.ok) throw new Error(`题库加载失败 (${res.status})`);
    questions = await res.json();
    buildQuizItems('pro');
  } catch (err) {
    console.error(err);
    const welcome = $('step-welcome');
    if (welcome) {
      const note = document.createElement('p');
      note.className = 'footnote';
      note.style.color = '#ff8a65';
      note.textContent = '页面资源加载失败，请刷新或复制链接到系统浏览器打开。';
      welcome.appendChild(note);
    }
    return;
  }

  $('btn-next').addEventListener('click', nextQuestion);
  $('btn-prev').addEventListener('click', prevQuestion);
  $('btn-unlock').addEventListener('click', unlockReport);
  $('btn-upgrade-pro')?.addEventListener('click', startUpgradeQuiz);
  $('btn-view-report').addEventListener('click', expandReportSections);
  $('btn-share').addEventListener('click', shareReport);
  $('btn-restart').addEventListener('click', restart);
  setupPlayerCardInteraction();

  const shareParams = window.SoccerShare?.parseShareParams?.();
  const cachedReport = localStorage.getItem(REPORT_KEY);

  if (shareParams && ARCHETYPE_CARD_PROFILES[shareParams.archetypeId]) {
    if (cachedReport) {
      reportData = JSON.parse(cachedReport);
      openUnlockedReport(reportData);
    } else {
      try {
        const copyRes = await fetch('./data/copy_pack.json?v=2025061104');
        if (!copyRes.ok) throw new Error('copy_pack load failed');
        const copyPack = await copyRes.json();
        openSharedReport(
          buildSharedReportData(shareParams.archetypeId, shareParams.playlevel, copyPack),
        );
      } catch (err) {
        console.error(err);
      }
    }
    return;
  }

  if (cachedReport) {
    reportData = JSON.parse(cachedReport);
  }
}

window.SoccerCard = {
  renderPlayerCard,
  assignCardArtVariant,
  resolveCardArtAssetId,
  getCardArtUrl,
  ARCHETYPE_CARD_PROFILES,
  CARD_ART_ASSETS,
  CARD_ART_VARIANT_POOL,
  CARD_THEME_PRESETS,
};

bindQuizTierButtons();
init();
