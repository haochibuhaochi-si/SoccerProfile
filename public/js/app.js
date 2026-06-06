/**
 * 足球风格测试 H5 - 主应用逻辑
 */
const STORAGE_KEY = 'soccer_profile_answers';
const REPORT_KEY = 'soccer_profile_report';

let questions = null;
let quizItems = [];
let currentIndex = 0;
let answers = {
  q0: [],
  style: [],
  intensity: [],
  literacy: [],
};
let reportData = null;
let silhouetteVariant = null;
let reportExpanded = false;

const LOADING_MSGS = [
  '正在读取你的比赛 DNA...',
  '正在匹配主 Archetype 与副型基因...',
  '正在计算 PlayLevel 与球探五维...',
  '正在渲染风格星图与球员剪影...',
  '正在生成一份全面球探报告...',
];

const ARCHETYPE_CARD_PROFILES = {
  F2_A: { family: 'defender', accent: '#00d4ff', pose: 'anchor' },
  F2_BS: { family: 'defender', accent: '#2dd4bf', pose: 'ballplayer' },
  F2_AG: { family: 'defender', accent: '#ff6b35', pose: 'tackler' },
  F2_FB: { family: 'defender', accent: '#38bdf8', pose: 'anchor' },
  F2_SW: { family: 'defender', accent: '#93c5fd', pose: 'ballplayer' },
  F3_RO: { family: 'midfielder', accent: '#a78bfa', pose: 'regista' },
  F3_DE: { family: 'midfielder', accent: '#38a169', pose: 'destroyer' },
  F3_B2B: { family: 'midfielder', accent: '#ffcf5a', pose: 'runner' },
  F3_AM: { family: 'midfielder', accent: '#f472b6', pose: 'creator' },
  F3_CTR: { family: 'midfielder', accent: '#818cf8', pose: 'regista' },
  F3_CAR: { family: 'midfielder', accent: '#34d399', pose: 'runner' },
  F3_HB: { family: 'midfielder', accent: '#60a5fa', pose: 'destroyer' },
  F3_SS: { family: 'midfielder', accent: '#fb7185', pose: 'creator' },
  F4_CR: { family: 'wing', accent: '#60a5fa', pose: 'crosser' },
  F4_IN: { family: 'wing', accent: '#fb7185', pose: 'inverter' },
  F4_WB: { family: 'wing', accent: '#22c55e', pose: 'wingback' },
  F4_WP: { family: 'wing', accent: '#38bdf8', pose: 'crosser' },
  F4_SP: { family: 'wing', accent: '#f97316', pose: 'raider' },
  F5_PO: { family: 'striker', accent: '#f97316', pose: 'poacher' },
  F5_TG: { family: 'striker', accent: '#eab308', pose: 'target' },
  F5_RF: { family: 'striker', accent: '#ef4444', pose: 'raider' },
  F5_PF: { family: 'striker', accent: '#22c55e', pose: 'destroyer' },
  F5_AF: { family: 'striker', accent: '#fb923c', pose: 'raider' },
  F5_CF: { family: 'striker', accent: '#facc15', pose: 'target' },
};

const $ = (id) => document.getElementById(id);

function showStep(stepId) {
  document.querySelectorAll('.step').forEach((el) => {
    el.classList.toggle('active', el.id === stepId);
  });
}

function buildQuizItems() {
  quizItems = [
    { part: '基本信息', type: 'checkbox', data: questions.q0, answerKey: 'q0' },
    ...questions.style.map((q) => ({
      part: '风格定位',
      type: 'radio',
      data: q,
      answerKey: 'style',
      styleIndex: questions.style.indexOf(q),
    })),
    ...questions.intensity.map((q) => ({
      part: '强度与环境',
      type: 'radio',
      data: q,
      answerKey: 'intensity',
      intensityIndex: questions.intensity.indexOf(q),
    })),
    ...questions.literacy.map((q) => ({
      part: '战术素养',
      type: 'radio',
      data: q,
      answerKey: 'literacy',
      literacyIndex: questions.literacy.indexOf(q),
    })),
  ];
}

function getAnswerForItem(item) {
  if (item.answerKey === 'q0') return answers.q0;
  if (item.answerKey === 'style') return answers.style[item.styleIndex];
  if (item.answerKey === 'intensity') return answers.intensity[item.intensityIndex];
  if (item.answerKey === 'literacy') return answers.literacy[item.literacyIndex];
  return null;
}

function setAnswerForItem(item, value) {
  if (item.answerKey === 'q0') {
    answers.q0 = value;
    return;
  }
  if (item.answerKey === 'style') {
    while (answers.style.length <= item.styleIndex) answers.style.push(null);
    answers.style[item.styleIndex] = value;
  }
  if (item.answerKey === 'intensity') {
    while (answers.intensity.length <= item.intensityIndex) answers.intensity.push(null);
    answers.intensity[item.intensityIndex] = value;
  }
  if (item.answerKey === 'literacy') {
    while (answers.literacy.length <= item.literacyIndex) answers.literacy.push(null);
    answers.literacy[item.literacyIndex] = value;
  }
}

function renderQuestion() {
  const item = quizItems[currentIndex];
  const q = item.data;
  const total = quizItems.length;

  $('progress-bar').style.width = `${((currentIndex + 1) / total) * 100}%`;
  $('progress-text').textContent = `${currentIndex + 1} / ${total}`;
  $('part-badge').textContent = item.part;

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
    el.innerHTML = `
      <span class="option-key">${keyLabel}</span>
      <span class="option-label">${opt.label}</span>
    `;

    el.addEventListener('click', () => onOptionClick(item, opt.key, el));
    container.appendChild(el);
  });

  $('btn-prev').disabled = currentIndex === 0;
  $('btn-next').textContent = currentIndex === total - 1 ? '提交答案' : '下一题';
}

function onOptionClick(item, key, el) {
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

  setTimeout(() => {
    if (currentIndex < quizItems.length - 1) {
      currentIndex += 1;
      renderQuestion();
    } else {
      submitQuiz();
    }
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
  if (!canProceed() && currentIndex === quizItems.length - 1) {
    alert('请完成最后一题');
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
  showStep('step-loading');

  let msgIdx = 0;
  const msgTimer = setInterval(() => {
    msgIdx = (msgIdx + 1) % LOADING_MSGS.length;
    $('loading-msg').textContent = LOADING_MSGS[msgIdx];
  }, 1200);

  try {
    const minLoading = new Promise((resolve) => setTimeout(resolve, 2600));
    const [result] = await Promise.all([
      window.SoccerAPI.submitAnswers(answers),
      minLoading,
    ]);
    reportData = result;
    localStorage.setItem(REPORT_KEY, JSON.stringify(reportData));
    clearInterval(msgTimer);
    showPaywallPreview(reportData);
    showStep('step-paywall');
  } catch (err) {
    clearInterval(msgTimer);
    console.error(err);
    alert(
      '报告生成失败：' +
        (err.message || '请检查云函数是否已部署') +
        '\n\n本地预览可先部署 calculateReport 云函数。'
    );
    showStep('step-quiz');
  }
}

function showPaywallPreview(data) {
  $('preview-title').textContent = data.archetype_title || '已匹配原型';
  $('preview-score').textContent = `PlayLevel · ${Number(data.playlevel_score ?? 0).toFixed(2)}`;
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

function renderPlayerCard(data) {
  const archetypeId = data?.archetype_id || 'F3_B2B';
  const profile = ARCHETYPE_CARD_PROFILES[archetypeId] || ARCHETYPE_CARD_PROFILES.F3_B2B;
  const variant = getCardVariant(data);
  const copy = data?.copy_data || {};
  const rating = Math.round(Number(data?.playlevel_score || 0) * 10);

  setCardText('card-archetype-id', archetypeId);
  setCardText('card-rating', String(rating).padStart(2, '0'));
  setCardText('card-title', data?.archetype_title || copy.title || '未知原型');
  setCardText('card-playlevel', Number(data?.playlevel_score || 0).toFixed(2));
  setCardText('card-match', `${Math.round(data?.hybrid_percentage || 100)}%`);
  setCardText(
    'card-tagline',
    copy.tagline || '你的主 Archetype 已锁定，全面球探报告正在展开。',
  );

  const card = $('player-card');
  const silhouette = $('player-silhouette');
  const cardRadar = $('card-radar');
  if (!card || !silhouette) return false;

  card.style.setProperty('--card-accent', profile.accent);
  card.className = `player-card family-${profile.family} is-reveal`;
  silhouette.className = `player-silhouette pose-${profile.pose} variant-${variant}`;
  silhouette.innerHTML = buildSilhouetteSvg(archetypeId, variant);

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

function openUnlockedReport(data) {
  if (!renderPlayerCard(data)) return;
  collapseReportBody();
  showStep('step-report');
}

function expandReportSections() {
  if (!reportData || reportExpanded) return;
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
      <p>${item.desc}</p>
    `;
    gridEl.appendChild(card);
  });
}

function renderReport(data) {
  const copy = data.copy_data || {};
  $('report-title').textContent = copy.title || data.archetype_title;
  $('report-tagline').textContent = copy.tagline || '';
  $('badge-intensity').textContent =
    (copy.intensity_suffix || '') + ' · ' + (copy.intensity_label || data.intensity_band);
  $('badge-literacy').textContent = copy.literacy_tag || data.literacy_band;
  animatePlayLevel(data.playlevel_score, $('playlevel-value'));

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

  $('report-intensity-tone').textContent =
    (copy.intensity_tone || '') +
    (copy.literacy_desc ? '\n\n' + copy.literacy_desc : '');

  const trainEl = $('report-training');
  trainEl.innerHTML = '';
  if (copy.training) {
    [copy.training.priority_1, copy.training.priority_2].filter(Boolean).forEach((t) => {
      const li = document.createElement('li');
      li.textContent = t;
      trainEl.appendChild(li);
    });
  }
  if (copy.formation_fit) {
    const f = copy.formation_fit;
    $('report-formation').textContent = `最佳阵型：${f.best} · 推荐位置：${f.position} · 避免：${f.avoid}`;
  }

  const ref = copy.style_reference || {};
  $('report-disclaimer').textContent = ref.disclaimer || '';
  $('report-core-ref').textContent = ref.core_ref || '';
  $('report-sub-ref').textContent = ref.sub_ref || '';
  $('report-avoid-ref').textContent = ref.avoid_ref || '';
  $('report-hybrid-ref').textContent =
    (data.is_hybrid && copy.hybrid_desc ? copy.hybrid_desc + ' ' : '') +
    (ref.hybrid_add || '');

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
  openUnlockedReport(reportData);
}

function shareReport() {
  const title = $('report-title').textContent;
  const text = `我的足球 DNA：${title} · PlayLevel ${reportData?.playlevel_score}`;
  if (navigator.share) {
    navigator.share({ title: '足球 DNA 测试', text, url: location.href }).catch(() => {});
  } else {
    navigator.clipboard?.writeText(text + '\n' + location.href);
    alert('报告摘要已复制');
  }
}

function restart() {
  reportExpanded = false;
  silhouetteVariant = null;
  collapseReportBody();
  answers = { q0: [], style: [], intensity: [], literacy: [] };
  reportData = null;
  currentIndex = 0;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(REPORT_KEY);
  showStep('step-welcome');
}

async function init() {
  try {
    const res = await fetch('./data/questions.json');
    if (!res.ok) throw new Error(`题库加载失败 (${res.status})`);
    questions = await res.json();
    buildQuizItems();
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

  $('btn-start').addEventListener('click', () => {
    currentIndex = 0;
    showStep('step-quiz');
    renderQuestion();
  });
  $('btn-next').addEventListener('click', nextQuestion);
  $('btn-prev').addEventListener('click', prevQuestion);
  $('btn-unlock').addEventListener('click', unlockReport);
  $('btn-ad-unlock').addEventListener('click', unlockReport);
  $('btn-view-report').addEventListener('click', expandReportSections);
  $('btn-share').addEventListener('click', shareReport);
  $('btn-restart').addEventListener('click', restart);

  const cachedReport = localStorage.getItem(REPORT_KEY);
  if (cachedReport) {
    reportData = JSON.parse(cachedReport);
  }
}

init();
