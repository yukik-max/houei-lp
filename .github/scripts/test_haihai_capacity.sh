#!/bin/bash
# ハイハイレースLPの定員制御テスト（メール送信はダミー）。失敗したらデプロイを止める
set -euo pipefail
SRC="$(cd "$(dirname "$0")/../../lp2611-haihai" && pwd)"
W="$(mktemp -d)"
cp "$SRC/mail.php" "$SRC/capacity.php" "$W/"
sed -i 's/mb_send_mail(/fake_send(/' "$W/mail.php"
printf '<?php\n$TO="test@example.com"; $BCC="";\nfunction fake_send(){ return true; }\n' > "$W/mail_config.php"
cat > "$W/post.php" <<'PHP'
<?php
$_SERVER["REQUEST_METHOD"]="POST"; $_SERVER["HTTP_X_REQUESTED_WITH"]="XMLHttpRequest";
$_SERVER["SCRIPT_FILENAME"]=__DIR__."/mail.php";
$_POST=["time"=>$argv[1],"adults"=>"2名","child_name"=>"はると","name"=>"テスト","kana"=>"てすと","address"=>"x","tel"=>"1","email"=>"a@b.jp","source"=>"チラシ"];
include __DIR__."/mail.php";
PHP
cat > "$W/status.php" <<'PHP'
<?php
$_SERVER["SCRIPT_FILENAME"]=__DIR__."/capacity.php";
include __DIR__."/capacity.php";
PHP
cd "$W"
php -l mail.php >/dev/null; php -l capacity.php >/dev/null
for i in $(seq 1 20); do [ "$(php post.php '①11:00〜')" = "OK" ] || { echo "1-20組目が通らない"; exit 1; }; done
php post.php '①11:00〜' | grep -q '^定員に達しました：' || { echo "21組目が止まらない"; exit 1; }
[ "$(php post.php '②13:00〜')" = "OK" ] || { echo "②が通らない"; exit 1; }
php post.php 'bogus' | grep -q '入力エラー' || { echo "不正な時間帯が通る"; exit 1; }
for i in $(seq 1 40); do php post.php '②13:00〜' >/dev/null & done; wait
php -r '$c=json_decode(file_get_contents("data/counts.json"),true); exit(($c["①11:00〜"]===20 && $c["②13:00〜"]===20)?0:1);' || { echo "同時送信で定員超過"; cat data/counts.json; exit 1; }
php status.php | grep -q '"full":true' || { echo "空き状況が返らない"; exit 1; }
echo "定員テストOK"; cat data/counts.json; echo; php status.php; echo
