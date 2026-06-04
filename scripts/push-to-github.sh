#!/usr/bin/env bash
# 在 GitHub 账号 haochibuhaochi-si 下创建仓库并推送
set -e
cd "$(dirname "$0")/.."

if ! gh auth status >/dev/null 2>&1; then
  echo "请先登录 GitHub（使用 haochibuhaochi-si 账号）："
  gh auth login -h github.com -p https -w
fi

LOGIN=$(gh api user --jq .login)
echo "当前 GitHub 用户: $LOGIN"
if [ "$LOGIN" != "haochibuhaochi-si" ]; then
  echo "警告: 当前登录用户不是 haochibuhaochi-si，请切换账号后重试。"
fi

if gh repo view haochibuhaochi-si/SoccerProfile >/dev/null 2>&1; then
  git push -u origin main
else
  gh repo create SoccerProfile --public --source=. --remote=origin --push
fi

echo "完成: https://github.com/haochibuhaochi-si/SoccerProfile"
