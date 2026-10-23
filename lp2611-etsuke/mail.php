<?php
/* ホーエーホーム キャンペーンLP 申込みフォーム メール送信処理（ロリポップ／PHP） */
mb_language("Japanese");
mb_internal_encoding("UTF-8");

/* キャンペーン名（件名・本文に使用） */
$CAMPAIGN = "有田焼絵付け体験";

/* 通知先はリポジトリに含めず、デプロイ時に mail_config.php で注入（GitHub Secret由来） */
$TO  = "";
$BCC = "";
$cfg = __DIR__ . "/mail_config.php";
if (is_file($cfg)) { include $cfg; }   // $TO（必須）・$BCC（任意）を定義

/* 送信元：到達性のため houei-home.jp ドメインのアドレスを使用 */
$FROM      = "no-reply@houei-home.jp";
$FROM_NAME = "ホーエーホーム{$CAMPAIGN}申込み";

if ($_SERVER["REQUEST_METHOD"] !== "POST") { http_response_code(405); exit("Method Not Allowed"); }

$isAjax = (isset($_SERVER["HTTP_X_REQUESTED_WITH"]) && strtolower($_SERVER["HTTP_X_REQUESTED_WITH"]) === "xmlhttprequest")
       || (isset($_SERVER["HTTP_ACCEPT"]) && strpos($_SERVER["HTTP_ACCEPT"], "application/json") !== false);

function done($code, $msg, $isAjax) {
  if ($isAjax) { http_response_code($code); echo $msg; }
  else {
    if ($code === 200) { header("Location: ./?sent=1#form"); }
    else { http_response_code($code); echo "<meta charset=utf-8>" . htmlspecialchars($msg) . "<br><a href='./#form'>戻る</a>"; }
  }
  exit;
}

/* スパム対策（ハニーポット） */
if (!empty($_POST["_gotcha"])) { done(200, "OK", $isAjax); }

/* 改行を除去（メールヘッダへの混入防止）。自由記入欄のみ改行を残す */
function v($k) { return isset($_POST[$k]) ? trim(str_replace(["\r", "\n"], " ", (string)$_POST[$k])) : ""; }
$date = v("date"); $time = v("time"); $adults = v("adults"); $kids = v("kids"); $ages = v("ages");
$name = v("name"); $kana = v("kana"); $tel = v("tel"); $email = v("email"); $source = v("source");
$message = isset($_POST["message"]) ? trim((string)$_POST["message"]) : "";

/* 必須チェック */
$errors = [];
if ($time === "")   $errors[] = "ご希望の時間帯";
if ($adults === "") $errors[] = "参加人数（大人）";
if ($name === "")   $errors[] = "お名前";
if ($kana === "")   $errors[] = "ふりがな";
if ($tel === "")    $errors[] = "電話番号";
if ($email === "" || !filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = "メールアドレス";
if ($source === "") $errors[] = "お申込みのきっかけ";
if ($errors) { done(400, "入力エラー：" . implode("、", $errors), $isAjax); }

/* 本文 */
$body  = "ホーエーホーム {$CAMPAIGN}（久留米展示場）のご予約がありました。\n\n";
$body .= "■ 開催日　　　：{$date}\n";
$body .= "■ 時間帯　　　：{$time}\n";
$body .= "■ 参加人数　　：大人 {$adults}／お子さま " . ($kids !== "" ? $kids : "0名") . "\n";
if ($ages !== "") $body .= "■ お子さまの年齢：{$ages}\n";
$body .= "■ お名前　　　：{$name}\n";
$body .= "■ ふりがな　　：{$kana}\n";
$body .= "■ 電話番号　　：{$tel}\n";
$body .= "■ メール　　　：{$email}\n";
$body .= "■ きっかけ　　：{$source}\n";
if ($message !== "") $body .= "■ ご質問・ご要望：\n{$message}\n";
$body .= "\n--------------------\n";
$body .= "送信日時：" . date("Y-m-d H:i:s") . "\n";
$body .= "ページ　：" . (isset($_SERVER["HTTP_REFERER"]) ? $_SERVER["HTTP_REFERER"] : "") . "\n";

if ($TO === "") { done(500, "送信先が未設定です。お手数ですがお電話ください。", $isAjax); }

$subject = "【{$CAMPAIGN}予約】{$name} 様（{$time}）";
$headers  = "From: " . mb_encode_mimeheader($FROM_NAME) . " <{$FROM}>\r\n";
$headers .= "Reply-To: " . mb_encode_mimeheader($name) . " <{$email}>\r\n";
if ($BCC !== "") { $headers .= "Bcc: {$BCC}\r\n"; }

if (mb_send_mail($TO, $subject, $body, $headers)) { done(200, "OK", $isAjax); }
else { done(500, "送信に失敗しました。お手数ですがお電話ください。", $isAjax); }
