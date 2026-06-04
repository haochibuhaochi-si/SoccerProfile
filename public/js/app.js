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

const LOADING_MSGS = [
  '正在分析你的球风...',
  '正在匹配 Archetype...',
  '正在计算 PlayLevel...',
  '正在生成战术画像...',
];

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
    reportData = await window.SoccerAPI.submitAnswers(answers);
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
  $('preview-score').textContent = `PlayLevel · ${data.playlevel_score ?? '—'}`;
}

function animatePlayLevel(target, el) {
  const start = 0;
  const duration = 1200;
  const t0 = performance.now();
  function frame(now) {
    const p = Math.min((now - t0) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    const val = start + (target - start) * eased;
    el.textContent = val.toFixed(1);
    if (p < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
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

  $('report-description').textContent = copy.description || '';
  const strEl = $('report-strengths');
  strEl.innerHTML = '';
  (copy.strengths || []).forEach((s) => {
    const li = document.createElement('li');
    li.textContent = s;
    strEl.appendChild(li);
  });
  const weakEl = $('report-weaknesses');
  weakEl.innerHTML = '';
  (copy.weaknesses || []).forEach((s) => {
    const li = document.createElement('li');
    li.textContent = s;
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
  renderReport(reportData);
  showStep('step-report');
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
  answers = { q0: [], style: [], intensity: [], literacy: [] };
  reportData = null;
  currentIndex = 0;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(REPORT_KEY);
  showStep('step-welcome');
}

async function init() {
  const res = await fetch('./data/questions.json');
  questions = await res.json();
  buildQuizItems();

  $('btn-start').addEventListener('click', () => {
    currentIndex = 0;
    showStep('step-quiz');
    renderQuestion();
  });
  $('btn-next').addEventListener('click', nextQuestion);
  $('btn-prev').addEventListener('click', prevQuestion);
  $('btn-unlock').addEventListener('click', unlockReport);
  $('btn-ad-unlock').addEventListener('click', unlockReport);
  $('btn-share').addEventListener('click', shareReport);
  $('btn-restart').addEventListener('click', restart);

  const cachedReport = localStorage.getItem(REPORT_KEY);
  if (cachedReport) {
    reportData = JSON.parse(cachedReport);
  }
}

init();
