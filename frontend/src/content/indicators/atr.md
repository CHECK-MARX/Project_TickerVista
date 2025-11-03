---
title: "Average True Range (ATR)"
summary: "高値-安値にギャップを加味したボラティリティ指標。"
tags:
  - volatility
  - risk
order: 4
reference: "https://www.investopedia.com/terms/a/atr.asp"
---

## 概要
ATRは一定期間のトゥルーレンジ(TR)を平均化し、価格変動幅をシンプルに把握できます。ストップ幅やポジションサイズ決定に役立ちます。

## 式
```
TR = max(
  High - Low,
  |High - PrevClose|,
  |Low - PrevClose|
)
ATR = SMA_{n}(TR)
```

## 使い方
- ATRの倍数で損切り幅を設定
- トレーリングストップやケルトナーチャネルの計算に利用
- アセット間比較で相対的なリスクを把握

## 注意点
> 単位は価格と同じであり、割合ではないため、ATR/価格で相対値を見ると良い。

## 参考
- [Investopedia - ATR](https://www.investopedia.com/terms/a/atr.asp)
