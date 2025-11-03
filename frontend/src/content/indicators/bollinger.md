---
title: "Bollinger Bands (20, 2σ)"
summary: "移動平均からの標準偏差バンドで価格分布を把握。"
tags:
  - volatility
  - range
order: 3
reference: "https://www.investopedia.com/terms/b/bollingerbands.asp"
---

## 概要
20期間移動平均とその上下に2σのバンドを描き、価格が統計的にどこに位置しているかを可視化します。

## 式
```
Middle = SMA_{20}(Close)
Upper = Middle + 2 * σ_{20}
Lower = Middle - 2 * σ_{20}
```

## 使い方
- バンド収縮はブレイクアウト前の圧縮サイン
- 上下バンドタッチ後のローソク足形状で反転を検証
- ATRと併用して利確/損切り幅を設計

## 注意点
> トレンドの強い局面ではバンドウォークを起こすため、逆張りを避ける。

## リンク
- [Investopedia - Bollinger Bands](https://www.investopedia.com/terms/b/bollingerbands.asp)
