/**
 * 腾讯云开发 API 封装
 */
const CLOUD_ENV_ID = 'cloud1-3ghh3b2jd73d087e';
const CLOUD_REGION = 'ap-shanghai';

let cloudApp = null;

function waitForCloudbase(maxMs = 8000) {
  return new Promise((resolve, reject) => {
    if (typeof cloudbase !== 'undefined') {
      resolve(cloudbase);
      return;
    }
    const start = Date.now();
    const timer = setInterval(() => {
      if (typeof cloudbase !== 'undefined') {
        clearInterval(timer);
        resolve(cloudbase);
      } else if (Date.now() - start > maxMs) {
        clearInterval(timer);
        reject(
          new Error(
            'CloudBase SDK 未加载，请检查网络或刷新页面。本地开发需在控制台安全域名中加入 localhost。'
          )
        );
      }
    }, 50);
  });
}

async function getApp() {
  if (cloudApp) return cloudApp;
  const sdk = await waitForCloudbase();
  cloudApp = sdk.init({
    env: CLOUD_ENV_ID,
    region: CLOUD_REGION,
  });
  return cloudApp;
}

/**
 * 提交答案并获取报告
 * @param {{ q0: string[], style: string[], intensity: string[], literacy: string[], report_tier?: 'lite'|'pro', locked_primary_id?: string }} payload
 */
async function submitAnswers(payload) {
  const app = await getApp();

  const auth = app.auth();
  const loginState = await auth.getLoginState().catch(() => null);
  if (!loginState) {
    await auth.signInAnonymously();
  }

  const res = await app.callFunction({
    name: 'calculateReport',
    data: payload,
  });

  const body = res?.result ?? res;
  if (body.code !== 0) {
    throw new Error(body.message || '报告生成失败');
  }
  return body.data;
}

async function uploadShareImage(blob, archetypeId) {
  const app = await getApp();
  const auth = app.auth();
  const loginState = await auth.getLoginState().catch(() => null);
  if (!loginState) {
    await auth.signInAnonymously();
  }

  const cloudPath = `share-posters/${archetypeId}-${Date.now()}.png`;
  const file =
    blob instanceof File
      ? blob
      : new File([blob], `${archetypeId}-share.png`, { type: 'image/png' });
  const uploadRes = await app.uploadFile({
    cloudPath,
    filePath: file,
  });

  const fileId = uploadRes?.fileID || uploadRes?.fileId;
  if (!fileId) throw new Error('图片上传失败');

  const urlRes = await app.getTempFileURL({ fileList: [fileId] });
  const urlFile = urlRes?.fileList?.[0];
  if (!urlFile?.tempFileURL) throw new Error('获取分享图链接失败');
  return urlFile.tempFileURL;
}

window.SoccerAPI = { submitAnswers, CLOUD_ENV_ID, getApp, uploadShareImage };
