# 足球风格与竞技水准测试 · H5 独立站

移动端优先的 H5 测试站：36 道题 → 云函数计算 Archetype / PlayLevel / 战术素养 → 付费墙解锁完整报告。

## 技术栈

- 前端：静态 HTML + CSS + JS（托管于腾讯云 CloudBase）
- 后端：`calculateReport` 云函数（Node.js 18）
- 环境 ID：`cloud1-3ghh3b2jd73d087e`

## 目录结构

```
public/                 # H5 静态站点（部署入口）
cloudfunctions/
  calculateReport/      # 报告计算云函数
data/
  questions.json        # 题库（由 question.md 生成）
  copy_pack.json        # 文案包
  archetype_prototypes.json
```

## 本地预览

```bash
npm run serve
# 浏览器打开 http://localhost:5173
```

> 提交答案需已部署云函数；仅预览 UI 可不部署。

## 部署到腾讯云

1. 安装 CLI：`npm i -g @cloudbase/cli`
2. 登录：`tcb login`
3. 同步数据并部署：

```bash
npm run sync:data
cd cloudfunctions/calculateReport && npm install
cd ../..
tcb framework deploy -e cloud1-3ghh3b2jd73d087e
```

或在 [云开发控制台](https://console.cloud.tencent.com/tcb) 上传 `public` 为静态网站，并部署 `calculateReport` 云函数。

### 云函数配置

- 运行时：Nodejs 18.15
- 入口：`index.main`
- 开启匿名登录（H5 调用 `callFunction` 需要）

### 微信支付（后续）

付费墙已预留「解锁报告」入口。接入微信支付需：

1. 已认证服务号 + 微信商户号
2. 云函数创建支付订单 + JSAPI 调起
3. 支付回调后写入解锁状态

当前演示：点击解锁或「观看广告」可直接查看报告。

## 更新题库 / 文案

```bash
# 编辑 question.md 后
npm run build:questions
npm run sync:data
# 重新部署云函数与静态站
```

文案包源文件为 `copy_back.json`，同步到 `data/copy_pack.json`。

## 计算规则

详见 `calculation_rules.md` 与 `cloudfunctions/calculateReport/lib/calculator.js`。
