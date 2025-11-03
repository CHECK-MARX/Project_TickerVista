---
title: "移動平均クロス戦略"
summary: "短期と長期の移動平均でトレンド転換を捉える教育用テンプレ。"
tags:
  - trend
  - template
order: 1
riskNote: "投資助言ではなく、バックテスト前提の学習素材です。"
---

## 条件式
```
IF SMA(20) crosses above SMA(50) AND RSI(14) > 55 THEN enter long
ELSE IF SMA(20) crosses below SMA(50) AND RSI(14) < 45 THEN enter short
```

## エントリー管理
- シグナル確定は終値ベース
- ダマシを避けるため出来高の20日平均比 1.2倍を推奨

## エグジット
- ATR(14) x 2 を逆行ストップ
- SMA(20) が再度 SMA(50) を下回ったら手仕舞い

## 注意書き
> {riskNote}

## メモ
- `/indicators` ページの式を活用して実装
- `/learn/risk-checklist` を併用してドローダウン制御
