# 企业官网主题（theme-www）

由 Nuxt 3 + Element Plus 企业官网源站（www）迁移适配而来的 AirPress 主题，面向芯片/半导体企业官网场景：首页、产品中心、产品详情、新闻中心（轮播 + 分类筛选）、独立页面（应用领域 / 公司简介 / 文档中心 / FAQ / 联系我们 / 设计服务）。

- 主题 id：`www`，当前版本 `1.3.8`（要求 AirPress ≥ `1.0.5`，见 `theme.yaml`）
- 模板引擎：pongo2（语法见 `resources/template/theme/THEME-SYNTAX.md`）

## 目录结构

```
theme-www/
├── theme.yaml / settings.yaml       主题元信息与配置项
├── index.tmpl                       首页
├── archives.tmpl                    新闻动态（轮播 + 标签筛选）
├── categories.tmpl / category.tmpl  分类归档 / 分类文章列表
├── tags.tmpl / tag.tmpl / search.tmpl / links.tmpl / photos.tmpl / journals.tmpl
├── 404.tmpl / 500.tmpl
├── post.tmpl                        文章详情「默认兜底」（标题 + 正文，无业务区块）
├── post_news.tmpl                   文章剧本：新闻 / 通用文章详情
├── post_product.tmpl                文章剧本：产品详情（两栏 hero：摘要 + 特性 ✓ + 图在右）
├── post_job.tmpl                    文章剧本：岗位详情（面包屑 + 摘要引言 + 岗位描述 + 返回列表）
├── sheet.tmpl                       独立页面「默认兜底」（Banner + 正文，无业务区块）
├── sheet_jobs.tmpl                  页面剧本：加入我们（Banner + 招聘 Tab + 岗位列表）
├── sheet_application.tmpl           页面剧本：应用领域（工业/能源/汽车/消费）
├── sheet_company.tmpl               页面剧本：公司简介（时间线 + 卡片）
├── sheet_contact.tmpl               页面剧本：联系我们（信息卡 + 留言表单）
├── sheet_documents.tmpl             页面剧本：文档中心（资料下载表）
├── sheet_faq.tmpl                   页面剧本：常见问题
├── sheet_services.tmpl              页面剧本：设计服务
├── sheet_page.tmpl                  页面剧本：通用组合（所有区块按 metas 渲染）
├── module/                          可复用片段
│   ├── head / header / footer / scripts / styles / icon  页面骨架
│   ├── news-detail / product-detail                      文章详情主体
│   ├── highlights-block / downloads-block                产品亮点 / 资料下载（post_product 使用）
│   ├── sheet-head / contact-block                        单页头部 / 联系区块
│   ├── anchors-nav / sections-nav                        锚点导航
│   ├── sections-block / timeline-block / cards-block
│   ├── faq-block / files-block                           问答 / 资料下载
│   ├── jobs-block                                       招聘 Tab + 岗位列表（加入我们页）
│   ├── app-card                                         通用图片卡片（title/desc/image/link）
│   └── breadcrumb / pagination / post-list / feature / promo / showcase-*
└── assets/
    ├── css/main.css                 基础组件样式（语义变量层 --ap-*，映射到 --ds-*）
    ├── css/blocks/                  官网板块模块化样式（_tokens.css 设计令牌 + 按页面/组件拆分）
    ├── css/www-blocks.css           官网板块样式入口（@import 聚合 blocks/*.css）
    ├── js/main.js                   基础交互（抽屉菜单、回到顶部、滚动动画）
    └── js/www-blocks.js             官网板块交互（领域切换、FAQ 折叠、资料筛选、产品系列切换、二维码卡）
```

## 自定义模板机制

AirPress 支持文章/页面各自指定模板（后台编辑页「自定义模板」），规则由后端 `resolvePostTemplate` / `resolveSheetTemplate` 决定：

| 内容类型 | 模板文件名 | 后台填写值 | 未填或文件不存在时 |
| --- | --- | --- | --- |
| 文章 | `post_<短名>.tmpl` | 短名，如 `news` | 回退 `post.tmpl` |
| 独立页面 | `sheet_<短名>.tmpl` | 短名，如 `contact` | 回退 `sheet.tmpl` |

下拉选项由后端扫描主题根目录的 `post_*.tmpl` / `sheet_*.tmpl` 自动生成，新增文件即可见，无需注册。

**本主题的约定**：默认模板（`post.tmpl` / `sheet.tmpl`）保持"空"——只渲染标题/Banner 与正文，不含任何业务区块；真实内容一律放在 `post_xxx` / `sheet_xxx` 剧本里，由后台显式选择。这样文件名与用途一致，也避免默认模板越堆越臃肿。

### 当前后台配置

文章 25 篇（`type=0`），按用途与模板：

| 用途 | 数量 | 自定义模板 |
| --- | --- | --- |
| 产品（`dsp` 6 篇 + `esc` 2 篇） | 8 | 全部 `product` |
| 新闻（`news` 分类） | 15 | 14 篇 `news`；`test` 1 篇留空 → 回退 `post.tmpl` |
| 系统初始文章 `hello-airpress`（无分类） | 1 | `news` |
| 临时测试 `test2`（无分类） | 1 | 留空 → 回退 `post.tmpl` |

发布状态：已发布 8 篇（7 篇产品 + 1 篇新闻），其余 17 篇在**回收站**（`status=2`），前台不可见。`news` 分类下仅「国产替代加速…」一篇处于已发布。

批量调整可直接写库（改完重启/刷新即可生效）：`update post set template='news' where type=0;`、`update post set template='' where type=1;` 之类，回退把值清空即可走默认模板。

> ⚠️ 新建产品/新闻后**必须**在后台「自定义模板」里显式选择 `product` / `news`，否则会回退到只渲染标题 + 正文的 `post.tmpl`（正文为空时页面看起来是空的，详见「常见问题」）。

页面 10 个（`type=1`）：

| slug | 标题 | 模板 |
| --- | --- | --- |
| `app-industrial` / `app-energy` / `app-automotive` / `app-consumer` | 工业应用 / 电力能源 / 汽车电子 / 消费电子 | `application` |
| `company` | 关于六岳微电子 | `company` |
| `documents` | 技术文档 | `documents` |
| `faq` | 常见问题 | `faq` |
| `services` | 设计服务 | `services` |
| `contact` | 联系我们 | `contact` |
| `products` | 产品中心 | `product`（即 `sheet_product.tmpl`） |

### 产品详情模板（`post_product.tmpl`）

| 模板 | 后台填 | 页面结构 | 适用 |
| --- | --- | --- | --- |
| `post_product.tmpl` | `product` | 两栏 hero（摘要 + 特性 ✓ + 图在右）→ 产品亮点 → 资料下载 | 所有产品文章；结构化内容一律走 JSON 格式 metas |

简介段渲染的是**摘要**（`post.Summary`，`striptags` 去标签后输出），产品正文（`post.Content`）可以留空——现有 8 篇产品文章的正文均为空，内容全部来自「摘要 + metas」。确需长文正文时：用富文本编辑器撰写，并在模板中以 `ap-content` 容器输出；Markdown 正文（`editor_type=1`）依赖前端 marked 渲染，同样需要 `ap-content` 容器。

> 结构化板块（特性 / 亮点 / 下载）统一由 metas（JSON）驱动，正文里不要再重复写这些章节。

## 页面映射（www 路由 → 本站地址 → 模板）

| 官网路由 | 本站地址 | 模板 | 数据来源 |
| --- | --- | --- | --- |
| `/` | `/` | `index.tmpl` | 主题设置（home / application / advantage / value 分组） |
| `/products` | `/s/products` | `sheet_product.tmpl` | 自定义页面 + 「产品」分类的子分类 |
| 产品系列 | `/categories/:slug` | `category.tmpl` | 分类下的产品文章 |
| `/products/:id` | 文章链接 | `post_product.tmpl` | 产品文章 + metas |
| `/about/news` | `/archives` | `archives.tmpl` | 新闻分类文章 |
| `/about/news/:id` | 文章链接 | `post_news.tmpl` | 新闻文章 |
| `/about/company` | `/s/company` | `sheet_company.tmpl` | 独立页面 |
| `/about/contact` | `/s/contact` | `sheet_contact.tmpl` | 独立页面（`show_contact`） |
| `/applications/*` | `/s/app-industrial` 等 | `sheet_application.tmpl` | 独立页面（`sections`） |
| `/ecosystem/services` | `/s/services` | `sheet_services.tmpl` | 独立页面 |
| `/resources/documents` | `/s/documents` | `sheet_documents.tmpl` | 独立页面（`files` + `file_series`） |
| `/resources/faq` | `/s/faq` | `sheet_faq.tmpl` | 独立页面（`faq`） |
| 加入我们 | `/s/jobs` | `sheet_jobs.tmpl` | 独立页面 + 「招聘」分类的子分类（`jobs-block.tmpl`） |
| `/categories` | `/categories` | `categories.tmpl` | **分类归档**（全站分类列表），不是产品中心 |
| 合作伙伴 | `/links` | `links.tmpl` | 后台友链 |

> AirPress 路由固定：`/categories` 只能落到 `categories.tmpl`，无法改名。产品中心因此改为独立页面（`/s/products`），`categories.tmpl` 回归「分类归档」语义。菜单与主题设置里的 `banner_link`、`val1_link` 已同步指向 `/s/products`。

## 结构化内容约定（文章/页面 metas）

主题设置只能存放扁平配置，产品与页面的**结构化区块**（亮点、参数表、下载、FAQ、卡片）统一用 metas（后台文章编辑页的「自定义字段」）表达。产品文章的 3 个 key 已改为 **JSON 格式**，模板用内置 `from_json` 解析（格式非法或为空时该板块不渲染）；独立页面仍按分隔符约定解析。

**分隔符约定（独立页面）**：`|` 分条、`::` 分字段、`/` 分条目。分隔符必须是**半角**符号，误用中文冒号会导致字段解析失败。

### 产品文章（`post_product.tmpl`，JSON 格式）

| meta key | JSON 格式 | 渲染位置 |
| --- | --- | --- |
| `product_features` | `["特性1","特性2"]` | 产品介绍里的特性列表（✓ 图标） |
| `product_highlights` | `[{"title":"分组标题","items":["条目1","条目2"]}]` | 产品亮点卡片网格 |
| `product_downloads` | `[{"name":"名称","format":"格式","size":"大小","date":"日期","url":"链接"}]`，见「资料下载模块」 | 资料下载表（为空、非 JSON 或无 url 时不渲染） |

### 新闻文章（`post_news.tmpl`）

可选 `news_author`（作者）、`news_source`（来源），显示在标题下方；`news` 分类下的文章才出现在 `/archives`。

### 独立页面（各 `sheet_xxx.tmpl`）

| meta key | 格式 | 渲染位置 |
| --- | --- | --- |
| `hero_image` | 图片 URL | 页面顶部 Banner 背景 |
| `hero_gradient` | CSS 渐变 | Banner 背景（与 `hero_image` 二选一） |
| `hero_bg_position` | CSS 定位值 | Banner 背景位置 |
| `hero_desc` | 文本 | Banner 副标题 |
| `anchors` | `标题::区块ID\|…` | 通用锚点导航（`apIntro` / `apTimeline` / `apCards`） |
| `sections` | `标题::描述::图片::标签1/标签2\|…` | 应用领域图文区块（图右文左交替） |
| `timeline` / `timeline_title` | `年份::标题::描述::补充\|…` | 发展历程时间线 |
| `cards` / `cards_title` / `cards_grid` / `cards_image` | `标题::描述::图片或图标名::链接\|…` | 卡片网格（`cards_grid=4` 四列） |
| `faq` | `问题::答案\|…` | 折叠问答 |
| `files` / `file_series` | 见「资料下载模块」 | 资料下载表 + 系列筛选 |
| `show_contact` / `show_contact_form` | `1` | 联系信息卡 / 留言表单 |

## 资料下载模块

### 推荐方式：metas 表格（JSON）

产品文章的亮点 / 下载统一用 JSON 格式 metas（见上文「结构化内容约定」），由 `module/highlights-block.tmpl` / `module/downloads-block.tmpl` 渲染，资料下载表固定在页面最下方。

### metas 表格字段约定

产品详情与文档中心两处用表格（页面顺序：产品介绍 → 产品亮点 → **资料下载** → 页脚），meta key 与格式不同：

| 场景 | meta key | 格式 | 模板 | 系列筛选 |
| --- | --- | --- | --- | --- |
| 产品详情 | `product_downloads` | JSON | `module/downloads-block.tmpl` | 不支持（无系列字段） |
| 独立页面（文档中心） | `files` + `file_series` | 分隔符 | `module/files-block.tmpl` | 支持（第 6 字段为系列） |

#### 产品详情（`product_downloads`，JSON）

```json
[
  {"name": "LY-F201 数据手册", "format": "PDF", "size": "2.4MB", "date": "2025-03-01", "url": "/upload/2026/09/ly-f201-datasheet.pdf"},
  {"name": "LY-F201 资料包", "format": "ZIP", "size": "8.1MB", "date": "2025-03-01", "url": "https://cdn.example.com/ref.zip"}
]
```

- 字段缺省时对应列显示为空；`url` 为空的条目不渲染，不再有旧格式的「简写自动识别」
- 链接支持三种写法，模板自动补全域名（见下文「链接的域名补全」）
- 旧分隔符格式数据可用 `scripts/migrate_product_metas_json.py` 一次性迁移（SQLite 直写 `--apply`，或 `--sql` 生成 MySQL UPDATE 语句）

#### 独立页面（文档中心 `files`，分隔符）

```
名称::格式::大小::修改日期::链接::系列
```

多条用 `|` 分隔，第 6 段对应 `file_series` 里的系列名，用于表格上方的筛选按钮（交互见 `www-blocks.js` 的 `initFileFilter`）。

### files 的三种写法（模板自动识别）

按 `::` 切分后的段数自动判断，不用手动切换：

| 段数 | 写法示例 | 渲染效果 |
| --- | --- | --- |
| ≥5 | `数据手册::PDF::2.4MB::2025-03-01::/upload/a.pdf` | 六个字段全用自定义值 |
| 2 | `LY-F201 快速入门手册::/upload/…/xxx.zip` | 名称自定义；格式自动取扩展名；大小/日期留空 |
| 1 | `/upload/2026/09/sonic-theme-earth-main.zip` | 名称自动取链接末段；格式自动取扩展名；大小/日期留空 |

> 只填 URL 时，名称列会显示文件名、格式列显示扩展名大写（如 `ZIP`）。想自定义名称就用第 2 或第 3 种写法。

### 链接的域名补全

链接支持三种写法，模板自动处理，不用手写域名：

| 链接写法 | 渲染结果 |
| --- | --- |
| `https://cdn.example.com/a.pdf` | 原样输出（含 `http` 即视为绝对地址） |
| `/upload/2026/09/a.zip` | `{{ blog_url }}/upload/2026/09/a.zip` |
| `upload/2026/09/a.zip` | `{{ blog_url }}/upload/2026/09/a.zip` |

`blog_url` 取后台「设置 - 常规」里的站点地址，因此换域名、上 HTTPS 都不需要改文章里的链接。

### 完整示例（文档中心 `files`）

```
LY-F335数据手册_V1.3.pdf::PDF::6.2MB::2025-02-25::https://cdn.newaigou.com/sysummit/assets/download/LY-F335数据手册_v1.3.pdf::DSP
LY-E252数据手册_v1.0.pdf::PDF::7.31MB::2025-02-25::https://cdn.newaigou.com/sysummit/assets/download/LY-E252数据手册 v1.0.pdf::ESC
LY-E101用户手册_v1.2.pdf::PDF::3.54MB::2025-02-25::https://cdn.newaigou.com/sysummit/assets/download/LY-E101用户手册_v1.2.1.pdf::ESC
```

配套 `file_series`：

```
DSP|ESC|SOC
```

### 常见问题（文档中心 `files`）

| 现象 | 原因 |
| --- | --- |
| 名称列显示成完整 URL，其它列全空 | 值里只有链接、没有 `::` 分隔符（旧版本会这样显示，现已自动取文件名兜底） |
| 只出现一条 | 多条之间要用 `|` 分隔，且不能是中文竖线 |
| 筛选按钮点了没反应 | 第 6 段系列名要与 `file_series` 里的值**完全一致**（含大小写与空格） |

> 产品详情（`product_downloads`）改用 JSON 后不存在上述分隔符问题；板块不渲染通常是 JSON 格式非法（模板只认 JSON）。

### 正文链接自动下载（可选补充）

不想用表格时，可以在产品文章正文里直接写文件链接，不用填任何自定义字段：

```markdown
## 资料下载

- [LY-F201 数据手册（PDF, 2.4MB）](/upload/2026/09/ly-f201-datasheet.pdf)
- [LY-F201 参考设计（ZIP, 8.1MB）](https://cdn.newaigou.com/sysummit/assets/download/ref.zip)
```

前端 `www-blocks.js` 的 `initContentDownloads()` 会自动处理正文（`.ap-content`）里的链接：

| 链接类型 | 处理 |
| --- | --- |
| 指向文件（pdf/zip/rar/7z/doc/docx/xls/xlsx/ppt/pptx/bin/hex/tar/gz/dmg/apk…） | 加上 `ap-download-link` 样式（按钮 + 下载图标）、`download`、`target=_blank` |
| 站内相对路径（`/upload/…`） | 自动补当前站点域名（`location.origin`） |
| 绝对地址（含 `http`） | 原样，仅加样式与 `download` |
| 普通页面链接（如 `/archives`） | 不处理 |

> 这种方式适合"顺带提一下附件"的场景；需要展示格式/大小/日期/系列筛选时，仍用上文的 metas 表格。

## 菜单配置

- **主导航**：后台「外观 - 菜单」，使用站点默认菜单分组；与源站一致为 5 个顶级项（首页 / 产品中心 / 应用领域 / 生态合作 / 关于我们），应用领域与关于我们带二级下拉。产品中心指向 `/s/products`。
- ⚠️ 当前菜单表里有重复项：「产品中心」存在两条顶级记录，「联系我们」既有顶级记录也在「关于我们」下。`header.tmpl` 按 `listMenuAsTree()` 渲染全部顶级项，前台会出现重复导航，建议在后台删除多余记录。
- **页脚导航**：新建分组 `footer`（可在主题设置 `footer_menu_team` 修改），链接将显示在页脚「快速链接」列。
- **顶部条**：新闻（`news_url`）+ 登录（`login_url`，默认 `/admin`），对齐源站（语言切换不迁移）。

## 内容录入清单

### 产品分类（1 个顶级 + 2 个系列）

| 分类名 | slug | 父级 |
| --- | --- | --- |
| 产品 | `product` | — |
| 数字信号处理器 | `dsp` | `product` |
| 实时现场总线控制器 | `esc` | `product` |

产品中心（`sheet_product.tmpl`）用 `listCategoryAsTree()` 取 `product` 分类下的子分类作为系列，不依赖主题设置；分类归档页（`categories.tmpl`）列全站分类。另有 `news`（新闻中心）分类。

### 招聘分类与岗位文章（加入我们）

| 分类名 | slug | 父级 | 说明 |
| --- | --- | --- | --- |
| 招聘 | `jobs` | — | **slug 必须是 `jobs`**，`jobs-block.tmpl` 按它定位父分类 |
| 社会招聘 | `job-social` | `jobs` | Tab 1 |
| 校园招聘 | `job-campus` | `jobs` | Tab 2 |

- Tab 由 `jobs` 的**子分类自动生成**（`listCategoryAsTree("jobs")`），新增/改名子类无需改模板；Tab 顺序按分类 `priority`。
- 岗位文章为普通文章（`type=0`），归入 `job-social` / `job-campus`，**后台「自定义模板」必须选 `job`**（对应 `post_job.tmpl`），否则回退 `post.tmpl`。
- 摘要填岗位亮点（一两句话），正文填完整岗位描述（职责 / 要求）；正文支持富文本与 Markdown。
- 岗位详情页顶部有「立即投递」按钮（`mailto:` 调本机邮件客户端，主题/正文按岗位名自动生成），收件邮箱取主题设置 **加入我们 - 投递邮箱 `job_apply_email`**，按钮文案用 `job_apply_text`；**投递邮箱留空则不渲染该按钮**。
- 初始化 SQL 见 `scripts/add_jobs_categories.sql`（可重复执行）。

> ⚠️ 主题设置 `product_series_slugs` 只影响**产品详情页顶部的系列导航**（`product-detail.tmpl`），必须与实际子分类 slug 一致。当前后台仍是旧值 `dsc,soc`，与实际分类 `dsp` / `esc` 不匹配，会导致该导航渲染为空，请改为 `dsp,esc`。

### 产品文章（8 篇）

| slug | 标题 | 分类 | 模板 | 状态 |
| --- | --- | --- | --- | --- |
| `ly-f201` | SYS-F335 | `dsp` | `product` | 已发布 |
| `SYS-F0025C` | SYS-F0025C | `dsp` | `product` | 已发布 |
| `SYS-F0039C` | SYS-F0039C | `dsp` | `product` | 已发布 |
| `SYS-F377D` | SYS-F377D | `dsp` | `product` | 已发布 |
| `SYS-F335BGA-GH` | SYS-F335BGA-GH | `dsp` | `product` | 已发布 |
| `SYS-F00137` | SYS-F00137 | `dsp` | `product` | 已发布 |
| `SYS-E252` | SYS-E252 | `esc` | `product` | 已发布 |
| `kt133b` | KT133B芯片 | `esc` | `product` | 回收站 |

（`ly-f201` 是早期演示数据遗留的 slug，与标题 `SYS-F335` 不一致，按需在后台改；缩略图与资料文件沿用 CDN，亮点/特性/下载按上文 metas JSON 约定录入）

### 新闻文章（`news` 分类，模板 `news`）

- 标题 / 日期 / 摘要 / 正文与缩略图按源站新闻数据录入，前 3 条置顶（置顶文章进列表页顶部轮播）
- 侧栏分类由标签驱动：`company-news` 公司新闻 / `product-news` 产品资讯 / `industry-news` 行业动态，列表项按文章标签过滤，括号里的条数由 JS 统计

## 常见问题

| 现象 | 原因 / 处理 |
| --- | --- |
| 产品详情页只有标题、没有内容 | 后台「自定义模板」未选 `product`，`resolvePostTemplate` 回退到 `post.tmpl`（只渲染标题 + 正文），而产品正文为空。后台把模板选为 `product` 即可，特性 / 亮点 / 下载都走 metas |
| 产品详情页顶部系列导航空白 | 主题设置 `product_series_slugs` 与实际分类 slug 不一致（当前为旧值 `dsc,soc`，实际是 `dsp` / `esc`），改为 `dsp,esc` |
| 文章前台看不到 | 大部分文章处于**回收站**状态（`status=2`），需在后台「回收站」恢复为已发布 |
| 独立页面 Banner 空白 | 该页面的 `hero_image` / `hero_gradient` 自定义字段未填（或留空时按兜底样式渲染） |
| 结构化板块整块不渲染 | 对应 meta 的 JSON 格式非法或为空字符串，模板只认 JSON（`from_json` 解析失败即跳过该板块） |
| 岗位列表页整块空白（无 Tab、无提示） | `sheet_jobs.tmpl` 或 `module/jobs-block.tmpl` 未被成功加载，最常见是模板里用了跨行的 `{# … #}` 注释。日志会记 `parse template err`，页面表现为 200 但正文为空 |
| 加入我们页提示「还没有子分类」 | 「招聘」分类（slug 必须是 `jobs`）下没有子分类，或岗位文章未归入 `job-social` / `job-campus` |
| 岗位文章在 Tab 里看不到 | 文章状态不是「已发布」（`listPostByCategoryID` 只返回已发布），或没归到招聘子分类 |

## 资源说明

图片与资料文件沿用官网 CDN（`https://cdn.newaigou.com/sysummit/assets/...`），主题内不搬运二进制文件；Logo、二维码在「外观 - 主题设置」中可替换为本地上传地址。

## 二次开发

- 改模板语法前先读 `resources/template/theme/THEME-SYNTAX.md`（变量、函数、include 规则、常见坑）。
- 模板保存后会热重载；若语法错误，启动/重载时日志会报 `parse template err`。
- **pongo2 的 `{# … #}` 是单行注释**，注释里不能换行，多行注释要用 `{% comment %}…{% endcomment %}`；写错会在加载模板时报 `Newline not permitted in a single-line comment`，页面表现为 200 但空白。
- **`{% set %}` 写在 `{% for %}` 里属子作用域，循环外不可见**（后端 `getCategoryBySlug` 的注释也记了这条）。需要「遍历查找并赋值」时用带 slug 入参的 `listCategoryAsTree("xxx")`，它直接返回该节点（含 `Children`）的单元素切片。
- **新增 `.tmpl` 文件同样会被热重载**（监听器按目录监听 `.tmpl` 的增删改，`Reload` 清编译缓存后按需重编译）；若页面没变化，手动 touch 一下该文件或重启服务再试。
- **`settings.yaml` 新增配置项的生效有缓存延迟**：模板里取不到新键时（如投递按钮不出现），说明主题设置缓存尚未刷新，稍等片刻或重新激活主题、必要时重启服务即可；未在后台保存过时取 `settings.yaml` 里的 `default` 值（`service/impl/theme.go` 中 DB 值优先、缺失回退默认值）。
- 新增板块样式写在 `assets/css/blocks/` 对应模块（按页面/组件命名，文件头注明服务页面），新页面新建模块后在 `assets/css/www-blocks.css` 追加 `@import`；交互写在 `assets/js/www-blocks.js`，避免在 `main.css` / `main.js` 中与基础组件冲突。模块内响应式断点统一 1200 / 1024 / 768；注意 `@import` 子文件不带版本参数，改动后开发时需强刷浏览器缓存。
- **设计令牌（v2.0 起）**：色彩/字阶/圆角/间距/阴影统一走 CSS 变量，双层架构——`--ds-*` 原始令牌定义在 `blocks/_tokens.css`（落地过程与规范来源见 `DESIGN-UPGRADE-PLAN.md`），`--ap-*` 语义层在 `main.css :root` 映射（品牌主色 `--ap-primary` 由后台「主题设置 primary_color」注入，默认 `#003e6f`）。业务样式**禁止硬编码色值**（白/黑中性色除外），字体字号用 `--ds-type-*`，数据表格加 `font-variant-numeric: var(--ds-numeric)`；改后台主色时需同步 `_tokens.css` 的按钮三态与各级 tint / 光晕（当前后台配置值为 `#409eff`，与令牌默认推导口径 `#003e6f` 不一致，换色前请先对齐）。
- 新增剧本模板命名遵循 `post_<短名>.tmpl` / `sheet_<短名>.tmpl`；可复用区块抽到 `module/`，业务区块一般要放在 `.ap-container` 内才有定宽与留白（导航条等全宽组件除外）。
