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

    // 定員（各回20組）に達した時間帯は選べないようにする（capacity.php が空き状況を返す）
    var statusUrl = new URL('capacity.php', form.action).href;
    function applyCapacity(data) {
        if (!data || !data.slots) return;
        var radios = form.querySelectorAll('input[name="time"]');
        var open = 0;
        data.slots.forEach(function (s) {
            Array.prototype.forEach.call(radios, function (r) {
                if (r.value !== s.slot) return;
                r.disabled = !!s.full;
                if (s.full) {
                    r.checked = false;
                    r.parentNode.classList.add('is-full');
                    if (!r.parentNode.querySelector('.full-tag')) r.parentNode.insertAdjacentHTML('beforeend', '<em class="full-tag">定員に達しました</em>');
                }
            });
            if (!s.full) open++;
        });
        // 全時間帯が満席なら、フォームを閉じて案内を出す
        if (data.slots.length && open === 0) {
            form.hidden = true;
            var intro = document.querySelector('.form-intro');
            if (intro) intro.hidden = true;
            document.getElementById('js-full').hidden = false;
        } else if (radios.length) {
            var first = Array.prototype.filter.call(radios, function (r) { return !r.disabled; })[0];
            if (first) first.required = true;
        }
    }
    function loadCapacity() {
        if (!window.fetch) return Promise.resolve();
        return fetch(statusUrl, { cache: 'no-store' })
            .then(function (r) { return r.ok ? r.json() : null; })
            .then(applyCapacity)
            .catch(function () { /* 取得できなければ通常どおり（送信時にサーバー側で判定） */ });
    }
    loadCapacity();
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
                // 完了ページ（mail.php と同じフォルダの thanks.html）へ移動。GTM の送信イベントを待ってから移る
                var thanksUrl = new URL('thanks.html', form.action).href;
                var moved = false;
                var goThanks = function () { if (!moved) { moved = true; location.href = thanksUrl; } };
                window.dataLayer.push({ event: form.getAttribute('data-event') || 'lp_form_sent', eventCallback: goThanks, eventTimeout: 1500 });
                setTimeout(goThanks, 1500);
            });
        }).catch(function (err) {
            btn.disabled = false;
            var msg = String(err && err.message || '');
            var full = /^定員に達しました：/.test(msg);
            formError.textContent = full ? msg.replace(/^定員に達しました：/, '')
                : /^入力エラー/.test(msg) ? msg : '送信に失敗しました。お手数ですがお電話（0120-188-578）でご連絡ください。';
            formError.hidden = false;
            if (full) loadCapacity();
        });
    });

    // 写真・チラシの拡大表示（.js-zoom 内の画像）
    var lb = document.getElementById('js-lightbox');
    var lbImg = lb.querySelector('img');
    var items = Array.prototype.slice.call(document.querySelectorAll('.js-zoom img'));
    var cur = 0;
    var previousFocus;
    function show(i) {
        previousFocus = document.activeElement;
        cur = (i + items.length) % items.length;
        lbImg.src = items[cur].src;
        lbImg.alt = items[cur].alt;
        lb.hidden = false;
        document.body.style.overflow = "hidden";
        lb.querySelector(".lightbox_close").focus();
    }
    function close() { lb.hidden = true; document.body.style.overflow = ""; if (previousFocus) previousFocus.focus(); }
    items.forEach(function (img, i) {
        img.closest('button').addEventListener('click', function () { show(i); });
    });
    lb.querySelectorAll('.lightbox_nav').forEach(function (b) { b.hidden = items.length < 2; });
    lb.addEventListener('click', function (e) {
        if (e.target === lb || e.target.classList.contains('lightbox_close')) close();
    });
    lb.querySelector('.lightbox_nav--prev').addEventListener('click', function () { show(cur - 1); });
    lb.querySelector('.lightbox_nav--next').addEventListener('click', function () { show(cur + 1); });
    document.addEventListener('keydown', function (e) {
        if (lb.hidden) return;
        if (e.key === 'Tab' && items.length === 1) { e.preventDefault(); lb.querySelector('.lightbox_close').focus(); }
        if (e.key === 'Escape') close();
        if (e.key === 'ArrowLeft') show(cur - 1);
        if (e.key === 'ArrowRight') show(cur + 1);
    });
})();
