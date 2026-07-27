/* ホーエーホーム 展示場見学 LP — 実働スクリプト */
(function () {
  'use strict';

  /* ===========================================================
   *  申込みフォームの送信先。
   *  同フォルダの mail.php（ロリポップ／PHP）が申込み内容を
   *  指定メールアドレスへ送信します。
   *  ※GitHub Pagesプレビューでは動きません（PHP非対応）。
   *    本番 houei-home.jp/lp-model2607/ で動作します。
   * =========================================================== */
  var FORM_ENDPOINT = "mail.php";

  // PHPからのリダイレクト（JSが使われなかった場合の保険）で完了表示
  if (/[?&]sent=1/.test(location.search)) {
    var _f = document.getElementById('reserveForm');
    var _t = document.getElementById('thanks');
    if (_f) _f.hidden = true;
    if (_t) _t.hidden = false;
  }

  /* ---- 追従ナビ：一定スクロールで出現 ---- */
  var nav = document.getElementById('siteNav');
  var floatCta = document.getElementById('floatCta');
  function onScroll() {
    var y = window.pageYOffset || document.documentElement.scrollTop;
    if (nav) nav.classList.toggle('visible', y > 520);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---- 固定CTA：フォームが見えている間は隠す ---- */
  var formSec = document.getElementById('form');
  if (floatCta && formSec && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { floatCta.classList.toggle('hide', e.isIntersecting); });
    }, { rootMargin: '0px 0px -40% 0px' });
    io.observe(formSec);
  }

  /* ---- 予約希望日カレンダー：本日より前は選択不可 ---- */
  var dateInput = document.getElementById('dateInput');
  if (dateInput && !dateInput.min) {
    var _d = new Date();
    var _pad = function (n) { return (n < 10 ? '0' : '') + n; };
    dateInput.min = _d.getFullYear() + '-' + _pad(_d.getMonth() + 1) + '-' + _pad(_d.getDate());
  }

  /* ---- 任意項目の開閉 ---- */
  var toggle = document.getElementById('optToggle');
  var body = document.getElementById('optBody');
  if (toggle && body) {
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      body.hidden = open;
    });
  }

  /* ---- 時間帯「その他」：選択したときだけ自由記入欄を出す ---- */
  var timeOtherRadio = document.getElementById('timeOther');
  var timeOtherWrap = document.getElementById('timeOtherWrap');
  var timeOtherInput = document.getElementById('timeOtherInput');
  function syncTimeOther(focus) {
    if (!timeOtherWrap) return;
    var on = !!(timeOtherRadio && timeOtherRadio.checked);
    timeOtherWrap.hidden = !on;
    if (on && focus && timeOtherInput) timeOtherInput.focus();
  }
  Array.prototype.forEach.call(document.querySelectorAll('input[name="time"]'), function (r) {
    r.addEventListener('change', function () { syncTimeOther(true); });
  });
  syncTimeOther(false);

  /* ---- フォーム検証＆送信 ---- */
  var form = document.getElementById('reserveForm');
  var thanks = document.getElementById('thanks');
  var errSummary = document.getElementById('errSummary');
  if (!form) return;

  function showError(msg) {
    if (!errSummary) return;
    errSummary.textContent = msg;
    errSummary.hidden = false;
  }
  function clearError() { if (errSummary) errSummary.hidden = true; }

  function validate() {
    clearError();
    var problems = [];
    var labels = { name: 'お名前', tel: '電話番号', email: 'メールアドレス' };

    // 必須ラジオ
    if (!form.querySelector('input[name="venue"]:checked')) problems.push('会場');
    if (!form.querySelector('input[name="time"]:checked')) problems.push('時間帯');

    // 時間帯「その他」を選んだときは自由記入欄も必須
    if (timeOtherInput) {
      timeOtherInput.classList.remove('invalid');
      if (timeOtherRadio && timeOtherRadio.checked && !timeOtherInput.value.trim()) {
        timeOtherInput.classList.add('invalid');
        problems.push('ご希望の時間帯（その他）');
      }
    }

    // 予約希望日（カレンダー）
    var dateEl = form.elements['date'];
    if (dateEl) {
      dateEl.classList.remove('invalid');
      if (!dateEl.value) { dateEl.classList.add('invalid'); problems.push('予約希望日'); }
    }

    // 必須テキスト（未入力チェック）
    ['name', 'tel', 'email'].forEach(function (n) {
      var el = form.elements[n];
      el.classList.remove('invalid');
      if (!el.value.trim()) {
        el.classList.add('invalid');
        problems.push(labels[n]);
      }
    });

    // メール形式
    var email = form.elements['email'];
    if (email.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
      email.classList.add('invalid');
      problems.push('メールアドレス（形式）');
    }
    // 電話番号（数字9桁以上）
    var tel = form.elements['tel'];
    if (tel.value.trim() && tel.value.replace(/[^0-9]/g, '').length < 9) {
      tel.classList.add('invalid');
      problems.push('電話番号（形式）');
    }

    if (problems.length) {
      showError('次の項目をご確認ください：' + problems.join('、'));
      return false;
    }
    return true;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    // ハニーポット（bot対策）
    if (form.elements['_gotcha'] && form.elements['_gotcha'].value) return;
    if (!validate()) {
      var firstBad = form.querySelector('.invalid') || errSummary;
      if (firstBad && firstBad.scrollIntoView) firstBad.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    var btn = form.querySelector('.submit');
    var done = function () {
      form.hidden = true;
      if (thanks) thanks.hidden = false;
      if (thanks && thanks.scrollIntoView) thanks.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    if (!FORM_ENDPOINT) {
      console.warn('[reserveForm] FORM_ENDPOINT が未設定です。実際には送信されていません（プレビュー表示のみ）。main.js の FORM_ENDPOINT に送信先URLを設定してください。');
      done();
      return;
    }

    if (btn) { btn.disabled = true; btn.textContent = '送信中…'; }
    fetch(FORM_ENDPOINT, {
      method: 'POST',
      body: new FormData(form),
      headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' }
    }).then(function (res) {
      if (!res.ok) throw new Error('status ' + res.status);
      done();
    }).catch(function (err) {
      console.error(err);
      showError('送信に失敗しました。時間をおいて再度お試しいただくか、お電話でお問い合わせください。');
      if (btn) { btn.disabled = false; btn.textContent = 'この内容で予約する'; }
    });
  });
})();
