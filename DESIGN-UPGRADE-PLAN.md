# 设计规范升级计划（DESIGN-UPGRADE-PLAN）

依据 `DESIGN.md`（Precision Semiconductor & Signal Chain 设计规范）制定，目标：把 theme-www 主题的**主题色、字体、字号、圆角、间距、阴影**全部收敛到设计令牌（CSS 变量）上，并按规范对齐组件视觉。

- 当前版本基线：v1.x（令牌引入前）
- 规范原文：`DESIGN.md`（随本文件同目录存放）
- 令牌定义：`assets/css/blocks/_tokens.css`（已落地，`--ds-*` 原始层）

---

## 0. 令牌架构与现状

```
--ds-*  原始令牌层（_tokens.css）  ← DESIGN.md 令牌一一对应，唯一定义处
--ap-*  语义变量层（styles.tmpl / main.css）  ← 现有样式消费层，迁移目标
```

现有 `main.css :root` 语义变量与规范的映射关系（v1.2 迁移对照表）：

| 现有变量 | 现值 | 目标令牌 | 新值 |
| --- | --- | --- | --- |
| `--ap-primary` | `#0052d9`（后台可配） | `--ds-primary` | `#003e6f` |
| `--ap-primary-dark` | `#003cab` | `--ds-btn-primary-active` | `#003660` |
| `--ap-primary-light` | `#e8f0fd` | `--ds-primary-fixed` | `#d3e4ff` |
| `--ap-text` | `#1d2129` | `--ds-on-surface` | `#111c2d` |
| `--ap-text-weak` | `#4e5969` | `--ds-on-surface-variant` | `#414750` |
| `--ap-text-light` | `#86909c` | `--ds-outline` | `#727781` |
| `--ap-border` | `#e5e6eb` | `--ds-surface-border` | `#d8dee4` |
| `--ap-bg` | `#ffffff` | `--ds-surface-container-lowest` | `#ffffff`（不变） |
| `--ap-bg-gray` | `#f7f8fa` | `--ds-surface-canvas` | `#f4f6f8` |
| `--ap-radius` | `8px` | `--ds-radius-lg`（大卡）/ `--ds-radius`（默认 4px） | 见决策项 D5 |
| `--ap-container` | `1200px` | `--ds-container-max` | `1440px`（见决策项 D4） |
| 正文字号 | `15px / 1.7` | `--ds-type-body-md-*` | `14px / 22px`（见决策项 D6） |

**blocks 模块内需替换的硬编码色值清单**（v1.2 执行）：

| 现值 | 出现位置 | 替换为 |
| --- | --- | --- |
| `#00b4ff`（渐变亮蓝） | content-markdown / index / post-product | `--ds-secondary`（`#0083ca`） |
| `rgba(0, 82, 217, *)` 全家族 | content-markdown / index / post-news / post-product / sheet-company | 主色 tint：建议新增 `--ds-primary-tint-04/08/12` 等透明度令牌后替换 |
| `#06265e → primary → #00b4ff` 表头渐变 | content-markdown | 重定义 `--ds-gradient-table-head` |
| `#f8f9fa` / `#f6f8fc` / `#fbfcfd` | sheet-company / post-product / post-news | `--ds-surface-canvas` / `--ds-row-zebra` |
| `#333` / `#666` / `#2c3e50` / `#4c566a` | post-news / sheet-company / sheet-product / sheet-application | `--ds-on-surface` / `--ds-on-surface-variant` |
| `#d93026`（表单错误） | sheet-contact | `--ds-error`（`#ba1a1a`） |
| `#f56c6c`（新闻置顶标记） | post-news | `--ds-critical-red`（`#d32f2f`） |
| `#93a1b5`（破图占位文字） | post-news | `--ds-outline-variant` |
| `#1b2431`（page-hero 兜底底色） | _base | `--ds-deep-navy`（`#0b1f38`） |
| `#eee` | sheet-product | `--ds-surface-border` |
| 散落的 `box-shadow`（20+ 处非统一投影） | 各模块 | 对齐三级阴影：`--ds-shadow-card-hover` / `--ds-shadow-dropdown` / 吸附栏实底+边框 |

---

## 决策项（已全部拍板 ✅ 2026-09-30）

| # | 事项 | 结论 |
| --- | --- | --- |
| D1 | 主色/次色双口径 | **采用 DESIGN.md 令牌表口径**：`--ds-primary: #003e6f`、`--ds-secondary: #00639a`；按钮三态由主色推导（hover `#003259`、active `#002848`） |
| D2 | 改主色同步三态 | 见下方「D2 说明」 |
| D3 | 字体加载 | **不引入外部字体，使用系统字体栈**（system-ui 系），`--ds-font-display` / `--ds-font-body` 已改为系统栈，v1.3 无字体文件加载工作 |
| D4 | 容器宽度 | **升级为 1440px**（`--ds-container-max`），v2.0 落地 |
| D5 | 圆角体系 | 通过：语义层拆 `--ap-radius`(4px) + `--ap-radius-lg`(8px)，逐模块核对 |
| D6 | 正文字号 | 通过：正文采用 **body-lg（16px / 26px 行高）** |

**D2 说明（"改主色同步三态"是什么意思）**：
主题主色不是写死的——后台「主题设置 → primary_color」可以随时改（注入 `--ap-primary`）。但按钮的 hover / active 是**另外两个更深的色值**（`--ds-btn-primary-hover/active`），它们是按默认主色 `#003e6f` 手工推导的固定值，不会自动跟着变。如果哪天把后台主色改成红色，按钮默认态变红、hover/active 却还是深蓝，看起来就是 bug——这就是"需要同步三态"的含义。处理方式二选一：
1. 改主色时手动把 `--ds-btn-primary-hover/active` 换成对应的深色（改 `_tokens.css`，推荐，本文档记录推导规则：hover ≈ 主色加深 20%、active ≈ 加深 35%）；
2. 或干脆不改后台主色，固定用 `#003e6f`（推荐给非开发场景，此时 D2 无感）。

### 决策更新后的口径变化

- 主色换色基准：`#0052d9`（旧）→ `#003e6f`（新）；blocks 内 `rgba(0, 82, 217, *)` 透明度 tint 家族按 `#003e6f` 重新推导
- `#00b4ff`（渐变亮蓝）→ `--ds-secondary`（`#00639a`）
- 表头渐变 `#06265e → primary → #00b4ff` → 以 `--ds-deep-navy (#0b1f38) → --ds-primary (#003e6f) → --ds-secondary (#00639a)` 重定义
- focus ring：组件规范写 `#0083CA`，与次色令牌（`#00639a`）不一致——沿用组件规范值 `--ds-focus-ring: #0083ca`（仅用于输入聚焦，视觉影响极小）

---

## 版本路线

### v1.1.0 —— 令牌落地（零破坏，已完成 ✅）

- [x] 新增 `assets/css/blocks/_tokens.css`：色彩 / 字体族 / 字阶 / 圆角 / 间距 / 阴影全量令牌（`--ds-*`）
- [x] `www-blocks.css` 首位 `@import "blocks/_tokens.css"`
- 验收：全站视觉与基线**像素级一致**（本阶段只加变量不改任何消费方）；DevTools 里能查到全部 `--ds-*` 变量
- 回滚：删除 import 与文件即可

### v1.2.0 —— 语义层切换（视觉变更：主色换色）✅ 2026-09-30 完成

1. ✅ `styles.tmpl`：`--ap-primary` 默认值 `#0052D9` → `#003E6F`（后台留空时生效，见 D2 说明）
2. ✅ `main.css :root`：语义变量全部指向 `--ds-*` 令牌（如 `--ap-text: var(--ds-on-surface)`）；新增语义变量 `--ap-secondary` / `--ap-deep-navy` / `--ap-error` / `--ap-critical` / `--ap-primary-tint-04~60`（14 档，基于 `#003e6f` 推导）/ `--ap-secondary-tint-03` / `--ap-error-tint` / 阴影三级 `--ap-shadow-*` / `--ap-radius-lg`
3. ✅ `blocks/*.css`：55 处硬编码色值替换为语义令牌（含 `#00b4ff`→`--ap-secondary`、`#06265e`/`#1b2431`→`--ap-deep-navy`、`#d93026`→`--ap-error`、`#f56c6c`→`--ap-critical`、`#333/#666/#2c3e50`→文字色、`#f8f9fa/#f6f8fc/#eef2f8`→canvas、`rgba(0,82,217,*)`14 档→tint 令牌；hero 遮罩与阴影色相统一为 deep-navy `rgba(11,31,56,*)`）
4. ✅ 圆角拆分（D5）：`--ap-radius` = 4px（按钮/输入框/分页等控件），新增 `--ap-radius-lg` = 8px（卡片/面板）；已升级 lg 的选择器——main.css：`.ap-card` `.ap-promo` `.ap-news__item` `.ap-photo` `.ap-journal` `.ap-content img` `.ap-content pre`；blocks：`.ap-files` `.ap-showcase__image` `.ap-news-item` `.ap-news-carousel` `.ap-news-side__box` `.ap-product__image` `.ap-highlight`
- 实际改动文件：`module/styles.tmpl`、`main.css`、`blocks/` 下除 `_tokens.css` 外全部 11 个模块
- **范围说明**：main.css 基础层 body 内的遗留硬编码（联系浮层 `#09080A`/`#f5f5ec`/`#ccc`/`#ddd`、页脚 `#1a1a1a`/`#999`/`#666`、hero `#101a2b`、promo `#2a7bf0`、破图占位、行内 code 底色等 26 处）已**同版本清零**，映射：深色面 → `--ap-inverse-surface`/`--ap-deep-navy`（新增语义变量）、深底文字 → `--ap-inverse-on-surface`、灰阶 → canvas/border/outline；阴影结构性统一（静态卡影改 hover 才出）**移至 v1.4** 组件对齐时处理
- 验收 ✅：main.css 剩余 hex 仅 `#fff`（中性）与注释中的 `#003e6f`；rgba 仅剩 tint 令牌定义本身、中性黑影与 deep-navy 遮罩；全部文件花括号配平；`--ap-primary` 仅由 styles.tmpl 注入（后台可配保留）
- 回滚：revert 本版本提交即可（令牌层无变化）

### v1.3.0 —— 字体与排版体系（视觉变更：字号/行高）✅ 2026-09-30 完成

1. ✅ ~~字体加载~~（D3 已拍板：不引入外部字体，`--ds-font-*` 为系统栈，本版无加载工作）
2. ✅ `main.css`：`body` 字体族切 `--ds-font-body`、正文字号切 **body-lg（16px / 1.625 行高）**（D6 拍板）；`.ap-content` 正文 16px（行高 1.9 阅读节奏保留）
3. ✅ 标题层级对齐字阶（79 条声明，11 个文件）：页面主标题 → `display`（移动 `display-m`），页面/区块标题 → `headline-lg/md`，卡片/侧栏标题 → `headline-sm` / `title-md`，meta/标签/辅助 → `label-md`，正文次级 → `body-md`；均带对应 line-height
4. ✅ 参数/数据类数字容器加 `font-variant-numeric: var(--ds-numeric)`（资料下载表、新闻 meta、列表计数）
- **保留现值**（有意不对齐，后续组件对齐时复核）：按钮/导航/页脚/面包屑等 UI 控件字号；`.ap-content h1~h3`（Markdown 正文内部层级）；mac 代码窗口点缀色
- 实际改动文件：`main.css` + `blocks/` 全部 11 个内容模块（`_tokens.css` 除外）
- 验收 ✅：目标选择器无 px 字号残留（抽查 `page__title`/`block__title`/hero/news 标题等均走 `var(--ds-type-*)`）；全站 `var(--ds-type-*)` 消费 121 处；花括号全部配平
- 回滚：revert 本版本提交即可

### v1.4.0 —— 组件规范对齐（视觉变更：组件级）✅ 2026-09-30 完成

1. ✅ **按钮**：高度 38→40px（移动端触控 44px，`.ap-btn--lg` 48px）、新增 `:active` 三态（`--ap-btn-primary-hover/active`）、主按钮微影 `--ap-shadow-btn`、描边按钮 hover 底色 `--ap-btn-secondary-hover-tint`
2. ✅ **徽章/标签**：置顶标记、新闻分类标签圆角 → 2px（`--ap-radius-sm`，新增语义变量）
3. ✅ **表单**：聚焦态对齐规范——2px focus ring + 边框同色（`--ap-focus-ring`，新增语义变量）
4. ✅ **表格**：资料下载表单元格内边距 12/20→8/12、行 hover → `--ap-row-hover`、斑马纹 `--ap-row-zebra`（新增语义变量）、数字列 `tabular-nums`
5. ✅ **卡片/阴影三级化**：交互卡 hover 统一 `--ap-shadow-card-hover`（feature/news__item/link/news-item/highlight/md 列表/md 图片/md 表格去静态影）；静态卡影改「1px 边框 + 无影」（联系信息卡/表单/服务说明/产品侧栏/新闻轮播/时间线卡，共 7 处）；浮层统一 `--ap-shadow-dropdown`（导航下拉/产品系列下拉/联系弹层/toast）；Level 3 吸附条去 ambient 影（sticky header/移动锚点条/应用领域锚点条）
- 新增语义变量：`--ap-radius-sm` / `--ap-focus-ring` / `--ap-row-zebra` / `--ap-row-hover` / `--ap-btn-primary-hover` / `--ap-btn-primary-active` / `--ap-btn-secondary-hover-tint`
- **保留**（有意不动）：浮动控件投影（浮动按钮/二维码/联系触发器）、内容图片装饰影、mac 代码窗口点缀、spec 之外的 ghost 按钮（深底场景变体）
- 验收 ✅：全部 box-shadow 仅剩 token 引用 / 浮动控件 / 图片装饰 / 色彩点缀四类；花括号全部配平
- 回滚：按组件类单独 revert

### v2.0.0 —— 清理与收口（含 Breaking）✅ 2026-09-30 完成

1. ✅ 未使用变量删除：`--ap-primary-dark` / `--ap-primary-tint-14` / `--ap-primary-tint-18`（审计确认零引用）
2. ✅ 容器宽度切 **1440px**（`--ap-container: var(--ds-container-max)`，D4 拍板；Breaking——全站版式变宽，需整站回归）
3. ✅ 栅格槽 token 化：`.ap-container` padding 24px → `var(--ds-gutter)`，新增移动端 16px（`--ds-gutter-m`）媒体查询
4. ✅ blocks 硬编码色值清零：代码窗口 6 个 hex 收编为令牌（`--ds-code-bg-from/to`、`--ds-code-text`、`--ds-dot-red/yellow/green`）；剩余仅中性白 `#fff/#ffffff`（白名单）
5. ✅ README.md 更新资源树与设计令牌使用约定（双层架构、禁止硬编码色值、改主色同步三态）
- ✅ **修复回归 bug**：footer 深底文字误引未定义的 `--ap-outline` 导致回退继承色、深底上不可见——已补定义并改用 `--ds-inverse-muted`（深底弱化文字）/ `--ap-inverse-primary`（深底强调色），全站 `var()` 引用已做「定义完整性」审计（仅 `--ap-primary` 由 styles.tmpl 运行时注入，符合设计）
- 验收 ✅：blocks 内 hex 仅剩白名单中性色；未用变量零残留；花括号全部配平
- 回滚：revert 本版本提交；容器宽度回退会影响全部页面版式，需同步回滚
- **回归清单**：1440px 容器 + 移动端 16px 栅格槽为 Breaking 视觉变更，需对计划文档「通用注意事项」中的全站回归清单逐页核对桌面 + 移动两端

### v2.1.0 —— 首页炫酷特效（视觉变更：仅首页）✅ 2026-09-30 完成

1. ✅ **区块顺序调换**：「核心业务（全面的芯片设计解决方案提供商）」提前至「应用领域」之前；交替底色节奏调整为 `--alt` → 白 → `--gray`
2. ✅ **Home FX 令牌落地**：`_tokens.css` 新增 `--ds-surface-section-alt` / `--ds-hero-mask-from/to` / `--ds-glow-primary/secondary`；`main.css` 语义映射 `--ap-*` 并新增 `.ap-section--alt`（冷调浅底 + 双角装饰光晕）
3. ✅ **首页特效**（`blocks/index.css`，纯 CSS 令牌驱动）：首屏 Ken Burns 缩放 + 深海军蓝渐变遮罩 + 文案错峰淡入 + 滚动提示；区块标题装饰线随 `ap-reveal` 滚动生长（index.tmpl 中 `.ap-section__head` 挂 `ap-reveal`）；栅格子项错峰显现；特性卡图标 hover 渐变发光；增值横幅 hover 渐变缓流；showcase 面板图片缩放淡入 + Tab 错峰浮入 + 激活顶部指示条
4. ✅ **无障碍/移动端**：全部新动画包进 `prefers-reduced-motion: reduce` 降级；移动端隐藏首屏滚动提示
- 实际改动文件：`index.tmpl`、`blocks/_tokens.css`、`main.css`、`blocks/index.css`
- 验收 ✅：新增色值零硬编码进业务样式（遮罩 mid 停点沿用 showcase 既有 deep-navy rgba 先例）；入场动画结束态即自然态、不遮挡 hover；花括号全部配平
- 回滚：revert 本版本提交即可
- **修订（同日）**：「核心业务（浅底）」与「应用领域（白底）」相邻对比过弱，应用领域改 `ap-section--dark` 深海军蓝底（新增 `--ds-glow-inverse` 令牌与 `.ap-section--dark` 规则，移动端平铺文字已做深底反转），区块节奏调整为 浅 → 深 → 灰

### v2.2.0 —— 首页「特色产品」区块 ✅ 2026-09-30 完成

1. ✅ **数据**：`index.tmpl` 遍历 `listCategoryAsTree()` 中 slug 为 `product` 的分类节点，聚合各子系列产品，经 pongo2 跨循环计数器（已实测 `{% set %}` 在循环内跨迭代持久）取前 N 个；无产品时整块不渲染
2. ✅ **设置**：`settings.yaml` 新增 `featured` 组（标题 / 描述 / `home_product_count` 个数 / `featured_more_url` 查看全部链接），后台可配
3. ✅ **样式**：白底区块（节奏 浅 → 深 → 白 → 灰）；卡片复用 `.ap-card`（与产品中心一致），hover 高光扫过（`apShineSweep`，破图占位态排除）+ 「查看详情」箭头右移；错峰显现复用 `.ap-grid .ap-reveal` 规则
4. ✅ **顺带补齐**：`.ap-section__more`（查看全部）此前无样式，本次补全为标题组右上角主色链接（新闻区块同步受益）
- 实际改动文件：`index.tmpl`、`settings.yaml`、`main.css`、`blocks/index.css`
- 验收 ✅：花括号配平；reduced-motion 覆盖新动画；`home_product_count = 0` 时区块不渲染
- 回滚：revert 本版本提交即可
- **回归范围**：仅首页（`.ap-feature` / `.ap-promo` / `--alt` 均仅 index.tmpl 使用），桌面 + 移动两端核对

### v2.3.0 —— 首页区块对比强化（应用领域深底落地）✅ 2026-09-30 完成

1. ✅ **补齐 v2.1.0 修订案中缺失的实现**：应用领域区块 `ap-section` → `ap-section ap-section--dark`；`_tokens.css` 补 `--ds-glow-inverse`（inverse-primary 系装饰光晕）；`main.css` 新增 `.ap-section--dark` 规则（`--ap-inverse-surface` → `--ap-deep-navy` 微渐变 + 光晕）及深底标题/描述/装饰线配色（`--ap-inverse-on-surface` / `--ap-inverse-muted` / `--ap-inverse-primary`）
- 背景：v2.1.0 修订案记录在案但代码未落盘（index.css 移动端深底反转先行、其余缺失），核心业务（`--alt` 浅底渐白）与应用领域（白底）相邻对比过弱；本次补齐后区块节奏为 浅 → 深 → 灰
- 实际改动文件：`index.tmpl`、`blocks/_tokens.css`、`main.css`
- 验收 ✅：零新增硬编码 hex（渐变停点复用既有令牌）；`--ds-glow-inverse` 定义与引用配平；index.css 既有 `.ap-section--dark` 移动端反转选择器正式生效
- 回滚：revert 本版本提交即可
- **回归范围**：仅首页（桌面 + 移动），重点核对应用领域深底上 showcase 面板文字、Tab 卡片及移动端平铺排版

### v2.4.0 —— 首页应用领域 Tab 与新闻区块样式优化 ✅ 2026-09-30 完成

1. ✅ **应用领域 Tab 玻璃态重设计**：白块卡片改半透明玻璃卡——新增 `--ds-dark-chip-*` 令牌组（bg/border/hover/active 五档）与 `--ap-dark-chip-*` 语义映射；横排「图标 + 标题」，图标/文字用 `--ap-inverse-primary` / `--ap-inverse-muted` 并微透，hover 提亮，激活态 inverse-primary 浅底 + 白字 + 微浮起；激活顶部指示条主色改 `--ap-inverse-primary`（原主色在深海军蓝上几乎不可见）
2. ✅ **新闻动态**：图片高度 56% → 44%（约 16:7，仅首页新闻栅格挂 `ap-news-home` 作用域，产品等全局卡片不受影响）；标题左对齐（全局 `.ap-card__title` 居中保留给产品）；卡片 body 内边距收紧
3. ✅ **「查看全部」落地**：`.ap-section__head` flex 化（新增 `.ap-section__head-main` 包裹标题组，仅首页使用已核实）；`.ap-section__more` 主色链接 + `arrow-right` 图标（icon 模块新增），hover 箭头右移；移动端标题组纵向堆叠
- 实际改动文件：`index.tmpl`、`module/icon.tmpl`、`main.css`、`blocks/_tokens.css`、`blocks/index.css`
- 验收 ✅：深色 Tab 零硬编码 hex（玻璃 rgba 全部走 `--ds-dark-chip-*` 令牌）；`#fff` 为白名单中性色；reduced-motion 降级沿用（未新增动画属性）
- 回滚：revert 本版本提交即可
- **回归范围**：仅首页（桌面 + 移动），重点核对 Tab 深浅态切换、新闻卡片比例、「查看全部」对齐
- **修订（同日）**：应用领域深底降浓度——`--ap-inverse-surface → --ap-deep-navy` 近黑渐变改柔和藏青双停点（新增 `--ds-surface-section-dark-from/to` 令牌，`#2c4a70 → #1c3454`，白字对比度仍 ≥ 8:1），`--ds-glow-inverse` 光晕 `.08 → .10`，缓解深底刺眼；`--ap-deep-navy` 本身（页脚 / page-hero）不受影响

---

## 总体状态：v1.1.0 ~ v2.4.0 全部完成 🎉

设计规范（DESIGN.md）已全量落地：色彩 / 字阶 / 圆角 / 间距 / 阴影 / 组件（按钮、徽章、表单、表格、卡片）均走 CSS 变量令牌体系。后续维护约定见 README「二次开发」。

---

## 通用注意事项

- **缓存**：`blocks/*.css` 经 `@import` 加载、URL 不带版本参数，每个版本发布后需强刷或清理 CDN 缓存（已在 www-blocks.css 头部注释与 README 提示）
- **热重载**：`.tmpl` 改动即时生效；CSS 为静态资源，改完刷新浏览器即可
- **回归范围**：每个版本至少回归首页 / 产品中心 / 产品详情（product）/ 新闻归档 / 新闻详情 / 公司简介 / 联系我们 / 文档中心 / FAQ / 搜索 的桌面 + 移动两端
- **可访问性**：主色/次色换色后，需复核正文与背景对比度（`on-surface #111c2d` on `#f9f9ff` 达标；`on-surface-variant #414750` 用于次要文本）
- **进度记录**：每完成一版，在本文件对应小节打勾并补充实际改动文件清单
