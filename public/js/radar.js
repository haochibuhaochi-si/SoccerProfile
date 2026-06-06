/**
 * Canvas 风格星图 - 12 维分区展示
 */
const RADAR_FAMILIES = {
  defender: { label: '后卫', color: '#00d4ff' },
  midfielder: { label: '中场', color: '#a78bfa' },
  wing: { label: '边路', color: '#ffcf5a' },
  striker: { label: '前锋', color: '#ff8a65' },
};

function drawRadarChart(canvas, radarData) {
  if (!canvas || !radarData?.length) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;
  const radius = Math.min(w, h) * 0.26;
  const n = radarData.length;
  const maxVal = 10;
  const minVal = 2.5;

  ctx.clearRect(0, 0, w, h);
  ctx.save();

  const angles = radarData.map((_, i) => (Math.PI * 2 * i) / n - Math.PI / 2);

  function pointAt(i, r) {
    return {
      x: cx + Math.cos(angles[i]) * r,
      y: cy + Math.sin(angles[i]) * r,
    };
  }

  function valueRadius(value) {
    const normalized = (value - minVal) / (maxVal - minVal);
    return clampRadius(normalized) * radius;
  }

  function clampRadius(n) {
    return Math.max(0.08, Math.min(1, n));
  }

  const bg = ctx.createRadialGradient(cx, cy, 8, cx, cy, radius * 1.45);
  bg.addColorStop(0, 'rgba(0, 212, 255, 0.14)');
  bg.addColorStop(0.55, 'rgba(18, 26, 43, 0.35)');
  bg.addColorStop(1, 'rgba(10, 14, 23, 0.05)');
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 1.42, 0, Math.PI * 2);
  ctx.fill();

  const sectors = [
    { family: 'defender', start: 0, end: 3 },
    { family: 'midfielder', start: 3, end: 6 },
    { family: 'wing', start: 6, end: 9 },
    { family: 'striker', start: 9, end: 12 },
  ];
  sectors.forEach(({ family, start, end }) => {
    const color = RADAR_FAMILIES[family].color;
    const active = radarData.slice(start, end).some((d) => d.active);
    const startAngle = angles[start] - Math.PI / n;
    const endAngle = angles[end - 1] + Math.PI / n;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius * 1.08, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = active ? hexToRgba(color, 0.11) : hexToRgba(color, 0.035);
    ctx.fill();
  });

  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  for (let ring = 1; ring <= 4; ring++) {
    const r = (radius * ring) / 4;
    ctx.beginPath();
    angles.forEach((_, i) => {
      const p = pointAt(i, r);
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.lineWidth = ring === 4 ? 1.2 : 0.7;
    ctx.stroke();
  }

  angles.forEach((_, i) => {
    const d = radarData[i];
    const p = pointAt(i, radius);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(p.x, p.y);
    ctx.strokeStyle = d.active
      ? hexToRgba(RADAR_FAMILIES[d.family]?.color || '#00d4ff', 0.28)
      : 'rgba(255,255,255,0.05)';
    ctx.lineWidth = d.active ? 1 : 0.6;
    ctx.stroke();
  });

  const ghostPoints = radarData.map((d, i) => pointAt(i, valueRadius(d.visual_value ?? d.value)));
  ctx.beginPath();
  ghostPoints.forEach((p, i) => {
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.closePath();
  ctx.fillStyle = 'rgba(0, 212, 255, 0.08)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 212, 255, 0.18)';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  const activeIndices = radarData.map((d, i) => (d.active ? i : -1)).filter((i) => i >= 0);
  if (activeIndices.length) {
    ctx.shadowColor = 'rgba(0, 212, 255, 0.55)';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    activeIndices.forEach((idx, localIdx) => {
      const p = ghostPoints[idx];
      if (localIdx === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    const fill = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
    fill.addColorStop(0, 'rgba(0, 212, 255, 0.34)');
    fill.addColorStop(0.55, 'rgba(167, 139, 250, 0.22)');
    fill.addColorStop(1, 'rgba(255, 143, 101, 0.2)');
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 245, 255, 0.92)';
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  ghostPoints.forEach((p, i) => {
    const d = radarData[i];
    ctx.beginPath();
    ctx.arc(p.x, p.y, d.active ? 4.2 : 2.6, 0, Math.PI * 2);
    ctx.fillStyle = d.active
      ? RADAR_FAMILIES[d.family]?.color || '#00d4ff'
      : 'rgba(139, 155, 184, 0.55)';
    ctx.fill();
  });

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  radarData.forEach((d, i) => {
    const labelR = radius + (d.active ? (i % 2 === 0 ? 34 : 42) : (i % 2 === 0 ? 50 : 58));
    const labelPoint = pointAt(i, labelR);
    const labelText = d.full_label || d.label;

    if (d.active) {
      ctx.font = '600 10px sans-serif';
      ctx.fillStyle = RADAR_FAMILIES[d.family]?.color || '#8b9bb8';
      ctx.fillText(d.label, labelPoint.x, labelPoint.y);
      const scorePoint = pointAt(i, radius + 18);
      ctx.font = '700 9px sans-serif';
      const score = d.value ?? 0;
      ctx.fillStyle = score >= 7 ? '#00f5ff' : score <= 3.5 ? '#ff8a65' : '#e8edf7';
      ctx.fillText(score.toFixed(1), scorePoint.x, scorePoint.y);
      return;
    }

    ctx.font = '500 8px sans-serif';
    ctx.fillStyle = 'rgba(139, 155, 184, 0.78)';
    if (labelText.length > 5) {
      const mid = Math.ceil(labelText.length / 2);
      ctx.fillText(labelText.slice(0, mid), labelPoint.x, labelPoint.y - 5);
      ctx.fillText(labelText.slice(mid), labelPoint.x, labelPoint.y + 5);
    } else {
      ctx.fillText(labelText, labelPoint.x, labelPoint.y);
    }
  });

  ctx.fillStyle = 'rgba(232, 237, 247, 0.2)';
  ctx.beginPath();
  ctx.arc(cx, cy, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function hexToRgba(hex, alpha) {
  const raw = hex.replace('#', '');
  const bigint = parseInt(raw, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

window.drawRadarChart = drawRadarChart;
window.RADAR_FAMILIES = RADAR_FAMILIES;
