/**
 * Canvas 风格星图 - 12 维分区展示
 */
const RADAR_FAMILIES = {
  defender: { label: '后卫', color: '#00d4ff' },
  midfielder: { label: '中场', color: '#a78bfa' },
  wing: { label: '边路', color: '#ffcf5a' },
  striker: { label: '前锋', color: '#ff8a65' },
};

const RADAR_FONT =
  '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", sans-serif';

function setupRadarCanvas(canvas, cssSize = 360) {
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  canvas.width = Math.round(cssSize * dpr);
  canvas.height = Math.round(cssSize * dpr);
  canvas.style.width = `${cssSize}px`;
  canvas.style.height = `${cssSize}px`;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  return { ctx, w: cssSize, h: cssSize };
}

function drawRadarLabel(ctx, text, x, y, fillStyle, font, stroke = true) {
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (stroke) {
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(6, 10, 18, 0.92)';
    ctx.strokeText(text, x, y);
  }
  ctx.fillStyle = fillStyle;
  ctx.fillText(text, x, y);
}

function drawRadarChart(canvas, radarData) {
  if (!canvas || !radarData?.length) return;
  const cssSize = Number(canvas.dataset.cssSize || canvas.getAttribute('width')) || 360;
  const { ctx, w, h } = setupRadarCanvas(canvas, cssSize);
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

  radarData.forEach((d, i) => {
    const labelR = radius + (d.active ? (i % 2 === 0 ? 36 : 44) : (i % 2 === 0 ? 52 : 60));
    const labelPoint = pointAt(i, labelR);
    const labelText = d.full_label || d.label;

    if (d.active) {
      drawRadarLabel(
        ctx,
        d.label,
        labelPoint.x,
        labelPoint.y,
        RADAR_FAMILIES[d.family]?.color || '#d8ecff',
        `600 12px ${RADAR_FONT}`,
      );
      const scorePoint = pointAt(i, radius + 20);
      const score = d.value ?? 0;
      drawRadarLabel(
        ctx,
        score.toFixed(1),
        scorePoint.x,
        scorePoint.y,
        score >= 7 ? '#7ff7ff' : score <= 3.5 ? '#ffb199' : '#f3f7ff',
        `700 11px ${RADAR_FONT}`,
      );
      return;
    }

    const inactiveColor = 'rgba(228, 236, 248, 0.94)';
    const inactiveFont = `500 10.5px ${RADAR_FONT}`;
    if (labelText.length > 5) {
      const mid = Math.ceil(labelText.length / 2);
      drawRadarLabel(ctx, labelText.slice(0, mid), labelPoint.x, labelPoint.y - 6, inactiveColor, inactiveFont);
      drawRadarLabel(ctx, labelText.slice(mid), labelPoint.x, labelPoint.y + 6, inactiveColor, inactiveFont);
    } else {
      drawRadarLabel(ctx, labelText, labelPoint.x, labelPoint.y, inactiveColor, inactiveFont);
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
