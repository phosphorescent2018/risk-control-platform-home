# Risk Control Platform · 首页空状态（高保真还原）

MTN UG「risk control platform」登录后首页（空状态）1:1 还原。

- 演示站：https://phosphorescent2018.github.io/risk-control-platform-home/
- 基准视口：1216×824（与原始截图逐像素比对，平均色差 2.0/765，差异像素 0.79%）
- 交互：Hide Menu 收起/展开侧栏、乌干达时间实时走秒、菜单 hover
- 单文件页面：`site/index.html`（logo 与插图已内嵌，离线可开）

## 部署

push `main` 后由 GitHub Actions 直接发布 `site/` 到 GitHub Pages（`.github/workflows/deploy-pages.yml`）。
