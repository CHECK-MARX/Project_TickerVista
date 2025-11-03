---
title: "Moving Average Convergence Divergence (MACD)"
summary: "差の移動平均でモメンタムの変化を掴むトレンドフォロー指標。"
tags:
  - trend
  - momentum
order: 2
reference: "https://www.investopedia.com/terms/m/macd.asp"
---

## 概要
MACDはEMA(12)とEMA(26)の差分であるMACDラインと、そのEMA(9)であるシグナルラインを比較し、クロスで方向転換を探ります。

## 計算式
```
MACD = EMA_{12}(Close) - EMA_{26}(Close)
Signal = EMA_{9}(MACD)
Histogram = MACD - Signal
```

## 使い方
- ゼロライン付近でのクロスはトレンド転換の初動シグナル
- ヒストグラムの縮小はモメンタム減速を示唆
- ボラティリティの高い銘柄では期間を長くしてノイズを抑える

## 注意点
> 指数移動平均は過去値に遅れるため、出来高や価格帯別出来高で裏打ちすること。

## 参考
- [Investopedia - MACD](https://www.investopedia.com/terms/m/macd.asp)
