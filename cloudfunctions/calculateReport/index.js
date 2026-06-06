const cloud = require('@cloudbase/node-sdk');
const { calculateReport } = require('./lib/calculator');

const app = cloud.init({ env: cloud.SYMBOL_CURRENT_ENV });

exports.main = async (event) => {
  try {
    const body = typeof event === 'string' ? JSON.parse(event) : event;
    const payload = body.data || body;

    if (!payload || !Array.isArray(payload.style) || payload.style.length < 21) {
      return {
        code: 400,
        message: '请完成全部风格题后再提交',
      };
    }

    const result = calculateReport(payload);
    return { code: 0, data: result };
  } catch (err) {
    console.error(err);
    return { code: 500, message: err.message || '计算失败' };
  }
};
