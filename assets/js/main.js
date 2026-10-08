/* theme-www / AirPress 企业官网主题 */
(function () {
    'use strict';

    function ready(fn) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', fn);
        } else {
            fn();
        }
    }

    /* 图片加载失败兜底：图被删/网络异常时浏览器会画破图 icon，统一切成占位块。
       注意 error 事件不冒泡，必须监听捕获阶段才会收到子元素的加载失败 */
    document.addEventListener('error', function (e) {
        var img = e.target;
        if (!img || img.tagName !== 'IMG' || img.getAttribute('data-ap-broken')) {
            return;
        }
        img.setAttribute('data-ap-broken', '1');
        var box = img.closest ? img.closest('.ap-card__thumb, .ap-news-item__thumb') : null;
        if (box) {
            box.classList.add('is-broken');
            if (img.alt) {
                box.setAttribute('data-ap-alt', img.alt);
            }
        } else {
            img.classList.add('is-broken');
        }
        img.style.visibility = 'hidden';
    }, true);

    ready(function () {
        var header = document.getElementById('apHeader');
        var toggle = document.getElementById('apNavToggle');
        var drawer = document.getElementById('apDrawer');
        var drawerClose = document.getElementById('apDrawerClose');
        var drawerMask = document.getElementById('apDrawerMask');

        /* 头部滚动阴影 + 顶部条收起 */
        var STICKY_ON = 96;    /* 收起阈值 */
        var STICKY_OFF = 24;   /* 展开阈值：与收起阈值拉开做滞回（> 头部收缩幅度 48px），避免在临界点反复切换 */
        var STICKY_TAIL = 60;  /* 距底部小于该值时不再收起：头部变矮会让文档变短，滚到底部附近可能来回抖动 */
        var sticky = false;
        var lastHeaderH = -1;
        var ticking = false;

        /* 吸顶元素（锚点导航）需要跟随头部实际高度 */
        function syncHeaderOffset() {
            if (!header) {
                return;
            }
            var h = header.offsetHeight;
            if (h > 0 && h !== lastHeaderH) {
                lastHeaderH = h;
                document.documentElement.style.setProperty('--ap-header-now', h + 'px');
            }
        }

        function maxScroll() {
            return Math.max(0, (document.documentElement.scrollHeight || 0) - window.innerHeight);
        }

        function applySticky() {
            if (!header) {
                return;
            }
            var y = window.scrollY || document.documentElement.scrollTop || 0;
            if (!sticky && y > STICKY_ON && maxScroll() - y > STICKY_TAIL) {
                sticky = true;
                header.classList.add('is-sticky');
            } else if (sticky && y < STICKY_OFF) {
                sticky = false;
                header.classList.remove('is-sticky');
            }
            syncHeaderOffset();
        }

        function onScroll() {
            if (ticking) {
                return;
            }
            ticking = true;
            var raf = window.requestAnimationFrame || function (fn) { return window.setTimeout(fn, 16); };
            raf(function () {
                ticking = false;
                applySticky();
            });
        }

        window.addEventListener('scroll', onScroll, {passive: true});
        window.addEventListener('resize', onScroll);
        applySticky();

        /* 顶部条是 .25s 过渡收起，期间头部高度持续变化，但此时不会再有 scroll 事件；
           用 ResizeObserver 跟随高度，避免吸顶元素停在旧偏移上产生跳动 */
        if (header && window.ResizeObserver) {
            new window.ResizeObserver(syncHeaderOffset).observe(header);
        } else if (header) {
            header.addEventListener('transitionend', syncHeaderOffset);
        }

        /* 移动端抽屉 */
        function openDrawer() {
            if (drawer) {
                drawer.classList.add('is-open');
                document.body.style.overflow = 'hidden';
            }
        }

        function closeDrawer() {
            if (drawer) {
                drawer.classList.remove('is-open');
                document.body.style.overflow = '';
            }
        }

        if (toggle) {
            toggle.addEventListener('click', openDrawer);
        }
        if (drawerClose) {
            drawerClose.addEventListener('click', closeDrawer);
        }
        if (drawerMask) {
            drawerMask.addEventListener('click', closeDrawer);
        }

        /* 回到顶部 */
        var backTop = document.getElementById('apBackTop');
        if (backTop) {
            backTop.addEventListener('click', function () {
                window.scrollTo({top: 0, behavior: 'smooth'});
            });
        }

        /* 移动端联系弹窗 */
        var contactTrigger = document.getElementById('apContactTrigger');
        var contactPopup = document.getElementById('apContactPopup');
        var contactClose = document.getElementById('apContactClose');

        function setContact(open) {
            if (contactPopup) {
                contactPopup.classList.toggle('is-open', open);
            }
            // 源站：弹窗打开时隐藏触发按钮（v-if="!showContactPopup"）
            if (contactTrigger) {
                contactTrigger.style.display = open ? 'none' : '';
            }
        }

        if (contactTrigger && contactPopup) {
            contactTrigger.addEventListener('click', function (e) {
                e.stopPropagation();
                setContact(!contactPopup.classList.contains('is-open'));
            });
            document.addEventListener('click', function (e) {
                if (!contactPopup.contains(e.target) && e.target !== contactTrigger) {
                    setContact(false);
                }
            });
        }
        if (contactClose) {
            contactClose.addEventListener('click', function () { setContact(false); });
        }

        /* 滚动显现动画 */
        var revealItems = document.querySelectorAll('.ap-reveal');
        if (revealItems.length && 'IntersectionObserver' in window) {
            var observer = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        observer.unobserve(entry.target);
                    }
                });
            }, {threshold: 0.12});
            revealItems.forEach(function (item) {
                observer.observe(item);
            });
        } else {
            revealItems.forEach(function (item) {
                item.classList.add('is-visible');
            });
        }

        /* 移动端二级菜单展开 */
        document.querySelectorAll('.ap-drawer__item > .ap-drawer__expand').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var sub = btn.parentNode.querySelector('.ap-drawer__sub');
                if (sub) {
                    sub.classList.toggle('is-collapsed');
                }
            });
        });
    });
})();
