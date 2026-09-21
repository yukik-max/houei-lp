(function () {
    'use strict';

    // ヘッダーの影・スマホ下部ボタンの表示
    var header = document.getElementById('js-header');
    var spbar = document.getElementById('js-spbar');
    function onScroll() {
        var y = window.scrollY;
        header.classList.toggle('is-scrolled', y > 10);
        spbar.classList.toggle('is-show', y > 400);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // ファーストビューの写真切り替え
    var hero = document.getElementById('js-hero');
    var slides = hero.querySelectorAll('img');
    var now = document.getElementById('js-hero-now');
    var idx = 0;
    setInterval(function () {
        slides[idx].classList.remove('is-active');
        idx = (idx + 1) % slides.length;
        slides[idx].classList.add('is-active');
        now.textContent = ('0' + (idx + 1)).slice(-2);
    }, 5000);

    // スクロールでふわっと表示
    var targets = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (e.isIntersecting) {
                    e.target.classList.add('is-in');
                    io.unobserve(e.target);
                }
            });
        }, { rootMargin: '0px 0px -8% 0px' });
        targets.forEach(function (t) { io.observe(t); });
    } else {
        targets.forEach(function (t) { t.classList.add('is-in'); });
    }

    // お客様の声「続きを読む」
    document.querySelectorAll('.js-clamp').forEach(function (box) {
        box.classList.add('is-clamped');
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'voice_more';
        btn.textContent = '続きを読む';
        btn.addEventListener('click', function () {
            var open = box.classList.toggle('is-clamped');
            btn.textContent = open ? '続きを読む' : '閉じる';
        });
        box.after(btn);
    });

    // 申込みフォームの送信（同フォルダの mail.php へ。成功したらお礼を表示）
    var form = document.getElementById('js-form');
    var thanks = document.getElementById('thanks');
    var formError = document.getElementById('js-form-error');
    function showThanks() {
        form.hidden = true;
        thanks.hidden = false;
        thanks.scrollIntoView({ block: 'center' });
    }
    if (/[?&]sent=1/.test(location.search)) showThanks();
    form.addEventListener('submit', function (e) {
        if (!window.fetch || !window.FormData) return;
        e.preventDefault();
        var btn = form.querySelector('button[type="submit"]');
        btn.disabled = true;
        formError.hidden = true;
        fetch(form.action, {
            method: 'POST',
            body: new FormData(form),
            headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' }
        }).then(function (res) {
            return res.text().then(function (t) {
                if (!res.ok) throw new Error(t || ('status ' + res.status));
                window.dataLayer = window.dataLayer || [];
                window.dataLayer.push({ event: 'lp2609_form_sent' });
                showThanks();
            });
        }).catch(function (err) {
            btn.disabled = false;
            var msg = String(err && err.message || '');
            formError.textContent = /^入力エラー/.test(msg) ? msg : '送信に失敗しました。お手数ですがお電話（0120-188-578）でご連絡ください。';
            formError.hidden = false;
        });
    });

    // 室内写真の拡大表示
    var lb = document.getElementById('js-lightbox');
    var lbImg = lb.querySelector('img');
    var items = Array.prototype.slice.call(document.querySelectorAll('#js-gallery .gallery_item img'));
    var cur = 0;
    function show(i) {
        cur = (i + items.length) % items.length;
        lbImg.src = items[cur].src;
        lbImg.alt = items[cur].alt;
        lb.hidden = false;
    }
    function close() { lb.hidden = true; }
    items.forEach(function (img, i) {
        img.parentNode.addEventListener('click', function () { show(i); });
    });
    lb.addEventListener('click', function (e) {
        if (e.target === lb || e.target.classList.contains('lightbox_close')) close();
    });
    lb.querySelector('.lightbox_nav--prev').addEventListener('click', function () { show(cur - 1); });
    lb.querySelector('.lightbox_nav--next').addEventListener('click', function () { show(cur + 1); });
    document.addEventListener('keydown', function (e) {
        if (lb.hidden) return;
        if (e.key === 'Escape') close();
        if (e.key === 'ArrowLeft') show(cur - 1);
        if (e.key === 'ArrowRight') show(cur + 1);
    });
})();
