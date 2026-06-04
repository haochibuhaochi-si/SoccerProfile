/**
 * 从 question.md 生成 questions.json
 */
const fs = require('fs');
const path = require('path');

const md = fs.readFileSync(path.join(__dirname, '../question.md'), 'utf8');
const lines = md.split('\n');

const questions = { q0: null, style: [], intensity: [], literacy: [] };
let current = null;
let section = null;

function parseTags(tagStr) {
  const tags = [];
  const re = /\[([^\]]+)\]/g;
  let m;
  while ((m = re.exec(tagStr)) !== null) {
    const raw = m[1].trim();
    if (raw.startsWith('Env Tier')) {
      const tier = raw.replace('Env Tier ', '').trim();
      tags.push({ type: 'env_tier', value: tier });
    } else if (raw.startsWith('Exec')) {
      const v = raw.replace('Exec ', '').trim();
      tags.push({ type: 'exec', value: v });
    } else if (raw.match(/^F\d+-/)) {
      const parts = raw.split(':');
      const axis = parts[0].trim();
      const sign = (parts[1] || '+').trim().replace(/[\[\]]/g, '');
      let delta = 0;
      if (sign === '+') delta = 1;
      else if (sign === '-') delta = -1;
      tags.push({ type: 'axis', axis, delta });
    } else {
      tags.push({ type: 'meta', value: raw });
    }
  }
  return tags;
}

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  if (line.includes('Part 0')) section = 'q0';
  else if (line.includes('Part 1')) section = 'style';
  else if (line.includes('Part 2')) section = 'intensity';
  else if (line.includes('Part 3')) section = 'literacy';

  const qMatch = line.match(/^\*\*(Q\d+|S\d+|K\d+)\./);
  if (qMatch) {
    const id = qMatch[1];
    let text = line.replace(/^\*\*[^*]+\*\*\s*/, '').replace(/\*\*/g, '');
    if (id === 'Q0' && !text) text = '你最常踢的位置是？（多选，最多2项）';
    current = { id, text, options: [] };
    if (section === 'q0') {
      current.type = 'checkbox';
      current.maxSelect = 2;
      questions.q0 = current;
    } else if (section === 'style') {
      current.type = 'radio';
      questions.style.push(current);
    } else if (section === 'intensity') {
      current.type = 'radio';
      questions.intensity.push(current);
    } else if (section === 'literacy') {
      current.type = 'radio';
      current.correctKey = null;
      questions.literacy.push(current);
    }
    continue;
  }

  const optMatch = line.match(/^\*?\s*([A-E])\.\s*(.+?)(?:\s*->\s*\*(.+)\*)?$/);
  if (optMatch && current) {
    const key = optMatch[1];
    let label = optMatch[2].replace(/\*\*/g, '').trim();
    const tagPart = optMatch[3] || '';
    const tags = tagPart ? parseTags(tagPart) : [];
    current.options.push({ key, label, tags });
  }

  const checkboxMatch = line.match(/^\*\s*\[\s*\]\s*(.+)$/);
  if (checkboxMatch && current && section === 'q0') {
    const label = checkboxMatch[1].trim();
    const keys = ['defender', 'midfielder', 'wing', 'striker'];
    const key = keys[current.options.length] || `opt${current.options.length}`;
    current.options.push({ key, label, tags: [] });
  }
}

// K 题正确答案
const correct = { K1: 'B', K2: 'B', K3: 'B', K4: 'B', K5: 'C' };
questions.literacy.forEach((q) => {
  q.correctKey = correct[q.id] || 'B';
});

const out = path.join(__dirname, '../data/questions.json');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(questions, null, 2), 'utf8');
console.log('Wrote', out, {
  style: questions.style.length,
  intensity: questions.intensity.length,
  literacy: questions.literacy.length,
});
