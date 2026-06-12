/**
 * 分享链接卡片 + 球星卡弹窗分享
 */
(function () {
  const SHARE_CARD_VERSION = '2025061108';
  const DEFAULT_OG_IMAGE = './assets/scout-cards/F3_B2B.png';

  let activePayload = null;
  let activeReportData = null;
  let bridgeBound = false;
  let exportImageUrl = null;
  let exportDataUrl = null;
  let exportBusy = false;

  function isWeChat() {
    return /MicroMessenger/i.test(navigator.userAgent || '');
  }

  function absoluteUrl(path) {
    if (!path) return location.href.split('#')[0];
    if (/^https?:\/\//i.test(path)) return path;
    const base = location.href.split('#')[0].replace(/[^/]*$/, '');
    return new URL(path.replace(/^\.\//, ''), base).href;
  }

  function shareCardImage(reportDataOrId) {
    const reportData =
      typeof reportDataOrId === 'object' && reportDataOrId
        ? reportDataOrId
        : { archetype_id: reportDataOrId || 'F3_B2B' };
    const assetId =
      window.SoccerCard?.resolveCardArtAssetId?.(reportData) ||
      reportData.card_art_asset_id ||
      reportData.archetype_id ||
      'F3_B2B';
    const version = window.SoccerCard?.CARD_ART_VERSION || SHARE_CARD_VERSION;
    return absoluteUrl(`./assets/scout-cards/${assetId}.png?v=${version}`);
  }

  function buildShareLink(reportData) {
    const archetypeId = reportData?.archetype_id || 'F3_B2B';
    const playlevel = Number(reportData?.playlevel_score || 0).toFixed(1);
    const url = new URL(location.origin + location.pathname);
    url.searchParams.set('share', '1');
    url.searchParams.set('a', archetypeId);
    url.searchParams.set('pl', playlevel);
    return url.href;
  }

  function buildSharePayload(reportData) {
    const copy = reportData?.copy_data || {};
    const archetypeId = reportData?.archetype_id || 'F3_B2B';
    const title = reportData?.archetype_title || copy.title || '足球 DNA 报告';
    const playlevel = Number(reportData?.playlevel_score || 0).toFixed(1);
    const tagline = copy.tagline || '35 道题读懂你的球风、强度与战术素养';
    const desc = `我的足球 DNA：${title} · PlayLevel ${playlevel} · ${tagline}`;
    const link = buildShareLink(reportData);
    const imgUrl = shareCardImage(reportData);

    return {
      archetypeId,
      title: `我的足球 DNA：${title}`,
      desc,
      tagline,
      playlevel,
      link,
      imgUrl,
      copyText: `${desc}\n${link}`,
    };
  }

  function upsertMeta(attr, key, content) {
    if (!content) return;
    let el = document.querySelector(`meta[${attr}="${key}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  }

  function updateDocumentMeta(payload) {
    if (!payload) return;
    document.title = payload.title;
    upsertMeta('name', 'description', payload.desc);
    upsertMeta('property', 'og:title', payload.title);
    upsertMeta('property', 'og:description', payload.desc);
    upsertMeta('property', 'og:image', payload.imgUrl);
    upsertMeta('property', 'og:url', payload.link);
    upsertMeta('property', 'og:type', 'website');
  }

  function syncShareUrl(payload) {
    if (!payload?.link) return;
    const next = payload.link;
    const current = location.href.split('#')[0];
    if (current !== next) {
      history.replaceState(null, '', next);
    }
  }

  function bindWeixinBridge() {
    if (!isWeChat() || bridgeBound) return;

    const register = () => {
      if (bridgeBound || typeof WeixinJSBridge === 'undefined') return;
      bridgeBound = true;

      WeixinJSBridge.on('menu:share:appmessage', () => {
        const p = activePayload;
        if (!p) return;
        WeixinJSBridge.invoke(
          'sendAppMessage',
          {
            title: p.title,
            desc: p.desc,
            link: p.link,
            imgUrl: exportImageUrl || p.imgUrl,
            type: 'link',
            data_url: p.link,
          },
          () => {},
        );
      });
    };

    if (typeof WeixinJSBridge !== 'undefined') {
      register();
    } else {
      document.addEventListener('WeixinJSBridgeReady', register, false);
    }
  }

  function setupModernWxShare(payload) {
    if (!window.wx || !payload) return;
    const data = {
      title: payload.title,
      desc: payload.desc,
      link: payload.link,
      imgUrl: exportImageUrl || payload.imgUrl,
    };
    wx.ready(() => {
      wx.updateAppMessageShareData(data);
    });
  }

  function applyReport(reportData) {
    activeReportData = reportData;
    activePayload = buildSharePayload(reportData);
    updateDocumentMeta(activePayload);
    syncShareUrl(activePayload);
    bindWeixinBridge();
    setupModernWxShare(activePayload);
    return activePayload;
  }

  function parseShareParams() {
    const params = new URLSearchParams(location.search);
    if (params.get('share') !== '1') return null;
    const archetypeId = params.get('a');
    if (!archetypeId) return null;
    return {
      archetypeId,
      playlevel: params.get('pl') || '0',
    };
  }

  async function resolveShareCardElement() {
    const shareCard = document.getElementById('share-player-card');
    if (shareCard) return shareCard;
    const mainCard = document.getElementById('player-card');
    if (mainCard) return mainCard;
    throw new Error('未找到可分享的球星卡');
  }

  async function ensureExportImage() {
    if (exportImageUrl) return exportImageUrl;
    if (exportDataUrl) return exportDataUrl;
    if (!activeReportData) throw new Error('暂无报告数据');

    const cardEl = await resolveShareCardElement();
    const poster = await window.SoccerCardCapture.captureCardElement(cardEl);
    if (!poster?.dataUrl || !poster?.blob) {
      throw new Error('分享图生成失败');
    }
    exportDataUrl = poster.dataUrl;

    if (!isWeChat()) return exportDataUrl;

    try {
      exportImageUrl = await window.SoccerAPI.uploadShareImage(
        poster.blob,
        activeReportData.archetype_id || 'F3_B2B',
      );
      if (activePayload) {
        activePayload.imgUrl = exportImageUrl;
        updateDocumentMeta(activePayload);
        setupModernWxShare(activePayload);
      }
      return exportImageUrl;
    } catch (err) {
      console.warn('上传分享图失败，改用本地图片', err);
      return exportDataUrl;
    }
  }

  function waitForBridge(timeoutMs = 1200) {
    return new Promise((resolve) => {
      if (typeof WeixinJSBridge !== 'undefined') {
        resolve(true);
        return;
      }
      let done = false;
      const finish = (ok) => {
        if (done) return;
        done = true;
        resolve(ok);
      };
      document.addEventListener('WeixinJSBridgeReady', () => finish(true), { once: true });
      setTimeout(() => finish(typeof WeixinJSBridge !== 'undefined'), timeoutMs);
    });
  }

  function invokeBridge(method, payload) {
    return new Promise((resolve) => {
      let settled = false;
      const finish = (ok) => {
        if (settled) return;
        settled = true;
        resolve(ok);
      };
      const timer = setTimeout(() => finish(false), 1500);

      const run = () => {
        if (typeof WeixinJSBridge === 'undefined') {
          clearTimeout(timer);
          finish(false);
          return;
        }
        WeixinJSBridge.invoke(method, payload, (res) => {
          clearTimeout(timer);
          finish(res?.err_msg === `${method}:ok`);
        });
      };

      if (typeof WeixinJSBridge !== 'undefined') run();
      else document.addEventListener('WeixinJSBridgeReady', run, { once: true });
    });
  }

  function saveExportImage(imageUrl) {
    const link = document.createElement('a');
    link.href = exportDataUrl || imageUrl;
    link.download = `soccer-dna-${activePayload?.archetypeId || 'card'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async function shareImageToFriend() {
    const imageUrl = await ensureExportImage();
    await waitForBridge();

    if (isWeChat() && imageUrl.startsWith('http')) {
      const ok = await invokeBridge('sendAppMessage', {
        title: activePayload?.title,
        desc: activePayload?.desc,
        link: activePayload?.link,
        imgUrl: imageUrl,
        type: 'link',
      });
      if (ok) return;
    }

    if (isWeChat() && imageUrl.startsWith('http')) {
      const ok = await invokeBridge('imagePreview', {
        current: imageUrl,
        urls: [imageUrl],
      });
      if (ok) return;
    }

    if (isWeChat() && exportDataUrl) {
      const opened = window.open(exportDataUrl, '_blank');
      if (opened) {
        alert('请长按图片保存，再发送给好友');
        return;
      }
    }

    saveExportImage(imageUrl);
    alert(isWeChat() ? '若未自动保存，请截图球星卡后发送给好友' : '球星卡已保存，可在下载文件夹中查看并发送给好友');
  }

  async function runShareAction() {
    if (exportBusy) return;
    exportBusy = true;
    try {
      await shareImageToFriend();
    } catch (err) {
      console.error('分享图失败', err);
      alert(`保存分享图失败：${err?.message || '请稍后重试'}`);
    } finally {
      exportBusy = false;
    }
  }

  function renderSheet() {
    const sheet = document.getElementById('share-sheet');
    if (!sheet) return;
    exportImageUrl = null;
    exportDataUrl = null;
    sheet.classList.add('is-open');
    sheet.setAttribute('aria-hidden', 'false');
    document.body.classList.add('share-sheet-open');
  }

  function closeSheet() {
    const sheet = document.getElementById('share-sheet');
    sheet?.classList.remove('is-open');
    sheet?.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('share-sheet-open');
  }

  function initSheet() {
    const sheet = document.getElementById('share-sheet');
    const closeBtn = document.getElementById('share-close');
    if (!sheet) return;

    closeBtn?.addEventListener('click', closeSheet);
    sheet.addEventListener('click', (e) => {
      if (e.target === sheet) closeSheet();
    });

    document.getElementById('share-to-friend')?.addEventListener('click', () => runShareAction());
  }

  async function shareFromReport(reportData) {
    const payload = applyReport(reportData);
    window.SoccerCard?.renderPlayerCard(reportData, 'share');
    renderSheet();
    return payload;
  }

  function applyDefaultMeta() {
    const originImage = absoluteUrl(DEFAULT_OG_IMAGE);
    upsertMeta('property', 'og:title', '足球 DNA · 测测你的球风与竞技水准');
    upsertMeta(
      'property',
      'og:description',
      '35 道题读懂你的球风、PlayLevel 与战术素养，生成专属球星卡报告。',
    );
    upsertMeta('property', 'og:image', originImage);
    upsertMeta('property', 'og:url', location.href.split('#')[0]);
    upsertMeta('property', 'og:type', 'website');
    upsertMeta(
      'name',
      'description',
      '35 道题读懂你的球风、PlayLevel 与战术素养，生成专属球星卡报告。',
    );
  }

  applyDefaultMeta();
  initSheet();

  window.SoccerShare = {
    isWeChat,
    buildSharePayload,
    applyReport,
    shareFromReport,
    closeSheet,
    parseShareParams,
    absoluteUrl,
  };
})();
