/**
 * 截取弹窗 Scout Card：优先读取页面真实排版，微信内更稳定
 */
(function () {
  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('插画加载失败'));
      img.src = src;
    });
  }

  function parseCssColor(input, fallback = { r: 0, g: 212, b: 255 }) {
    if (!input) return fallback;
    const probe = document.createElement('canvas').getContext('2d');
    probe.fillStyle = input;
    const normalized = probe.fillStyle;
    const match = normalized.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (!match) return fallback;
    return { r: Number(match[1]), g: Number(match[2]), b: Number(match[3]) };
  }

  function rgba(rgb, alpha) {
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
  }

  function mixRgb(a, b, weight) {
    const t = Math.max(0, Math.min(1, weight));
    return {
      r: Math.round(a.r * (1 - t) + b.r * t),
      g: Math.round(a.g * (1 - t) + b.g * t),
      b: Math.round(a.b * (1 - t) + b.b * t),
    };
  }

  function readCardAccent(cardEl) {
    const accent =
      getComputedStyle(cardEl).getPropertyValue('--card-accent').trim() ||
      getComputedStyle(cardEl).getPropertyValue('--card-accent-2').trim() ||
      '#00d4ff';
    return parseCssColor(accent);
  }

  async function waitForCardReady(cardEl) {
    const deadline = Date.now() + 6000;
    while (Date.now() < deadline) {
      const illustration = cardEl?.querySelector('.player-illustration');
      const imageReady =
        illustration &&
        illustration.src &&
        !illustration.classList.contains('hidden') &&
        illustration.complete &&
        illustration.naturalWidth > 0;
      const fallback = cardEl?.querySelector('.card-art-fallback');
      const fallbackReady = fallback && !fallback.classList.contains('hidden');
      if (imageReady || fallbackReady || cardEl?.classList.contains('has-art')) break;
      await wait(80);
    }

    const illustration = cardEl?.querySelector('.player-illustration');
    if (illustration?.src && !illustration.complete) {
      await new Promise((resolve) => {
        illustration.addEventListener('load', resolve, { once: true });
        illustration.addEventListener('error', resolve, { once: true });
        setTimeout(resolve, 4000);
      });
    }

    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await wait(150);
  }

  function canvasToBlob(canvas) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((value) => {
        if (value) resolve(value);
        else reject(new Error('图片导出失败'));
      }, 'image/png', 1);
    });
  }

  function buildTaglinePath(ctx, x, y, w, h, hasArt) {
    ctx.beginPath();
    if (hasArt) {
      ctx.moveTo(x + w * 0.06, y);
      ctx.lineTo(x + w * 0.94, y);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x, y + h);
    } else {
      const radius = Math.min(16, w * 0.05);
      if (ctx.roundRect) {
        ctx.roundRect(x, y, w, h, radius);
      } else {
        ctx.rect(x, y, w, h);
      }
    }
    ctx.closePath();
  }

  function paintText(ctx, el, cardRect, scale, options = {}) {
    const text = (el.textContent || '').trim();
    if (!text) return;

    const box = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    const fontSize = parseFloat(style.fontSize) * scale;
    const fontWeight = style.fontWeight || '600';
    const fontFamily = style.fontFamily || 'sans-serif';
    const align = style.textAlign || 'left';
    const padL = parseFloat(style.paddingLeft || 0) * scale;
    const padR = parseFloat(style.paddingRight || 0) * scale;
    const padT = parseFloat(style.paddingTop || 0) * scale;
    const padB = parseFloat(style.paddingBottom || 0) * scale;

    const xBase = (box.left - cardRect.left) * scale + padL;
    const yBase = (box.top - cardRect.top) * scale + padT;
    const boxW = box.width * scale - padL - padR;
    const boxH = box.height * scale - padT - padB;

    ctx.save();
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = options.color || style.color || '#fff';
    ctx.textBaseline = 'top';
    if (style.letterSpacing && style.letterSpacing !== 'normal') {
      ctx.letterSpacing = style.letterSpacing;
    }
    if (!options.noShadow) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.78)';
      ctx.shadowBlur = Math.max(3, fontSize * 0.12);
      ctx.shadowOffsetY = Math.max(1, fontSize * 0.05);
    }

    const lines = [];
    let line = '';
    for (const ch of text) {
      const next = line + ch;
      if (ctx.measureText(next).width > boxW && line) {
        lines.push(line);
        line = ch;
      } else {
        line = next;
      }
    }
    if (line) lines.push(line);

    const lineHeight =
      fontSize *
      (Number.isFinite(parseFloat(style.lineHeight))
        ? parseFloat(style.lineHeight) / parseFloat(style.fontSize)
        : 1.55);
    const totalTextHeight = lines.length * lineHeight;
    const offsetY = Math.max(0, (boxH - totalTextHeight) / 2);

    lines.forEach((row, index) => {
      let x = xBase;
      if (align === 'center') x = xBase + boxW / 2;
      if (align === 'right') x = xBase + boxW;
      ctx.textAlign = align;
      ctx.fillText(row, x, yBase + offsetY + index * lineHeight);
    });
    ctx.restore();
  }

  async function paintTaglineWithHtml2canvas(ctx, tagline, cardRect, scale) {
    if (typeof window.html2canvas !== 'function') return false;
    const tagCanvas = await window.html2canvas(tagline, {
      scale,
      backgroundColor: null,
      useCORS: false,
      allowTaint: true,
      logging: false,
      imageTimeout: 10000,
    });
    const box = tagline.getBoundingClientRect();
    ctx.drawImage(
      tagCanvas,
      (box.left - cardRect.left) * scale,
      (box.top - cardRect.top) * scale,
    );
    return true;
  }

  function paintTaglineManual(ctx, tagline, cardEl, cardRect, scale) {
    const box = tagline.getBoundingClientRect();
    const style = getComputedStyle(tagline);
    const x = (box.left - cardRect.left) * scale;
    const y = (box.top - cardRect.top) * scale;
    const w = box.width * scale;
    const h = box.height * scale;
    const hasArt = cardEl.classList.contains('has-art');
    const accent = readCardAccent(cardEl);
    const white = { r: 255, g: 255, b: 255 };

    ctx.save();

    buildTaglinePath(ctx, x, y, w, h, hasArt);
    ctx.shadowColor = 'rgba(0, 0, 0, 0.38)';
    ctx.shadowBlur = 14 * scale;
    ctx.shadowOffsetY = 14 * scale;
    const baseGrad = ctx.createLinearGradient(x, y, x + w * 0.72, y + h);
    baseGrad.addColorStop(0, 'rgba(10, 14, 24, 0.94)');
    baseGrad.addColorStop(1, 'rgba(4, 6, 12, 0.98)');
    ctx.fillStyle = baseGrad;
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    buildTaglinePath(ctx, x, y, w, h, hasArt);
    const glowGrad = ctx.createLinearGradient(x, y, x, y + h * 0.42);
    glowGrad.addColorStop(0, rgba(accent, 0.22));
    glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glowGrad;
    ctx.fill();

    buildTaglinePath(ctx, x, y, w, h, hasArt);
    ctx.strokeStyle = rgba(accent, 0.52);
    ctx.lineWidth = Math.max(1, 1 * scale);
    ctx.stroke();

    if (hasArt) {
      ctx.beginPath();
      ctx.moveTo(x + w * 0.06, y + 0.5 * scale);
      ctx.lineTo(x + w * 0.94, y + 0.5 * scale);
      ctx.strokeStyle = rgba(mixRgb(accent, white, 0.35), 0.95);
      ctx.lineWidth = Math.max(2, 2 * scale);
      ctx.stroke();
    }

    const topBarW = w * 0.36;
    const topBarX = x + (w - topBarW) / 2;
    const topBarGrad = ctx.createLinearGradient(topBarX, y, topBarX + topBarW, y);
    topBarGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    topBarGrad.addColorStop(0.5, rgba(accent, 0.85));
    topBarGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = topBarGrad;
    ctx.fillRect(topBarX, y, topBarW, 3 * scale);

    const bottomGrad = ctx.createLinearGradient(x + w * 0.08, y + h, x + w * 0.92, y + h);
    bottomGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    bottomGrad.addColorStop(0.5, rgba(accent, 0.55));
    bottomGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = bottomGrad;
    ctx.fillRect(x + w * 0.08, y + h - 1 * scale, w * 0.84, 1 * scale);
    ctx.globalAlpha = 1;

    ctx.restore();

    paintText(ctx, tagline, cardRect, scale, {
      color: style.color || '#f4f7fc',
      noShadow: true,
    });
  }

  async function paintTagline(ctx, tagline, cardEl, cardRect, scale) {
    try {
      const ok = await paintTaglineWithHtml2canvas(ctx, tagline, cardRect, scale);
      if (ok) return;
    } catch (err) {
      console.warn('tagline html2canvas 失败，改用手绘', err);
    }
    paintTaglineManual(ctx, tagline, cardEl, cardRect, scale);
  }

  async function captureCardFromLayout(cardEl) {
    const cardRect = cardEl.getBoundingClientRect();
    if (cardRect.width < 8 || cardRect.height < 8) {
      throw new Error('卡片尚未完成渲染');
    }

    const scale = Math.min(3, Math.max(2, window.devicePixelRatio || 2));
    const width = Math.round(cardRect.width * scale);
    const height = Math.round(cardRect.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#0a0e17';
    ctx.fillRect(0, 0, width, height);

    const illustration = cardEl.querySelector('.player-illustration');
    if (
      illustration &&
      illustration.src &&
      !illustration.classList.contains('hidden') &&
      illustration.naturalWidth > 0
    ) {
      const art = await loadImage(illustration.currentSrc || illustration.src);
      const imgRect = illustration.getBoundingClientRect();
      ctx.drawImage(
        art,
        (imgRect.left - cardRect.left) * scale,
        (imgRect.top - cardRect.top) * scale,
        imgRect.width * scale,
        imgRect.height * scale,
      );
    }

    const overlay = cardEl.querySelector('.card-overlay');
    if (overlay) {
      overlay.querySelectorAll('strong, span, h2, p.fut-kicker').forEach((node) => {
        paintText(ctx, node, cardRect, scale);
      });
    }

    const tagline = cardEl.querySelector('.card-tagline-below');
    if (tagline) {
      await paintTagline(ctx, tagline, cardEl, cardRect, scale);
    }

    const blob = await canvasToBlob(canvas);
    return {
      dataUrl: canvas.toDataURL('image/png'),
      blob,
      width,
      height,
    };
  }

  function sanitizeClone(doc, cardId) {
    const cloned = doc.getElementById(cardId);
    if (!cloned) return;
    cloned.style.transform = 'none';
    cloned.style.filter = 'none';
    cloned.style.pointerEvents = 'none';
    cloned.style.margin = '0';
    cloned.style.maxWidth = 'none';
    cloned.querySelectorAll('.card-fx').forEach((node) => node.remove());
  }

  async function captureCardWithHtml2canvas(cardEl) {
    if (typeof window.html2canvas !== 'function') {
      throw new Error('html2canvas 未加载');
    }
    const scale = Math.min(3, Math.max(2, window.devicePixelRatio || 2));
    const canvas = await window.html2canvas(cardEl, {
      scale,
      useCORS: false,
      allowTaint: true,
      backgroundColor: '#0a0e17',
      logging: false,
      imageTimeout: 20000,
      onclone: (doc) => sanitizeClone(doc, cardEl.id),
    });
    const blob = await canvasToBlob(canvas);
    return {
      dataUrl: canvas.toDataURL('image/png'),
      blob,
      width: canvas.width,
      height: canvas.height,
    };
  }

  async function captureCardElement(cardEl) {
    if (!cardEl) throw new Error('未找到球星卡节点');
    await waitForCardReady(cardEl);

    try {
      return await captureCardFromLayout(cardEl);
    } catch (layoutErr) {
      console.warn('布局截图失败，尝试 html2canvas', layoutErr);
      return captureCardWithHtml2canvas(cardEl);
    }
  }

  window.SoccerCardCapture = {
    captureCardElement,
  };
})();
