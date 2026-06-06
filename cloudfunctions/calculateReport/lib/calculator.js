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

const ENV_BASE = { A: 8.0, 'B+': 6.5, B: 5.0, C: 3.5, D: 2.0 };
const EXEC_MOD = { '+0.2': 0.3, '0': 0, '-0.2': -0.3, '-0.4': -0.5 };
const FREQ_MOD = { 'Freq High': 0.5, 'Freq Med': 0.2, 'Freq Low': 0, 'Freq Rare': -0.3 };
const PEER_MOD = { 'Peer Level High': 0.4, 'Peer Level Med': 0.1, 'Peer Level Low': -0.2 };
const RELIABILITY_MOD = { 'Reliability High': 0.3, 'Reliability Med': 0.1, 'Reliability Low': -0.2 };
const PITCH_MOD = { 'Env Bonus': 0.1, 'Env Neutral': 0, 'Env Penalty': -0.1 };
const LITERACY_BONUS = { 4: 0.6, 3: 0.4, 2: 0.2 };

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function getMetaModifier(opt, modMap) {
  const meta = (opt?.tags || []).find((t) => t.type === 'meta');
  if (!meta) return 0;
  return modMap[meta.value] ?? 0;
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

function matchArchetypes(userVec, q0Keys, prototypes) {
  const userArr = vectorToArray(userVec);
  const allIds = Object.keys(prototypes.prototypes);

  const ranked = allIds
    .map((id) => {
      const proto = prototypes.prototypes[id];
      const similarity = cosineSimilarity(userArr, proto);
      return { id, similarity };
    })
    .sort((a, b) => b.similarity - a.similarity);

  const pool = getCandidatePool(q0Keys, prototypes);
  const primary = ranked.find((r) => pool.includes(r.id)) || ranked[0];
  const secondary = ranked.find((r) => r.id !== primary.id) || ranked[1];

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
  };
}

function computePlayLevel(intensityQuestions, intensityAnswers, literacyCorrect) {
  let base = 5.0;
  const getOpt = (idx) => {
    const q = intensityQuestions[idx];
    const key = intensityAnswers[idx];
    if (!q || !key) return null;
    return q.options.find((o) => o.key === key);
  };

  const s1Opt = getOpt(0);
  const tierTag = (s1Opt?.tags || []).find((t) => t.type === 'env_tier');
  if (tierTag) base = ENV_BASE[tierTag.value] ?? 5.0;

  const freqMod = getMetaModifier(getOpt(1), FREQ_MOD);
  const peerMod = getMetaModifier(getOpt(2), PEER_MOD);
  const reliabilityMod = getMetaModifier(getOpt(4), RELIABILITY_MOD);
  const pitchMod = getMetaModifier(getOpt(7), PITCH_MOD);

  const execIndices = [3, 5, 6];
  let execSum = 0;
  let execCount = 0;
  execIndices.forEach((idx) => {
    const opt = getOpt(idx);
    const tag = (opt?.tags || []).find((t) => t.type === 'exec');
    if (tag) {
      execSum += EXEC_MOD[tag.value] ?? 0;
      execCount += 1;
    }
  });
  const execMod = execCount ? execSum / execCount : 0;

  const litBonus = LITERACY_BONUS[literacyCorrect] ?? 0;
  const score = clamp(
    base + freqMod + peerMod + execMod + reliabilityMod + litBonus + pitchMod,
    1,
    10,
  );

  return {
    playlevel_score: Math.round(score * 10) / 10,
    base,
    freqMod,
    peerMod,
    execMod,
    reliabilityMod,
    litBonus,
    pitchMod,
  };
}

function mapIntensityBand(score) {
  if (score >= 8.5) return 'TIER_A';
  if (score >= 6.5) return 'TIER_B';
  if (score >= 4.0) return 'TIER_C';
  return 'TIER_D';
}

function mapLiteracyBand(correctCount) {
  if (correctCount >= 4) return 'LIT_HIGH';
  if (correctCount >= 3) return 'LIT_MID';
  return 'LIT_LOW';
}

function countLiteracyCorrect(literacyQuestions, literacyAnswers) {
  let n = 0;
  literacyQuestions.forEach((q, idx) => {
    if (literacyAnswers[idx] === q.correctKey) n += 1;
  });
  return n;
}

function buildRadarData(vector, q0Keys, prototypes) {
  const families = {
    defender: ['F2-Engagement', 'F2-Distribution', 'F2-Body'],
    midfielder: ['F3-Tempo', 'F3-Duels', 'F3-Territory'],
    wing: ['F4-Mode', 'F4-WorkRate', 'F4-Width'],
    striker: ['F5-HoldUp', 'F5-Movement', 'F5-Physical'],
  };
  const primary = q0Keys?.[0] || 'midfielder';
  const keys = families[primary] || families.midfielder;
  const labels = prototypes.radar_labels[primary] || prototypes.radar_labels.midfielder;
  return keys.map((k, i) => ({
    axis: k,
    label: labels[i],
    value: Math.round((vector[k] ?? 5) * 10) / 10,
  }));
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
    training: base.training,
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

function calculateReport(payload) {
  const questions = loadJson('questions.json');
  const copyPack = loadJson('copy_pack.json');
  const prototypes = loadJson('archetype_prototypes.json');

  const {
    q0 = [],
    style = [],
    intensity = [],
    literacy = [],
  } = payload;

  const styleVec = computeStyleVector(questions.style, style);
  const match = matchArchetypes(styleVec, q0, prototypes);
  const litCorrect = countLiteracyCorrect(questions.literacy, literacy);
  const play = computePlayLevel(questions.intensity, intensity, litCorrect);
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

  return {
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
    radar_data: buildRadarData(styleVec, q0, prototypes),
    style_vector: styleVec,
    copy_data: copyData,
  };
}

module.exports = { calculateReport, AXES };
