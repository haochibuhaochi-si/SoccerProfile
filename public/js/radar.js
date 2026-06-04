/**
 * Canvas 雷达图绘制
 */
function drawRadarChart(canvas, radarData) {
  if (!canvas || !radarData?.length) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2 + 10;
  const radius = Math.min(w, h) * 0.32;
  const n = radarData.length;
  const maxVal = 10;

  ctx.clearRect(0, 0, w, h);

  const angles = radarData.map((_, i) => (Math.PI * 2 * i) / n - Math.PI / 2);

  function pointAt(i, r) {
    return {
      x: cx + Math.cos(angles[i]) * r,
      y: cy + Math.sin(angles[i]) * r,
    };
  }

  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.fillStyle = 'rgba(0,212,255,0.06)';
  for (let ring = 1; ring <= 5; ring++) {
    const r = (radius * ring) / 5;
    ctx.beginPath();
    angles.forEach((_, i) => {
      const p = pointAt(i, r);
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.stroke();
  }

  angles.forEach((_, i) => {
    const p = pointAt(i, radius);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  });

  ctx.beginPath();
  radarData.forEach((d, i) => {
    const r = (d.value / maxVal) * radius;
    const p = pointAt(i, r);
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.closePath();
  ctx.fillStyle = 'rgba(0, 212, 255, 0.25)';
  ctx.fill();
  ctx.strokeStyle = '#00d4ff';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#8b9bb8';
  ctx.font = '11px DM Sans, sans-serif';
  ctx.textAlign = 'center';
  radarData.forEach((d, i) => {
    const p = pointAt(i, radius + 22);
    const lines = d.label.match(/.{1,4}/g) || [d.label];
    lines.forEach((line, li) => {
      ctx.fillText(line, p.x, p.y + li * 12 - (lines.length - 1) * 6);
    });
  });
}

window.drawRadarChart = drawRadarChart;
