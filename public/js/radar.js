/**
 * Canvas 雷达图绘制
 */
function drawRadarChart(canvas, radarData) {
  if (!canvas || !radarData?.length) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2 + 2;
  const radius = Math.min(w, h) * 0.31;
  const n = radarData.length;
  const maxVal = 10;

  ctx.clearRect(0, 0, w, h);
  ctx.save();

  const angles = radarData.map((_, i) => (Math.PI * 2 * i) / n - Math.PI / 2);

  function pointAt(i, r) {
    return {
      x: cx + Math.cos(angles[i]) * r,
      y: cy + Math.sin(angles[i]) * r,
    };
  }

  const bg = ctx.createRadialGradient(cx, cy, 4, cx, cy, radius * 1.35);
  bg.addColorStop(0, 'rgba(0, 212, 255, 0.18)');
  bg.addColorStop(0.52, 'rgba(0, 212, 255, 0.04)');
  bg.addColorStop(1, 'rgba(255, 107, 53, 0.02)');
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 1.28, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  for (let ring = 1; ring <= 5; ring++) {
    const r = (radius * ring) / 5;
    ctx.beginPath();
    angles.forEach((_, i) => {
      const p = pointAt(i, r);
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.lineWidth = ring === 5 ? 1.4 : 0.8;
    ctx.stroke();
  }

  angles.forEach((_, i) => {
    const p = pointAt(i, radius);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(p.x, p.y);
    ctx.strokeStyle = radarData[i].active ? 'rgba(0, 212, 255, 0.34)' : 'rgba(255,255,255,0.08)';
    ctx.lineWidth = radarData[i].active ? 1.2 : 0.7;
    ctx.stroke();
  });

  const points = radarData.map((d, i) => {
    const r = (d.value / maxVal) * radius;
    return pointAt(i, r);
  });

  ctx.shadowColor = 'rgba(0, 212, 255, 0.75)';
  ctx.shadowBlur = 18;
  ctx.beginPath();
  points.forEach((p, i) => {
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.closePath();
  const fill = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
  fill.addColorStop(0, 'rgba(0, 212, 255, 0.42)');
  fill.addColorStop(0.55, 'rgba(111, 66, 255, 0.28)');
  fill.addColorStop(1, 'rgba(255, 107, 53, 0.25)');
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 245, 255, 0.95)';
  ctx.lineWidth = 2.4;
  ctx.stroke();
  ctx.shadowBlur = 0;

  points.forEach((p, i) => {
    const d = radarData[i];
    ctx.beginPath();
    ctx.arc(p.x, p.y, d.active ? 4.5 : 3.4, 0, Math.PI * 2);
    ctx.fillStyle = d.active ? '#ffcf5a' : '#00d4ff';
    ctx.fill();
    ctx.strokeStyle = 'rgba(10, 14, 23, 0.8)';
    ctx.lineWidth = 1.6;
    ctx.stroke();
  });

  ctx.font = '600 10px DM Sans, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  radarData.forEach((d, i) => {
    const labelPoint = pointAt(i, radius + 30);
    const scorePoint = pointAt(i, radius + 14);
    ctx.fillStyle = d.active ? '#ffcf5a' : '#8b9bb8';
    ctx.fillText(d.label, labelPoint.x, labelPoint.y);
    ctx.fillStyle = d.value >= 7 ? '#00f5ff' : d.value <= 3.5 ? '#ff8a65' : 'rgba(232, 237, 247, 0.82)';
    ctx.fillText(d.value.toFixed(1), scorePoint.x, scorePoint.y);
  });

  ctx.fillStyle = 'rgba(232, 237, 247, 0.16)';
  ctx.beginPath();
  ctx.arc(cx, cy, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

window.drawRadarChart = drawRadarChart;
