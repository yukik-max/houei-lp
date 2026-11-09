<?php
/* ハイハイレース 時間帯ごとの定員管理（ロリポップ／PHP）
 * - フォーム送信が成功するたびに、その時間帯の申込み数を data/counts.json に1つ足す
 * - 「Web申込み数 ＋ 手動調整（電話予約・キャンセル）」が定員に達した時間帯は受付を止める
 * - このファイルを直接開くと、各時間帯の空き状況を JSON で返す（フォームの表示切替用）
 */

/* 定員（各回） */
$CAPACITY = 20;

/* 時間帯（フォームの value と完全に一致させる） */
$SLOTS = ["①11:00〜", "②13:00〜"];

/* 手動調整：電話で受けた予約は ＋、キャンセルは − を入れて push（例：["①11:00〜" => 3]） */
$ADJUST = [
  "①11:00〜" => 0,
  "②13:00〜" => 0,
];

$COUNTS_FILE = __DIR__ . "/data/counts.json";

/* 申込み数ファイルを開いてロックする（排他ロック中は他の送信が待つ＝同時送信でも21組目を通さない） */
function cap_open($exclusive) {
  global $COUNTS_FILE;
  $dir = dirname($COUNTS_FILE);
  if (!is_dir($dir)) { @mkdir($dir, 0755, true); }
  $fp = @fopen($COUNTS_FILE, "c+");
  if (!$fp) { return null; }
  flock($fp, $exclusive ? LOCK_EX : LOCK_SH);
  return $fp;
}
function cap_read($fp) {
  rewind($fp);
  $raw = stream_get_contents($fp);
  $data = json_decode($raw === false ? "" : $raw, true);
  return is_array($data) ? $data : [];
}
function cap_write($fp, $data) {
  rewind($fp);
  ftruncate($fp, 0);
  fwrite($fp, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
  fflush($fp);
}
function cap_close($fp) { if ($fp) { flock($fp, LOCK_UN); fclose($fp); } }

/* 時間帯ごとの 申込み数（Web＋調整） */
function cap_taken($counts, $slot) {
  global $ADJUST;
  $web = isset($counts[$slot]) ? (int)$counts[$slot] : 0;
  $adj = isset($ADJUST[$slot]) ? (int)$ADJUST[$slot] : 0;
  return max(0, $web + $adj);
}
function cap_status($counts) {
  global $SLOTS, $CAPACITY;
  $out = [];
  foreach ($SLOTS as $s) {
    $taken = cap_taken($counts, $s);
    $out[] = ["slot" => $s, "full" => $taken >= $CAPACITY];
  }
  return $out;
}

/* 直接アクセス時：空き状況を返す（人数は出さず、満席かどうかだけ） */
if (realpath(__FILE__) === realpath($_SERVER["SCRIPT_FILENAME"])) {
  header("Content-Type: application/json; charset=UTF-8");
  header("Cache-Control: no-store");
  header("X-Robots-Tag: noindex, nofollow");
  $fp = cap_open(false);
  $counts = $fp ? cap_read($fp) : [];
  cap_close($fp);
  echo json_encode(["slots" => cap_status($counts)], JSON_UNESCAPED_UNICODE);
  exit;
}
