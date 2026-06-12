/**
 * 足球风格测试 - 核心计算逻辑（优化版）
 */
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');

function loadJson(name) {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, name), 'utf8'));
}

const AXES = [
  'F2-Engagement', 'F2-Distribution', 'F2-Body',
  'F3-Tempo', 'F3-Duels', 'F3-Territory',
  'F4-Mode', 'F4-WorkRate', 'F4-Width',
  'F5-HoldUp', 'F5-Movement', 'F5-Physical',
];

const AXIS_META = {
  'F2-Engagement': {
    label: '防线侵略性',
    short: '侵略',
    high: '更愿意主动压迫、前顶和破坏第一传',
    low: '更倾向稳守位置、保护禁区和延缓推进',
    advice: '注意前顶后的身后保护，和中后场队友约定补位触发点。',
  },
  'F2-Distribution': {
    label: '后场出球',
    short: '出球',
    high: '敢于用穿透传球或转移球打破第一道压迫',
    low: '优先选择安全路线，失误率低但推进效率有限',
    advice: '增加受压下的第一脚斜传和弱侧转移训练。',
  },
  'F2-Body': {
    label: '身体工具',
    short: '身体',
    high: '更依赖身体对抗、卡位和空中优势解决问题',
    low: '更依赖站位、预判和脚下处理规避硬碰硬',
    advice: '补足核心力量与起跳对抗，避免关键区域被直接压制。',
  },
  'F3-Tempo': {
    label: '节奏驱动',
    short: '节奏',
    high: '喜欢向前提速，用推进和直塞改变比赛节奏',
    low: '擅长控节奏和保球，愿意先让球队站稳结构',
    advice: '练习快慢切换，别让每次触球都变成同一种节奏。',
  },
  'F3-Duels': {
    label: '中场对抗',
    short: '对抗',
    high: '愿意迎上去抢、拼、压迫，能制造转换机会',
    low: '更重视规避风险和保持阵型，不轻易陷入缠斗',
    advice: '提升一对一防守脚步和肩部对抗，减少被迫回避的场景。',
  },
  'F3-Territory': {
    label: '前插热区',
    short: '前插',
    high: '活动范围更靠前，愿意攻击肋部和禁区前沿',
    low: '更喜欢回撤接应，在较深位置组织和保护球权',
    advice: '明确何时前插、何时留守，避免中场身后被打空。',
  },
  'F4-Mode': {
    label: '边路杀伤',
    short: '杀伤',
    high: '更偏内切、射门和威胁传球',
    low: '更偏下底、传中和边路重组',
    advice: '补一个反向武器：内切型练外线传中，传中型练肋部内收。',
  },
  'F4-WorkRate': {
    label: '往返覆盖',
    short: '往返',
    high: '愿意高速回防和持续覆盖边路纵深',
    low: '更偏进攻端投入，防守回收相对保守',
    advice: '把回防路线练成习惯，尤其是丢球后的前 5 秒。',
  },
  'F4-Width': {
    label: '空间取向',
    short: '空间',
    high: '喜欢内收肋部，参与中路连接和二点球争夺',
    low: '喜欢拉开宽度，贴边提供传中和纵深',
    advice: '根据队友站位动态选择内收或拉边，别固定在一条线。',
  },
  'F5-HoldUp': {
    label: '支点能力',
    short: '支点',
    high: '能背身护球、做墙和等待队友插上',
    low: '更喜欢一脚处理、转身和流动接应',
    advice: '提高背身第一下触球质量，让队友有时间靠近你。',
  },
  'F5-Movement': {
    label: '跑位嗅觉',
    short: '跑位',
    high: '更像禁区猎手，擅长压越位线和攻击第二落点',
    low: '更流动，愿意回撤、拉边和参与组织',
    advice: '多练启动前的假动作和盲侧跑，提升无球杀伤。',
  },
  'F5-Physical': {
    label: '终结武器',
    short: '终结',
    high: '更依赖力量、技巧和个人处理完成终结',
    low: '更依赖预判、第一时间处理和门前嗅觉',
    advice: '把常用射门方式练成稳定模板，再扩展第二终结手段。',
  },
};

const ENV_BASE = { A: 8.0, 'B+': 6.5, B: 5.0, C: 3.5, D: 2.0 };
const EXEC_MOD = { '+0.2': 0.3, '0': 0, '-0.2': -0.3, '-0.4': -0.5 };
const FREQ_MOD = { 'Freq High': 0.5, 'Freq Med': 0.2, 'Freq Low': 0, 'Freq Rare': -0.3 };
const PEER_MOD = { 'Peer Level High': 0.4, 'Peer Level Med': 0.1, 'Peer Level Low': -0.2 };
const RELIABILITY_MOD = { 'Reliability High': 0.3, 'Reliability Med': 0.1, 'Reliability Low': -0.2 };
const PITCH_MOD = { 'Env Bonus': 0.1, 'Env Neutral': 0, 'Env Penalty': -0.1 };
const AGE_MOD = {
  'Age Youth': 0.08,
  'Age Peak': 0.18,
  'Age Prime': 0.12,
  'Age Mature': -0.04,
  'Age Veteran': -0.18,
};
const SELF_MOD = {
  'Self Tier A': 0.22,
  'Self Tier B': 0.12,
  'Self Tier C': 0.04,
  'Self Tier D': -0.08,
  'Self Tier E': -0.18,
};
const WEAK_FOOT_MOD = {
  'WeakFoot Elite': 0.18,
  'WeakFoot Good': 0.08,
  'WeakFoot Basic': -0.04,
  'WeakFoot Low': -0.14,
};
const AVAILABILITY_MOD = {
  'Availability Elite': 0.2,
  'Availability Stable': 0.06,
  'Availability Managed': -0.12,
  'Availability Risk': -0.28,
};
const MENTALITY_MOD = {
  'Mentality Clutch': 0.18,
  'Mentality Stable': 0.06,
  'Mentality Cautious': -0.04,
  'Mentality Tilt': -0.18,
};
const DISCIPLINE_MOD = {
  'Discipline Elite': 0.18,
  'Discipline Good': 0.08,
  'Discipline Loose': -0.08,
  'Discipline Free': -0.16,
};
const COACHABILITY_MOD = {
  'Coachability Elite': 0.18,
  'Coachability Good': 0.08,
  'Coachability Slow': -0.06,
  'Coachability Low': -0.16,
};
const LITERACY_BONUS = { 5: 0.75, 4: 0.6, 3: 0.45, 2: 0.3, 1: 0.15, 0: 0 };
/** 球探五维「战术理解」：K 题每题 +0.6（5 题满 +3.0），与 PlayLevel 素养加成比例约 4:1 */
const TACTICAL_BASE = 4.0;
const TACTICAL_LIT_WEIGHT = 0.6;
const TACTICAL_DISCIPLINE_WEIGHT = 4.5;
const TACTICAL_STYLE_AXIS_WEIGHT = 0.35;
const TACTICAL_ELITE_FLOOR = 6.5;
/** 球探五维「身体与执行」：以 5 为中性锚，减轻 exec/age 惩罚避免系统性偏低 */
const PHYSICAL_BASE = 5.6;
const PHYSICAL_STYLE_DEV_WEIGHT = 0.8;
const PHYSICAL_EXEC_WEIGHT = 1.0;
const PHYSICAL_AGE_WEIGHT = 1.6;
const FAMILY_AXES = {
  defender: ['F2-Engagement', 'F2-Distribution', 'F2-Body'],
  midfielder: ['F3-Tempo', 'F3-Duels', 'F3-Territory'],
  wing: ['F4-Mode', 'F4-WorkRate', 'F4-Width'],
  striker: ['F5-HoldUp', 'F5-Movement', 'F5-Physical'],
};
const INACTIVE_AXIS_WEIGHT = 0.35;
const ACTIVE_AXIS_WEIGHT = 2.5;
const DUAL_POSITION_AXIS_WEIGHT = 2.2;
const MAX_SELF_MOD_BY_ENV = {
  A: 0.22,
  'B+': 0.14,
  B: 0.08,
  C: 0.04,
  D: 0,
};
const MAX_BASE_BY_SELF = {
  A: 8,
  B: 7,
  C: 6,
  D: 4.8,
  E: 3.8,
};
const PLAYLEVEL_SOFT_CAP = {
  elite: 9.4,
  high: 8.9,
  standard: 8.4,
};
const STYLE_EXEC_AXES = ['F3-Duels', 'F4-WorkRate', 'F2-Engagement', 'F2-Body', 'F5-Physical'];

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function getMetaModifier(opt, modMap) {
  const meta = (opt?.tags || []).find((t) => t.type === 'meta' && t.value in modMap);
  if (!meta) return 0;
  return modMap[meta.value];
}

/** 根据题库预计算每个轴的原始得分上下界 */
function buildAxisBounds(styleQuestions) {
  const bounds = Object.fromEntries(AXES.map((a) => [a, { min: 0, max: 0 }]));

  styleQuestions.forEach((q) => {
    const perQuestion = {};
    q.options.forEach((opt) => {
      (opt.tags || []).forEach((tag) => {
        if (tag.type !== 'axis' || !(tag.axis in bounds)) return;
        if (!perQuestion[tag.axis]) perQuestion[tag.axis] = { min: Infinity, max: -Infinity };
        perQuestion[tag.axis].min = Math.min(perQuestion[tag.axis].min, tag.delta);
        perQuestion[tag.axis].max = Math.max(perQuestion[tag.axis].max, tag.delta);
      });
    });
    Object.entries(perQuestion).forEach(([axis, { min, max }]) => {
      bounds[axis].min += min;
      bounds[axis].max += max;
    });
  });

  return bounds;
}

function computeStyleVector(styleQuestions, styleAnswers) {
  const bounds = buildAxisBounds(styleQuestions);
  const sums = Object.fromEntries(AXES.map((a) => [a, 0]));

  styleQuestions.forEach((q, idx) => {
    const key = styleAnswers[idx];
    if (!key) return;
    const opt = q.options.find((o) => o.key === key);
    if (!opt) return;
    (opt.tags || []).forEach((tag) => {
      if (tag.type !== 'axis' || !(tag.axis in sums)) return;
      sums[tag.axis] += tag.delta;
    });
  });

  const vector = {};
  AXES.forEach((axis) => {
    const { min, max } = bounds[axis];
    const range = max - min;
    if (range === 0) {
      vector[axis] = 5;
      return;
    }
    vector[axis] = clamp(((sums[axis] - min) / range) * 10, 0, 10);
  });
  return vector;
}

function vectorToArray(vector) {
  return AXES.map((a) => vector[a]);
}

function cosineSimilarity(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function buildAxisWeights(q0Keys) {
  const positions = q0Keys?.length ? q0Keys : ['midfielder'];
  const weight = positions.length > 1 ? DUAL_POSITION_AXIS_WEIGHT : ACTIVE_AXIS_WEIGHT;
  const weights = Object.fromEntries(AXES.map((axis) => [axis, INACTIVE_AXIS_WEIGHT]));
  positions.forEach((pos) => {
    (FAMILY_AXES[pos] || []).forEach((axis) => {
      weights[axis] = weight;
    });
  });
  return weights;
}

function weightedCosineSimilarity(a, b, weights) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    const w = weights[i];
    const ua = a[i] * w;
    const ub = b[i] * w;
    dot += ua * ub;
    normA += ua * ua;
    normB += ub * ub;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function getEnvTierFromOpt(opt) {
  const tierTag = (opt?.tags || []).find((t) => t.type === 'env_tier');
  return tierTag?.value || 'B';
}

function getSelfTierFromOpt(opt) {
  const tag = (opt?.tags || []).find(
    (t) => t.type === 'meta' && String(t.value).startsWith('Self Tier'),
  );
  return tag?.value?.replace('Self Tier ', '') || 'C';
}

function applyPlayLevelCaps(base, selfMod, envTier, selfTier) {
  const cappedBase = Math.min(base, MAX_BASE_BY_SELF[selfTier] ?? 6);
  let cappedSelfMod = selfMod;
  if (selfMod > 0) {
    cappedSelfMod = Math.min(selfMod, MAX_SELF_MOD_BY_ENV[envTier] ?? 0.08);
  }
  return { cappedBase, cappedSelfMod };
}

function applyPlayLevelSoftCap(score, envTier, selfTier) {
  if (envTier === 'A' && (selfTier === 'A' || selfTier === 'B')) {
    return Math.min(score, PLAYLEVEL_SOFT_CAP.elite);
  }
  if (envTier === 'A' || envTier === 'B+') {
    return Math.min(score, PLAYLEVEL_SOFT_CAP.high);
  }
  return Math.min(score, PLAYLEVEL_SOFT_CAP.standard);
}

function getCandidatePool(q0Keys, prototypes) {
  const pools = prototypes.position_pools;
  const ids = new Set();
  (q0Keys || []).forEach((pos) => {
    (pools[pos] || []).forEach((id) => ids.add(id));
  });
  if (ids.size === 0) {
    Object.keys(prototypes.prototypes).forEach((id) => ids.add(id));
  }
  return [...ids];
}

function matchArchetypes(userVec, q0Keys, prototypes, lockedPrimaryId = null) {
  const userArr = vectorToArray(userVec);
  const axisWeights = buildAxisWeights(q0Keys);
  const weightArr = AXES.map((axis) => axisWeights[axis]);
  const allIds = Object.keys(prototypes.prototypes);

  const ranked = allIds
    .map((id) => {
      const proto = prototypes.prototypes[id];
      const similarity = weightedCosineSimilarity(userArr, proto, weightArr);
      return { id, similarity };
    })
    .sort((a, b) => b.similarity - a.similarity);

  const pool = getCandidatePool(q0Keys, prototypes);
  let primary;
  if (lockedPrimaryId && prototypes.prototypes[lockedPrimaryId]) {
    primary = ranked.find((r) => r.id === lockedPrimaryId) || {
      id: lockedPrimaryId,
      similarity: ranked[0]?.similarity ?? 0,
    };
  } else {
    primary = ranked.find((r) => pool.includes(r.id)) || ranked[0];
  }

  const secondary =
    ranked.find((r) => r.id !== primary.id) ||
    ranked.find((r) => r.id !== lockedPrimaryId) ||
    ranked[1];

  const hybridPct =
    primary.similarity > 0
      ? clamp((secondary.similarity / primary.similarity) * 100, 0, 100)
      : 0;
  const isHybrid = secondary.similarity >= primary.similarity * 0.85;

  return {
    archetype_id: primary.id,
    secondary_id: secondary.id,
    is_hybrid: isHybrid,
    hybrid_percentage: Math.round(hybridPct),
    primary_similarity: primary.similarity,
    secondary_similarity: secondary.similarity,
    primary_locked: Boolean(lockedPrimaryId && prototypes.prototypes[lockedPrimaryId]),
    locked_primary_id: lockedPrimaryId || null,
  };
}

function styleExecutionBonus(vector) {
  const avg =
    STYLE_EXEC_AXES.reduce((sum, axis) => sum + (vector[axis] ?? 5), 0) / STYLE_EXEC_AXES.length;
  return ((avg - 5) / 5) * 0.35;
}

function computePlayLevel(intensityQuestions, intensityAnswers, literacyCorrect, styleVector) {
  let base = 5.0;
  const getOpt = (idx) => {
    const q = intensityQuestions[idx];
    const key = intensityAnswers[idx];
    if (!q || !key) return null;
    return q.options.find((o) => o.key === key);
  };

  const s1Opt = getOpt(0);
  const s10Opt = getOpt(9);
  const envTier = getEnvTierFromOpt(s1Opt);
  const selfTier = getSelfTierFromOpt(s10Opt);
  const tierTag = (s1Opt?.tags || []).find((t) => t.type === 'env_tier');
  if (tierTag) base = ENV_BASE[tierTag.value] ?? 5.0;

  const freqMod = getMetaModifier(getOpt(1), FREQ_MOD);
  const peerMod = getMetaModifier(getOpt(2), PEER_MOD);
  const reliabilityMod = getMetaModifier(getOpt(4), RELIABILITY_MOD);
  const pitchMod = getMetaModifier(getOpt(7), PITCH_MOD);
  const ageMod = getMetaModifier(getOpt(8), AGE_MOD);
  const selfModRaw = getMetaModifier(getOpt(9), SELF_MOD);
  const { cappedBase, cappedSelfMod } = applyPlayLevelCaps(base, selfModRaw, envTier, selfTier);
  base = cappedBase;
  const selfMod = cappedSelfMod;
  const availabilityMod = getMetaModifier(getOpt(3), AVAILABILITY_MOD);
  const disciplineMod = getMetaModifier(getOpt(4), DISCIPLINE_MOD);
  const mentalityMod = getMetaModifier(getOpt(5), MENTALITY_MOD);
  const weakFootMod = getMetaModifier(getOpt(6), WEAK_FOOT_MOD);
  const coachabilityMod = getMetaModifier(getOpt(9), COACHABILITY_MOD);

  const execIndices = [3, 5, 6];
  let execSum = 0;
  execIndices.forEach((idx) => {
    const opt = getOpt(idx);
    const tag = (opt?.tags || []).find((t) => t.type === 'exec');
    if (tag) execSum += EXEC_MOD[tag.value] ?? 0;
  });
  const execMod = execSum / 2;

  const litBonus = LITERACY_BONUS[literacyCorrect] ?? 0;
  const styleMod = styleExecutionBonus(styleVector || {});
  const rawScore =
    base +
    freqMod +
    peerMod +
    execMod +
    reliabilityMod +
    litBonus +
    pitchMod +
    ageMod +
    selfMod +
    styleMod +
    weakFootMod +
    availabilityMod +
    mentalityMod +
    disciplineMod +
    coachabilityMod;
  let score = clamp(rawScore, 1, 10);
  score = applyPlayLevelSoftCap(score, envTier, selfTier);

  return {
    playlevel_score: Math.round(score * 100) / 100,
    base,
    envTier,
    selfTier,
    selfModRaw,
    freqMod,
    peerMod,
    execMod,
    reliabilityMod,
    litBonus,
    pitchMod,
    ageMod,
    selfMod,
    weakFootMod,
    availabilityMod,
    mentalityMod,
    disciplineMod,
    coachabilityMod,
    styleMod,
    raw_score: Math.round(rawScore * 1000) / 1000,
  };
}

function mapIntensityBand(score) {
  if (score >= 9.3) return 'TIER_S';
  if (score >= 8.2) return 'TIER_A';
  if (score >= 6.5) return 'TIER_B';
  if (score >= 4.2) return 'TIER_C';
  return 'TIER_D';
}

function mapLiteracyBand(correctCount) {
  if (correctCount >= 5) return 'LIT_ELITE';
  if (correctCount >= 4) return 'LIT_HIGH';
  if (correctCount >= 2) return 'LIT_MID';
  return 'LIT_LOW';
}

function countLiteracyCorrect(literacyQuestions, literacyAnswers) {
  let n = 0;
  literacyQuestions.forEach((q, idx) => {
    if (literacyAnswers[idx] === q.correctKey) n += 1;
  });
  return n;
}

function buildAxisCoverage(styleQuestions) {
  const coverage = Object.fromEntries(AXES.map((a) => [a, 0]));
  (styleQuestions || []).forEach((q) => {
    const axesInQ = new Set();
    q.options.forEach((opt) => {
      (opt.tags || []).forEach((tag) => {
        if (tag.type === 'axis' && tag.axis in coverage) axesInQ.add(tag.axis);
      });
    });
    axesInQ.forEach((axis) => {
      coverage[axis] += 1;
    });
  });
  return coverage;
}

/** 仅统计已作答风格题对各轴的触达次数（球迷版雷达用） */
function buildAxisCoverageFromAnswers(styleQuestions, styleAnswers) {
  const coverage = Object.fromEntries(AXES.map((a) => [a, 0]));
  (styleQuestions || []).forEach((q, idx) => {
    const key = styleAnswers?.[idx];
    if (!key) return;
    const opt = q.options.find((o) => o.key === key);
    if (!opt) return;
    const axesInQ = new Set();
    (opt.tags || []).forEach((tag) => {
      if (tag.type === 'axis' && tag.axis in coverage) axesInQ.add(tag.axis);
    });
    axesInQ.forEach((axis) => {
      coverage[axis] += 1;
    });
  });
  return coverage;
}

function pickDefaultOptionKey(question) {
  const options = question?.options || [];
  if (!options.length) return null;
  const middle = options[Math.floor((options.length - 1) / 2)];
  return middle?.key ?? options[0].key;
}

function fillLiteServerDefaults(questions, payload) {
  const intensity = [...(payload.intensity || [])];
  const literacy = [...(payload.literacy || [])];

  questions.intensity.forEach((q, i) => {
    if (intensity[i] == null || intensity[i] === '') {
      intensity[i] = pickDefaultOptionKey(q);
    }
  });
  questions.literacy.forEach((q, i) => {
    if (literacy[i] == null || literacy[i] === '') {
      literacy[i] = pickDefaultOptionKey(q);
    }
  });

  return {
    ...payload,
    style: [...(payload.style || [])],
    intensity,
    literacy,
  };
}

function radarVisualValue(raw, coverage, isActive) {
  const confidence = Math.min(1, (coverage || 0) / 3);
  const adjusted = raw * confidence + 5 * (1 - confidence);
  const floor = isActive ? 2.8 : 4.2;
  const visual = floor + (adjusted / 10) * (10 - floor);
  return Math.round(clamp(visual, floor, 10) * 10) / 10;
}

function buildRadarData(vector, q0Keys, styleQuestions, styleAnswers, reportTier = 'pro') {
  const selected = new Set(q0Keys || []);
  const primary = q0Keys?.[0] || 'midfielder';
  const familyByAxis = {
    F2: 'defender',
    F3: 'midfielder',
    F4: 'wing',
    F5: 'striker',
  };
  const useAnsweredCoverage = reportTier === 'lite';
  const coverage = useAnsweredCoverage
    ? buildAxisCoverageFromAnswers(styleQuestions, styleAnswers)
    : buildAxisCoverage(styleQuestions);

  return AXES.map((k) => {
    const family = familyByAxis[k.slice(0, 2)];
    const meta = AXIS_META[k];
    const raw = Math.round((vector[k] ?? 5) * 10) / 10;
    const active = selected.size ? selected.has(family) : family === primary;
    const measurable = !useAnsweredCoverage || coverage[k] > 0;
    return {
      axis: k,
      family,
      label: meta?.short || k,
      full_label: meta?.label || k,
      value: raw,
      visual_value: radarVisualValue(raw, coverage[k], active),
      coverage: coverage[k],
      active,
      measurable,
    };
  });
}

function axisTone(axis, value) {
  const meta = AXIS_META[axis] || {};
  if (value >= 6.8) return meta.high || '该维度倾向明显偏高';
  if (value <= 3.2) return meta.low || '该维度倾向明显偏低';
  return '处在均衡区间，说明你会根据比赛局面切换处理方式';
}

const FAMILY_BY_AXIS = {
  F2: 'defender',
  F3: 'midfielder',
  F4: 'wing',
  F5: 'striker',
};

const POSITION_LABELS = {
  defender: '后卫',
  midfielder: '中场',
  wing: '边路',
  striker: '前锋',
};

function buildAxisInsights(vector, q0Keys, styleQuestions) {
  const selected = new Set(q0Keys?.length ? q0Keys : ['midfielder']);
  const coverage = buildAxisCoverage(styleQuestions);
  const activeLabel = (q0Keys || ['midfielder'])
    .map((k) => POSITION_LABELS[k] || k)
    .join('、');

  const items = AXES.map((axis) => {
    const family = FAMILY_BY_AXIS[axis.slice(0, 2)];
    const active = selected.has(family);
    const raw = Math.round((vector[axis] ?? 5) * 10) / 10;
    const display = radarVisualValue(raw, coverage[axis], active);
    return {
      axis,
      family,
      active,
      label: AXIS_META[axis]?.label || axis,
      value: display,
      raw_value: raw,
      tone: axisTone(axis, display),
      advice: AXIS_META[axis]?.advice || '',
    };
  });

  const activePool = items.filter((item) => item.active);
  const pool = activePool.length
    ? activePool
    : items.filter((item) => item.family === (q0Keys?.[0] || 'midfielder'));

  const byDistance = [...pool].sort((a, b) => Math.abs(b.value - 5) - Math.abs(a.value - 5));
  const top = [...pool].sort((a, b) => b.value - a.value).slice(0, 3);
  const bottom = [...pool].sort((a, b) => a.value - b.value).slice(0, 2);
  const signatures = byDistance.slice(0, 4);

  return {
    position_focus: activeLabel,
    axis_count: pool.length,
    summary: `以下解析聚焦你选择的「${activeLabel}」相关维度（${pool.length} 项）。风格星图仍保留 12 维全场全景；展示分经平滑处理，避免少量题目导致的 0/10 极端值。你的核心习惯由 ${signatures.map((i) => i.label).join('、')} 共同构成。`,
    signatures,
    dominant_traits: top,
    growth_edges: bottom,
    panorama_axes: items.filter((item) => !item.active),
  };
}

function pickAxis(vector, axes) {
  return axes
    .map((axis) => ({ axis, value: vector[axis] ?? 5 }))
    .sort((a, b) => b.value - a.value)[0];
}

function averageAxes(vector, axes) {
  return axes.reduce((sum, axis) => sum + (vector[axis] ?? 5), 0) / axes.length;
}

function buildMatchScript(vector, match, play, literacyBand) {
  const onBall = pickAxis(vector, ['F2-Distribution', 'F3-Tempo', 'F4-Mode', 'F5-HoldUp']);
  const offBall = pickAxis(vector, ['F2-Engagement', 'F3-Duels', 'F4-WorkRate', 'F5-Movement']);
  const space = pickAxis(vector, ['F3-Territory', 'F4-Width', 'F5-Movement']);
  const pressureText =
    play.execMod >= 0.2
      ? '抗压处理是加分项，遇到逼抢时不容易马上丢掉球权。'
      : play.execMod <= -0.2
        ? '高压下的第一脚处理是风险点，强队局里会被重点照顾。'
        : '抗压稳定性中等，面对连续逼抢时表现会受场地和队友接应影响。';

  return {
    with_ball: `持球时，你最容易通过「${AXIS_META[onBall.axis].label}」改变局面：${axisTone(onBall.axis, onBall.value)}。`,
    without_ball: `无球和防守阶段，你的关键开关是「${AXIS_META[offBall.axis].label}」：${axisTone(offBall.axis, offBall.value)}。`,
    transition: `攻守转换里，「${AXIS_META[space.axis].label}」决定你更像推进器、连接点还是终结点。${axisTone(space.axis, space.value)}。`,
    pressure: pressureText,
    game_context:
      literacyBand === 'LIT_ELITE'
        ? '你适合承担更复杂的战术角色：触发边线陷阱、运用第三人原则破压、在密集防守中寻找肋部渗透，并在丢球后第一时间延缓反击。'
        : literacyBand === 'LIT_HIGH'
          ? '你能读懂压迫路线、后场轮转、肋部跑位和丢球延缓的大方向，适合在体系里承担明确的战术触发任务。'
          : literacyBand === 'LIT_MID'
            ? '你具备基础战术概念，但复杂轮转下最好把任务拆成清晰的两三个触发条件。'
            : '你更适合明确、直接的场上指令，先把站位、第一选择和丢球后的回防节奏稳定下来。',
  };
}

function buildPlayBreakdown(play) {
  return [
    { label: '比赛环境', value: play.base, impact: play.base - 5 },
    { label: '踢球频率', value: play.freqMod, impact: play.freqMod },
    { label: '队友/对手水平', value: play.peerMod, impact: play.peerMod },
    { label: '执行稳定性', value: play.execMod, impact: play.execMod },
    { label: '位置可靠性', value: play.reliabilityMod, impact: play.reliabilityMod },
    { label: '战术素养', value: play.litBonus, impact: play.litBonus },
    { label: '场地条件', value: play.pitchMod, impact: play.pitchMod },
    { label: '年龄体能', value: play.ageMod, impact: play.ageMod },
    { label: '自评校准', value: play.selfMod, impact: play.selfMod },
    { label: '逆足能力', value: play.weakFootMod, impact: play.weakFootMod },
    { label: '出勤可用性', value: play.availabilityMod, impact: play.availabilityMod },
    { label: '关键心态', value: play.mentalityMod, impact: play.mentalityMod },
    { label: '战术纪律', value: play.disciplineMod, impact: play.disciplineMod },
    { label: '学习适配', value: play.coachabilityMod, impact: play.coachabilityMod },
    { label: '风格执行画像', value: play.styleMod, impact: play.styleMod },
  ];
}

function normalizeScore(n) {
  return Math.round(clamp(n, 1, 10) * 10) / 10;
}

function scoreBand(score) {
  if (score >= 8.5) return '突出';
  if (score >= 7) return '良好';
  if (score >= 5.5) return '可用';
  if (score >= 4) return '待提升';
  return '明显短板';
}

function buildScoutProfile(vector, play, literacyCorrect) {
  const technical = normalizeScore(
    averageAxes(vector, ['F2-Distribution', 'F3-Tempo', 'F4-Mode', 'F5-HoldUp', 'F5-Physical']) +
      play.weakFootMod * 4,
  );
  const physical = normalizeScore(
    PHYSICAL_BASE +
      (averageAxes(vector, ['F2-Body', 'F3-Duels', 'F4-WorkRate', 'F5-Physical']) - 5) *
        PHYSICAL_STYLE_DEV_WEIGHT +
      play.execMod * PHYSICAL_EXEC_WEIGHT +
      play.ageMod * PHYSICAL_AGE_WEIGHT,
  );
  let tacticalRaw =
    TACTICAL_BASE +
    literacyCorrect * TACTICAL_LIT_WEIGHT +
    play.disciplineMod * TACTICAL_DISCIPLINE_WEIGHT +
    (averageAxes(vector, ['F2-Distribution', 'F3-Tempo', 'F3-Territory', 'F4-Width']) - 5) *
      TACTICAL_STYLE_AXIS_WEIGHT;
  if (literacyCorrect >= 5) tacticalRaw = Math.max(tacticalRaw, TACTICAL_ELITE_FLOOR);
  const tactical = normalizeScore(tacticalRaw);
  const mentality = normalizeScore(
    5 +
      play.mentalityMod * 6 +
      play.coachabilityMod * 5 +
      play.reliabilityMod * 2,
  );
  const availability = normalizeScore(
    5 +
      play.availabilityMod * 10 +
      play.freqMod * 2 +
      play.pitchMod * 2,
  );

  const dimensions = [
    {
      key: 'technical',
      label: '技术完整度',
      score: technical,
      desc: '结合出球、节奏、边路处理、支点与终结，再用逆足能力校准。',
    },
    {
      key: 'physical',
      label: '身体与执行',
      score: physical,
      desc: '结合对抗、往返、身体工具、终结爆发，以及体能与年龄状态。',
    },
    {
      key: 'tactical',
      label: '战术理解',
      score: tactical,
      desc: '结合压迫陷阱、第三人破压、肋部渗透、丢球延缓等素养题表现，以及纪律性和空间/节奏相关风格轴。',
    },
    {
      key: 'mentality',
      label: '心态与可培养性',
      score: mentality,
      desc: '结合关键时刻心态、学习适配和位置可靠性。',
    },
    {
      key: 'availability',
      label: '可出勤性',
      score: availability,
      desc: '结合出勤伤病、踢球频率和常见场地风险。',
    },
  ].map((d) => ({ ...d, band: scoreBand(d.score) }));

  const sorted = [...dimensions].sort((a, b) => b.score - a.score);
  return {
    dimensions,
    scout_summary: `从球探视角看，你最值得被标记的是「${sorted[0].label}」，当前最需要管理的是「${sorted[sorted.length - 1].label}」。`,
    strongest: sorted[0],
    weakest: sorted[sorted.length - 1],
  };
}

function buildDeepReport(vector, match, play, literacyBand, literacyCorrect, q0Keys, styleQuestions) {
  return {
    axis_insights: buildAxisInsights(vector, q0Keys, styleQuestions),
    match_script: buildMatchScript(vector, match, play, literacyBand),
    playlevel_breakdown: buildPlayBreakdown(play),
    scout_profile: buildScoutProfile(vector, play, literacyCorrect),
  };
}

function assembleTraining(copyPack, baseTraining, intensityBand, literacyBand) {
  const layers = copyPack.training_layers;
  const priority1 = baseTraining?.priority_1 || '';
  const priority2 = baseTraining?.priority_2 || '';

  if (!layers) {
    return {
      priority_1: priority1,
      priority_2: priority2,
      items: [
        { tag: '风格专项', text: priority1 },
        { tag: '风格专项', text: priority2 },
      ].filter((item) => item.text),
      highlight: null,
    };
  }

  const intensity = layers.intensity?.[intensityBand] || {};
  const literacy = layers.literacy?.[literacyBand] || {};
  const items = [
    { tag: '风格专项', text: priority1 },
    { tag: '风格专项', text: priority2 },
    intensity.focus ? { tag: intensity.label || '强度适配', text: intensity.focus } : null,
    literacy.focus ? { tag: literacy.label || '素养提升', text: literacy.focus } : null,
  ].filter((item) => item && item.text);

  const fusionKey = `${intensityBand}|${literacyBand}`;
  const highlight = layers.fusion?.[fusionKey]?.highlight || null;

  return {
    priority_1: priority1,
    priority_2: priority2,
    items,
    highlight,
    intensity_layer: intensity.focus ? intensity : null,
    literacy_layer: literacy.focus ? literacy : null,
  };
}

function assembleCopy(copyPack, archetypeId, secondaryId, isHybrid, intensityBand, literacyBand) {
  const arch = copyPack.archetypes[archetypeId];
  if (!arch) return null;

  const base = { ...arch.base };
  let title = base.title;
  let hybridDesc = null;

  if (isHybrid && secondaryId && arch.hybrids?.[secondaryId]) {
    const h = arch.hybrids[secondaryId];
    title = `${title} · ${h.title_suffix}`;
    hybridDesc = h.desc;
    if (h.ref_flavor) {
      base.style_reference = {
        ...base.style_reference,
        hybrid_add: h.ref_flavor.add_line,
        hybrid_highlight: h.ref_flavor.highlight,
      };
    }
  }

  const intensity = copyPack.intensity_modifiers[intensityBand] || {};
  const literacy = copyPack.literacy_modifiers[literacyBand] || {};

  return {
    title,
    tagline: base.tagline,
    description: base.description,
    strengths: base.strengths,
    weaknesses: base.weaknesses,
    training: assembleTraining(copyPack, base.training, intensityBand, literacyBand),
    formation_fit: base.formation_fit,
    style_reference: base.style_reference,
    hybrid_desc: hybridDesc,
    intensity_label: intensity.label,
    intensity_suffix: intensity.suffix,
    intensity_tone: intensity.tone_desc,
    intensity_color: intensity.color,
    literacy_tag: literacy.tag,
    literacy_label: literacy.label,
    literacy_desc: literacy.desc,
  };
}

const LITE_STYLE_COUNT = 12;

function calculateReport(payload) {
  const questions = loadJson('questions.json');
  const copyPack = loadJson('copy_pack.json');
  const prototypes = loadJson('archetype_prototypes.json');

  const reportTier = payload.report_tier === 'lite' ? 'lite' : 'pro';
  const normalized =
    reportTier === 'lite' ? fillLiteServerDefaults(questions, payload) : payload;

  const {
    q0 = [],
    style = [],
    intensity = [],
    literacy = [],
    locked_primary_id: lockedPrimaryId = null,
  } = normalized;

  const styleVec = computeStyleVector(questions.style, style);
  const lockId =
    lockedPrimaryId && prototypes.prototypes[lockedPrimaryId] ? lockedPrimaryId : null;
  const match = matchArchetypes(styleVec, q0, prototypes, lockId);
  const litCorrect = countLiteracyCorrect(questions.literacy, literacy);
  const play = computePlayLevel(questions.intensity, intensity, litCorrect, styleVec);
  const intensityBand = mapIntensityBand(play.playlevel_score);
  const literacyBand = mapLiteracyBand(litCorrect);
  const copyData = assembleCopy(
    copyPack,
    match.archetype_id,
    match.secondary_id,
    match.is_hybrid,
    intensityBand,
    literacyBand,
  );

  const archBase = copyPack.archetypes[match.archetype_id]?.base;
  const deepReport = buildDeepReport(styleVec, match, play, literacyBand, litCorrect, q0, questions.style);

  return {
    report_tier: reportTier,
    primary_locked: match.primary_locked || false,
    locked_primary_id: match.locked_primary_id,
    q0_positions: q0,
    archetype_id: match.archetype_id,
    archetype_title: copyData?.title || archBase?.title,
    is_hybrid: match.is_hybrid,
    hybrid_desc: copyData?.hybrid_desc,
    secondary_archetype_id: match.secondary_id,
    hybrid_percentage: match.hybrid_percentage,
    playlevel_score: play.playlevel_score,
    intensity_band: intensityBand,
    literacy_band: literacyBand,
    literacy_correct: litCorrect,
    radar_data: buildRadarData(styleVec, q0, questions.style, style, reportTier),
    style_vector: styleVec,
    deep_report: deepReport,
    copy_data: copyData,
  };
}

module.exports = { calculateReport, AXES, LITE_STYLE_COUNT };
