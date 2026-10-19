/**
 * www-blocks.js — 官网板块交互（在 main.js 之后加载）
 * 1. 首页「应用领域」切换展示
 * 2. 常见问题折叠面板
 * 3. 资料下载按系列筛选
 * 4. 桌面端二维码悬浮卡
 * 5. 产品中心系列切换（侧边树 + 移动端切换条，同一时刻只显示一个系列）
 * 6. 新闻列表：顶部轮播（前 3 条置顶）+ 分类筛选
 * 7. 新闻详情：分享（复制链接 / 微博）
 * 8. 联系我们：联系信息点击复制（源站 copyText + ElMessage 的轻量替代）
 */
(function () {
    'use strict';

    /* 复制到剪贴板（clipboard API + 旧浏览器兜底），完成后回调 */
    function copyToClipboard(text, done) {
        function fallback() {
            var input = document.createElement('textarea');
            input.value = text;
            input.style.position = 'fixed';
            input.style.opacity = '0';
            document.body.appendChild(input);
            input.select();
            try { document.execCommand('copy'); } catch (e) {}
            document.body.removeChild(input);
            if (done) done();
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(done || function () {}, fallback);
        } else {
            fallback();
        }
    }

    /* 轻量 toast（源站 ElMessage.success 的替代） */
    function toast(text) {
        var el = document.createElement('div');
        el.className = 'ap-toast';
        el.textContent = text;
        document.body.appendChild(el);
        setTimeout(function () {
            if (el.parentNode) el.parentNode.removeChild(el);
        }, 1800);
    }

    document.addEventListener('DOMContentLoaded', function () {
        initHeroCarousel();
        initShowcase();
        initFaq();
        initJobsTabs();
        initFileFilter();
        initSeriesNav();
        initProductFilter();
        initContactForm();
        initNewsCarousel();
        initNewsFilter();
        initNewsShare();
        initContactCopy();
        initMarkdownBlocks();
        initContentDownloads();
    });

    /* ---------- 首屏轮播：自动播放（6s）+ 箭头/圆点；仅 1 张时为静态 Banner，不初始化 ---------- */
    function initHeroCarousel() {
        var root = document.getElementById('apHeroCarousel');
        if (!root) return;
        var slides = root.querySelectorAll('.ap-hero-carousel__item');
        if (slides.length < 2) return;
        var dotsBox = root.querySelector('.ap-hero-carousel__dots');
        var dots = [];
        var current = 0;
        var timer = null;
        for (var i = 0; i < slides.length; i++) {
            (function (i) {
                var d = document.createElement('button');
                d.type = 'button';
                d.className = 'ap-hero-carousel__dot' + (i === 0 ? ' is-active' : '');
                d.setAttribute('aria-label', '第' + (i + 1) + '张');
                d.addEventListener('click', function () { go(i); restart(); });
                dotsBox.appendChild(d);
                dots.push(d);
            })(i);
        }
        function go(i) {
            slides[current].classList.remove('is-active');
            dots[current].classList.remove('is-active');
            current = (i + slides.length) % slides.length;
            slides[current].classList.add('is-active');
            dots[current].classList.add('is-active');
        }
        function restart() {
            if (timer) clearInterval(timer);
            timer = setInterval(function () { go(current + 1); }, 6000);
        }
        root.querySelector('[data-direction="-1"]').addEventListener('click', function () { go(current - 1); restart(); });
        root.querySelector('[data-direction="1"]').addEventListener('click', function () { go(current + 1); restart(); });
        root.addEventListener('mouseenter', function () { if (timer) clearInterval(timer); });
        root.addEventListener('mouseleave', restart);
        restart();
    }

    /* ---------- Markdown 约定块：## 产品亮点 / ## 资料下载 → 结构化板块 ----------
       在 .ap-content--md 里按标题约定扫描：
       「## 产品亮点」下的 ### 分组 + 列表  → 亮点卡片网格（.ap-highlights）
       「## 资料下载」下的链接列表 / 表格   → 下载表（.ap-files）
       转换后的 DOM 与 metas 版结构一致，样式完全复用 */
    function initMarkdownBlocks() {
        var box = document.querySelector('.ap-content--md');
        if (!box) return;

        // data-markdown：文章是 Markdown 源（editor_type=1，AirPress 不转换），用 marked 渲染
        if (box.hasAttribute('data-markdown') && window.marked) {
            box.innerHTML = window.marked.parse(box.textContent);
            box.removeAttribute('data-markdown');
        }

        /* 章节标记：正文里写 <div class="product_lightspot_md">产品亮点</div>
           与 <div class="product_downloads_md">资料下载</div>，JS 按 class 识别
           （不用标题文字匹配，改标题文案不影响解析）。
           章节结束：<div class="product_md_end"></div>，或下一个开始标记，或正文结尾。
           结束标记之后的内容恢复为普通正文，不再被任何章节吸收。 */
        var HIGHLIGHT_SEL = '.product_lightspot_md';
        var DOWNLOAD_SEL = '.product_downloads_md';
        var END_SEL = '.product_md_end';

        function isMarker(el) {
            return !!(el.matches && (el.matches(HIGHLIGHT_SEL) || el.matches(DOWNLOAD_SEL)));
        }

        function isEnd(el) {
            return !!(el.matches && el.matches(END_SEL));
        }

        function extOf(url) {
            var path = (url || '').split('?')[0].split('#')[0];
            var m = path.match(/\.([a-z0-9]+)$/i);
            return m ? m[1].toUpperCase() : '';
        }

        function absUrl(url) {
            if (/^(https?:)?\/\//i.test(url)) return url;
            return location.origin + (url.charAt(0) === '/' ? '' : '/') + url;
        }

        function sectionEnd(children, start) {
            for (var j = start + 1; j < children.length; j++) {
                if (isMarker(children[j]) || isEnd(children[j])) return j;
            }
            return children.length;
        }

        function collectGroups(list) {
            var groups = [], cur = null;
            list.forEach(function (el) {
                if (el.tagName === 'H3') {
                    cur = { title: el.textContent.trim(), items: [] };
                    groups.push(cur);
                } else if (cur && (el.tagName === 'UL' || el.tagName === 'OL')) {
                    Array.prototype.forEach.call(el.querySelectorAll('li'), function (li) {
                        cur.items.push(li.textContent.trim());
                    });
                }
            });
            return groups;
        }

        function blockTitle(text) {
            var h2 = document.createElement('h2');
            h2.className = 'ap-block__title';
            h2.textContent = text;
            return h2;
        }

        function buildHighlights(title, groups) {
            var wrap = document.createElement('div');
            wrap.className = 'ap-md-section';
            wrap.appendChild(blockTitle(title));
            var grid = document.createElement('div');
            grid.className = 'ap-highlights';
            groups.forEach(function (g) {
                var card = document.createElement('div');
                card.className = 'ap-highlight';
                var h3 = document.createElement('h3');
                h3.className = 'ap-highlight__title';
                var icon = document.querySelector('.ap-highlight__title svg');
                if (icon) h3.appendChild(icon.cloneNode(true));
                h3.appendChild(document.createTextNode(g.title));
                card.appendChild(h3);
                var ul = document.createElement('ul');
                ul.className = 'ap-highlight__list';
                g.items.forEach(function (t) {
                    var li = document.createElement('li');
                    li.textContent = t;
                    ul.appendChild(li);
                });
                card.appendChild(ul);
                grid.appendChild(card);
            });
            wrap.appendChild(grid);
            return wrap;
        }

        function fileRow(cells) {
            var row = document.createElement('div');
            row.className = 'ap-files__row';
            function span(text) {
                var s = document.createElement('span');
                s.textContent = text || '';
                return s;
            }
            var name = document.createElement('span');
            name.className = 'ap-files__name';
            name.textContent = cells.name;
            row.appendChild(name);
            row.appendChild(span(cells.format));
            row.appendChild(span(cells.size));
            row.appendChild(span(cells.date));
            var op = document.createElement('span');
            var a = document.createElement('a');
            a.className = 'ap-btn ap-btn--sm ap-download-link';
            a.href = absUrl(cells.url);
            a.setAttribute('download', '');
            a.setAttribute('target', '_blank');
            a.setAttribute('rel', 'noopener');
            a.textContent = '下载';
            op.appendChild(a);
            row.appendChild(op);
            return row;
        }

        function buildFiles(title, list) {
            var rows = [];
            list.forEach(function (el) {
                if (el.tagName === 'UL' || el.tagName === 'OL') {
                    Array.prototype.forEach.call(el.querySelectorAll('li'), function (li) {
                        var a = li.querySelector('a');
                        var url = a ? a.getAttribute('href') : '';
                        if (!url) return;
                        rows.push({
                            name: a ? a.textContent.trim() : li.textContent.trim(),
                            format: extOf(url), size: '', date: '', url: url
                        });
                    });
                } else if (el.tagName === 'TABLE') {
                    Array.prototype.forEach.call(el.querySelectorAll('tbody tr'), function (tr) {
                        var tds = tr.querySelectorAll('td');
                        if (tds.length < 2) return;
                        var linkCell = tds[tds.length - 1].querySelector('a');
                        var url = linkCell ? linkCell.getAttribute('href') : tds[tds.length - 1].textContent.trim();
                        rows.push({
                            name: tds[0].textContent.trim(),
                            format: tds[1] ? tds[1].textContent.trim() : extOf(url),
                            size: tds[2] ? tds[2].textContent.trim() : '',
                            date: tds[3] ? tds[3].textContent.trim() : '',
                            url: url
                        });
                    });
                }
            });
            if (!rows.length) return null;

            var wrap = document.createElement('div');
            wrap.className = 'ap-md-section';
            wrap.appendChild(blockTitle(title));
            var files = document.createElement('div');
            files.className = 'ap-files';
            var head = document.createElement('div');
            head.className = 'ap-files__head';
            ['资料名称', '文件格式', '文件大小', '修改日期', '操作'].forEach(function (t) {
                var s = document.createElement('span');
                s.textContent = t;
                head.appendChild(s);
            });
            files.appendChild(head);
            rows.forEach(function (r) { files.appendChild(fileRow(r)); });
            wrap.appendChild(files);
            return wrap;
        }

        var children = Array.prototype.slice.call(box.children);
        var i = 0;
        while (i < children.length) {
            var el = children[i];
            if (!isMarker(el)) { i++; continue; }
            var isHl = el.matches(HIGHLIGHT_SEL);
            var title = (el.textContent || '').trim();
            var end = sectionEnd(children, i);

            // 该章节要吸收的元素类型：亮点=h3+列表；下载=列表/表格。其它（引用、段落）保留
            var absorb = isHl ? { H3: 1, UL: 1, OL: 1 } : { UL: 1, OL: 1, TABLE: 1 };

            var made = null;
            var section = children.slice(i + 1, end);
            if (isHl) {
                var groups = collectGroups(section);
                if (groups.length) made = buildHighlights(title, groups);
            } else {
                made = buildFiles(title, section);
            }

            if (made) {
                box.insertBefore(made, el);
                for (var k = i; k < end; k++) {
                    var c = children[k];
                    if ((c === el || absorb[c.tagName]) && c.parentNode === box) {
                        box.removeChild(c);
                    }
                }
                // 章节结束标记本身也不显示
                if (end < children.length && isEnd(children[end]) && children[end].parentNode === box) {
                    box.removeChild(children[end]);
                }
                children = Array.prototype.slice.call(box.children);
                continue;
            }
            i++;
        }
    }

    /* ---------- 正文里的下载链接（写 Markdown 链接即可，无需 metas） ---------- */
    function initContentDownloads() {
        var FILE_EXT = /\.(pdf|zip|rar|7z|doc|docx|xls|xlsx|ppt|pptx|bin|hex|tar|gz|tgz|dmg|apk|jpg|png)$/i;
        var links = document.querySelectorAll('.ap-content a[href], .ap-product__desc a[href]');
        Array.prototype.forEach.call(links, function (a) {
            var href = a.getAttribute('href') || '';
            if (!href) return;
            // 去掉查询串与锚点后按扩展名判断
            var path = href.split('?')[0].split('#')[0];
            if (!FILE_EXT.test(path)) return;

            // 站内相对路径补上当前站点域名（模板层拿不到浏览器地址，这里统一处理）
            if (!/^(https?:)?\/\//i.test(href) && href.charAt(0) === '/') {
                a.setAttribute('href', location.origin + href);
            }
            a.classList.add('ap-download-link');
            a.setAttribute('download', '');
            a.setAttribute('target', '_blank');
            a.setAttribute('rel', 'noopener');
        });
    }

    /* ---------- 应用领域切换展示 ---------- */
    function initShowcase() {
        var showcase = document.getElementById('apShowcase');
        if (!showcase) return;
        // 只在「无 hover 能力」的触屏设备上跳过：此时 4 个面板纵向平铺，Tab 仅作跳转入口。
        // 之前按 max-width:768px 跳过，导致桌面窗口缩窄后鼠标悬浮失效。
        if (window.matchMedia && window.matchMedia('(hover: none)').matches) return;

        var tabs = showcase.querySelectorAll('.ap-showcase__tab');
        var panels = showcase.querySelectorAll('.ap-showcase__panel');

        function activate(index) {
            Array.prototype.forEach.call(tabs, function (tab) {
                tab.classList.toggle('is-active', tab.getAttribute('data-index') === String(index));
            });
            Array.prototype.forEach.call(panels, function (panel) {
                panel.classList.toggle('is-active', panel.getAttribute('data-index') === String(index));
            });
        }

        Array.prototype.forEach.call(tabs, function (tab) {
            var index = Number(tab.getAttribute('data-index'));
            tab.addEventListener('mouseenter', function () { activate(index); });
            tab.addEventListener('focus', function () { activate(index); });
        });
    }

    /* ---------- 常见问题 ---------- */
    function initFaq() {
        var wrap = document.getElementById('apFaq');
        if (!wrap) return;
        var items = wrap.querySelectorAll('.ap-faq__item');
        Array.prototype.forEach.call(items, function (item, i) {
            var btn = item.querySelector('.ap-faq__q');
            if (!btn) return;
            if (i === 0) item.classList.add('is-open');
            btn.addEventListener('click', function () {
                item.classList.toggle('is-open');
            });
        });
    }

    /* ---------- 加入我们：招聘 Tab 切换（一次只显示一个面板） ---------- */
    function initJobsTabs() {
        var root = document.getElementById('apJobs');
        if (!root) return;
        var tabs = root.querySelectorAll('.ap-jobs__tab');
        var panels = root.querySelectorAll('.ap-jobs__panel');
        if (tabs.length < 2) return;

        function activate(index) {
            Array.prototype.forEach.call(tabs, function (tab) {
                var on = tab.getAttribute('data-index') === String(index);
                tab.classList.toggle('is-active', on);
                tab.setAttribute('aria-selected', on ? 'true' : 'false');
            });
            Array.prototype.forEach.call(panels, function (panel) {
                panel.classList.toggle('is-active', panel.getAttribute('data-index') === String(index));
            });
        }

        Array.prototype.forEach.call(tabs, function (tab) {
            var index = Number(tab.getAttribute('data-index'));
            tab.addEventListener('click', function () { activate(index); });
        });
    }

    /* ---------- 资料下载筛选 ---------- */
    function initFileFilter() {
        var filter = document.getElementById('apFileFilter');
        var list = document.getElementById('apFileList');
        if (!filter || !list) return;
        var chips = filter.querySelectorAll('.ap-chip');
        var rows = list.querySelectorAll('.ap-files__row');

        Array.prototype.forEach.call(chips, function (chip) {
            chip.addEventListener('click', function () {
                var series = chip.getAttribute('data-series') || '';
                Array.prototype.forEach.call(chips, function (c) { c.classList.remove('is-active'); });
                chip.classList.add('is-active');
                Array.prototype.forEach.call(rows, function (row) {
                    var value = row.getAttribute('data-series') || '';
                    row.style.display = (!series || value === series) ? '' : 'none';
                });
            });
        });
    }

    /* ---------- 产品中心：系列锚点高亮 ---------- */
    function initSeriesNav() {
        var nav = document.getElementById('apSeriesNav') || document.getElementById('apSectionNav');
        var sidebar = document.getElementById('apSeriesSidebar');
        if (!nav && !sidebar) return;

        var links = [];
        if (nav) links = links.concat(Array.prototype.slice.call(nav.querySelectorAll('a[data-anchor]')));
        if (sidebar) links = links.concat(Array.prototype.slice.call(sidebar.querySelectorAll('a[data-anchor]')));
        if (!links.length) return;

        var sections = [];
        Array.prototype.forEach.call(links, function (link) {
            var section = document.getElementById(link.getAttribute('data-anchor'));
            if (section && sections.indexOf(section) === -1) sections.push(section);
        });
        if (!sections.length) return;

        function activate(id) {
            Array.prototype.forEach.call(links, function (link) {
                link.classList.toggle('is-active', link.getAttribute('data-anchor') === id);
            });
        }

        Array.prototype.forEach.call(links, function (link) {
            link.addEventListener('click', function () { activate(link.getAttribute('data-anchor')); });
        });

        activate(sections[0].id);

        if (!('IntersectionObserver' in window)) return;
        var observer = new IntersectionObserver(function (entries) {
            Array.prototype.forEach.call(entries, function (entry) {
                if (entry.isIntersecting) activate(entry.target.id);
            });
        }, { rootMargin: '-120px 0px -60% 0px' });
        Array.prototype.forEach.call(sections, function (section) { observer.observe(section); });
    }

    /* ---------- 产品中心：系列切换（源站侧栏树 / 移动端切换条） ---------- */
    function initProductFilter() {
        var main = document.getElementById('apProductMain');
        if (!main) return;

        var nav = document.getElementById('apProductNav');
        var sidebar = document.getElementById('apSeriesSidebar');
        var links = [];
        if (nav) links = links.concat(Array.prototype.slice.call(nav.querySelectorAll('a[data-series]')));
        if (sidebar) links = links.concat(Array.prototype.slice.call(sidebar.querySelectorAll('a[data-series]')));
        var sections = main.querySelectorAll('section[data-series]');
        if (!links.length || !sections.length) return;

        function activate(slug, scroll) {
            Array.prototype.forEach.call(links, function (link) {
                link.classList.toggle('is-active', link.getAttribute('data-series') === slug);
            });
            Array.prototype.forEach.call(sections, function (section) {
                section.style.display = (section.getAttribute('data-series') === slug) ? '' : 'none';
            });
            if (scroll && history.replaceState) history.replaceState(null, '', '#series-' + slug);
        }

        Array.prototype.forEach.call(links, function (link) {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                activate(link.getAttribute('data-series'), true);
            });
        });

        // 默认显示第一个系列；带 hash 进入时显示对应系列
        var hash = (location.hash || '').replace('#series-', '');
        var matched = hash && main.querySelector('section[data-series="' + hash + '"]');
        activate(matched ? hash : sections[0].getAttribute('data-series'), false);
    }

    /* ---------- 桌面端二维码悬浮卡 ---------- */
    /* ---------- 在线留言表单（无后端：校验后唤起邮件客户端） ---------- */
    function initContactForm() {
        var form = document.getElementById('apContactForm');
        if (!form) return;
        var msg = document.getElementById('apContactMsg');

        function show(text, isError) {
            if (!msg) return;
            msg.textContent = text;
            msg.className = isError ? 'ap-form__msg is-error' : 'ap-form__msg';
            msg.hidden = false;
        }

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var valid = true;
            var data = {};
            var firstBad = null;

            Array.prototype.forEach.call(form.querySelectorAll('input, textarea'), function (el) {
                var value = (el.value || '').trim();
                var wrap = el.parentNode;
                var badMail = el.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
                var bad = !!el.required && (!value || badMail);
                if (wrap && wrap.classList) wrap.classList.toggle('is-error', bad);
                if (bad) {
                    valid = false;
                    if (!firstBad) firstBad = el;
                }
                data[el.name] = value;
            });

            if (!valid) {
                show('请完整填写带 * 的必填项（邮箱需为正确格式）。', true);
                if (firstBad) firstBad.focus();
                return;
            }

            var mailto = form.getAttribute('data-mailto') || '';
            var subject = '在线留言 - ' + data.name + (data.company ? ' - ' + data.company : '');
            // 公司名称 / 联系地址为选填，留空时不写进邮件正文
            var lines = [
                '联系人：' + data.name,
                '邮箱：' + data.email
            ];
            if (data.company) lines.push('公司名称：' + data.company);
            if (data.address) lines.push('联系地址：' + data.address);
            lines.push('', '相关事宜：', data.content);
            var body = lines.join('\n');

            window.location.href = 'mailto:' + mailto +
                '?subject=' + encodeURIComponent(subject) +
                '&body=' + encodeURIComponent(body);
            show('已唤起邮件客户端，请在邮件中确认后发送；也可以直接致电或发邮件联系我们。', false);
        });
    }

    /* ---------- 新闻列表：顶部轮播（源站 newsConfig.carousel，5s 自动切换） ---------- */
    function initNewsCarousel() {
        var carousel = document.getElementById('apNewsCarousel');
        if (!carousel) return;
        var items = carousel.querySelectorAll('.ap-news-carousel__item');
        if (items.length < 2) return;

        var viewport = carousel.querySelector('.ap-news-carousel__viewport');
        var dotsBox = carousel.querySelector('.ap-news-carousel__dots');
        var current = 0;
        var timer = null;

        // 指示点与轮播条数一致
        var dots = [];
        if (dotsBox) {
            // 胶囊容器：指示点叠加在图片上，浅色图片下也能看清
            var dotBox = document.createElement('div');
            dotBox.className = 'ap-news-carousel__dots-inner';
            dotsBox.appendChild(dotBox);
            Array.prototype.forEach.call(items, function (item, i) {
                var dot = document.createElement('span');
                dot.className = 'ap-news-carousel__dot' + (i === 0 ? ' is-active' : '');
                dot.setAttribute('data-index', i);
                dot.addEventListener('click', function () { go(i); });
                dotBox.appendChild(dot);
                dots.push(dot);
            });
        }

        function go(index) {
            current = (index + items.length) % items.length;
            Array.prototype.forEach.call(items, function (item, i) {
                item.classList.toggle('is-active', i === current);
            });
            dots.forEach(function (dot, i) {
                dot.classList.toggle('is-active', i === current);
            });
        }

        function play() {
            stop();
            timer = setInterval(function () { go(current + 1); }, 5000);
        }

        function stop() {
            if (timer) { clearInterval(timer); timer = null; }
        }

        Array.prototype.forEach.call(carousel.querySelectorAll('.ap-news-carousel__arrow'), function (btn) {
            btn.addEventListener('click', function () {
                go(current + parseInt(btn.getAttribute('data-direction'), 10));
                play();
            });
        });

        carousel.addEventListener('mouseenter', stop);
        carousel.addEventListener('mouseleave', play);
        go(0);
        play();
    }

    /* ---------- 新闻列表：分类筛选（源站 .category-sidebar，前端过滤 + 计数） ---------- */
    function initNewsFilter() {
        var filter = document.getElementById('apNewsFilter');
        var list = document.getElementById('apNewsList');
        if (!filter || !list) return;

        var items = Array.prototype.slice.call(list.querySelectorAll('.ap-news-item'));
        var title = document.getElementById('apNewsTitle');
        var count = document.getElementById('apNewsCount');
        var empty = document.getElementById('apNewsEmpty');
        var buttons = filter.querySelectorAll('.ap-news-side__item');

        // 计数：全部 + 各分类（按列表项 data-tags）
        Array.prototype.forEach.call(filter.querySelectorAll('[data-count]'), function (el) {
            var cat = el.getAttribute('data-count');
            var n = cat === 'all' ? items.length : items.filter(function (item) {
                return (item.getAttribute('data-tags') || '').split(/\s+/).indexOf(cat) !== -1;
            }).length;
            el.textContent = '(' + n + ')';
        });

        Array.prototype.forEach.call(buttons, function (btn) {
            btn.addEventListener('click', function () {
                var cat = btn.getAttribute('data-cat');
                Array.prototype.forEach.call(buttons, function (b) { b.classList.remove('is-active'); });
                btn.classList.add('is-active');

                var shown = 0;
                items.forEach(function (item) {
                    var tags = (item.getAttribute('data-tags') || '').split(/\s+/);
                    var hit = cat === 'all' || tags.indexOf(cat) !== -1;
                    item.hidden = !hit;
                    if (hit) shown++;
                });
                if (title) title.textContent = btn.textContent.replace(/\(\d+\)/, '').trim();
                if (count) count.textContent = shown;
                if (empty) empty.hidden = shown !== 0;
            });
        });
    }

    /* ---------- 新闻详情：分享（复制链接 / 微博，无后端） ---------- */
    function initNewsShare() {
        var box = document.getElementById('apNewsShare');
        if (!box) return;

        var copyBtn = box.querySelector('[data-share="copy"]');
        if (copyBtn) {
            copyBtn.addEventListener('click', function () {
                var text = copyBtn.textContent;
                copyBtn.textContent = '已复制';
                setTimeout(function () { copyBtn.textContent = text; }, 1600);
                copyToClipboard(location.href);
            });
        }

        var weibo = box.querySelector('[data-share="weibo"]');
        if (weibo) {
            weibo.addEventListener('click', function (e) {
                e.preventDefault();
                window.open('https://service.weibo.com/share/share.php?url=' + encodeURIComponent(location.href) +
                    '&title=' + encodeURIComponent(document.title), '_blank', 'noopener');
            });
        }
    }

    /* ---------- 联系我们：联系信息点击复制（源站 copyText） ---------- */
    function initContactCopy() {
        var els = document.querySelectorAll('[data-copy]');
        if (!els.length) return;
        Array.prototype.forEach.call(els, function (el) {
            el.addEventListener('click', function () {
                copyToClipboard(el.getAttribute('data-copy'), function () {
                    toast('已复制');
                });
            });
        });
    }
})();
