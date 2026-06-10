<?php
/* ホーエーホーム 完成見学会 申込みフォーム メール送信処理（ロリポップ／PHP） */
mb_language("Japanese");
mb_internal_encoding("UTF-8");

/* 通知先はリポジトリに含めず、デプロイ時に mail_config.php で注入（GitHub Secret由来） */
$TO  = "";
$BCC = "";
$cfg = __DIR__ . "/mail_config.php";
if (is_file($cfg)) { include $cfg; }   // $TO（必須）・$BCC（任意）を定義

/* 送信元：到達性のため houei-home.jp ドメインのアドレスを使用 */
$FROM      = "no-reply@houei-home.jp";
$FROM_NAME = "ホーエーホーム見学会申込み";

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

function v($k) { return isset($_POST[$k]) ? trim((string)$_POST[$k]) : ""; }
$date = v("date"); $time = v("time"); $name = v("name"); $tel = v("tel"); $email = v("email");
$address = v("address"); $people = v("people"); $message = v("message");

/* 必須チェック */
$errors = [];
if ($date === "")  $errors[] = "希望日時";
if ($time === "")  $errors[] = "時間帯";
if ($name === "")  $errors[] = "お名前";
if ($tel === "")   $errors[] = "電話番号";
if ($email === "" || !filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = "メールアドレス";
if ($errors) { done(400, "入力エラー：" . implode("、", $errors), $isAjax); }

/* 本文 */
$body  = "ホーエーホーム 完成見学会 のお申込みがありました。\n\n";
$body .= "■ 希望日時：{$date}\n";
$body .= "■ 時間帯　：{$time}\n";
$body .= "■ お名前　：{$name}\n";
$body .= "■ 電話番号：{$tel}\n";
$body .= "■ メール　：{$email}\n";
if ($address !== "") $body .= "■ ご住所　：{$address}\n";
if ($people  !== "") $body .= "■ 来場人数：{$people}\n";
if ($message !== "") $body .= "■ ご要望　：\n{$message}\n";
$body .= "\n--------------------\n";
$body .= "送信日時：" . date("Y-m-d H:i:s") . "\n";
$body .= "ページ　：" . (isset($_SERVER["HTTP_REFERER"]) ? $_SERVER["HTTP_REFERER"] : "") . "\n";

if ($TO === "") { done(500, "送信先が未設定です。お手数ですがお電話ください。", $isAjax); }

$subject = "【見学会申込み】{$name} 様（{$date} {$time}）";
$headers  = "From: " . mb_encode_mimeheader($FROM_NAME) . " <{$FROM}>\r\n";
$headers .= "Reply-To: " . mb_encode_mimeheader($name) . " <{$email}>\r\n";
if ($BCC !== "") { $headers .= "Bcc: {$BCC}\r\n"; }

if (mb_send_mail($TO, $subject, $body, $headers)) { done(200, "OK", $isAjax); }
else { done(500, "送信に失敗しました。お手数ですがお電話ください。", $isAjax); }
