const cloud = require('@cloudbase/node-sdk');
const { calculateReport } = require('./lib/calculator');
const questions = require('./data/questions.json');

cloud.init({ env: cloud.SYMBOL_CURRENT_ENV });

const SECTION_LABELS = {
  style: '风格',
  intensity: '强度',
  literacy: '素养',
};

function normalizeAnswerList(list, expected) {
  const dense = [];
  for (let i = 0; i < expected; i += 1) {
    let val = null;
    if (Array.isArray(list)) {
      val = list[i];
    } else if (list && typeof list === 'object') {
      val = list[String(i)] ?? list[i];
    }
    dense.push(val ?? null);
  }
  return dense;
}

function extractPayload(event) {
  const body = typeof event === 'string' ? JSON.parse(event) : event;
  const raw = body?.data && typeof body.data === 'object' ? body.data : body;

  return {
    q0: Array.isArray(raw?.q0) ? raw.q0 : [],
    style: normalizeAnswerList(raw?.style, questions.style.length),
    intensity: normalizeAnswerList(raw?.intensity, questions.intensity.length),
    literacy: normalizeAnswerList(raw?.literacy, questions.literacy.length),
  };
}

function validatePayload(payload) {
  if (!payload) return '缺少提交数据';

  if (!Array.isArray(payload.q0) || payload.q0.length === 0) {
    return '请至少选择一个场上位置';
  }

  for (const key of ['style', 'intensity', 'literacy']) {
    const expected = questions[key]?.length || 0;
    const answers = payload[key];
    const label = SECTION_LABELS[key];
    let answered = 0;

    for (let i = 0; i < expected; i += 1) {
      if (answers[i] != null && answers[i] !== '') answered += 1;
    }

    if (answered < expected) {
      return `${label}题未完成（${answered}/${expected}），请完成全部${label}题后再提交`;
    }
  }

  return null;
}

exports.main = async (event) => {
  try {
    const payload = extractPayload(event);
    const validationError = validatePayload(payload);

    if (validationError) {
      return { code: 400, message: validationError };
    }

    const result = calculateReport(payload);
    return { code: 0, data: result };
  } catch (err) {
    console.error(err);
    return { code: 500, message: err.message || '计算失败' };
  }
};
