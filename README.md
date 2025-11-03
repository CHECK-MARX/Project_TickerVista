# TickerVista Lite

> **🚨 教育目的のデモUIです。投資判断への直接利用は避け、最新データや各種規約は必ずご自身で確認してください。**

このリポジトリは React + Vite のフロントエンドに加え、**Java (Spring Boot) API** と **Python データワーカー** を組み合わせた無料データ構成に再編しています。Docker を使わず、ローカル環境で JP/US 株の EOD データを取得 → JSON 化 → API 配信 → UI 表示までを完結できます。今回の整理で Docker 関連定義や生成物（`node_modules/` や `build/` など）はリポジトリから削除し、必要なものだけを残しています。

主な構成:
- `worker/` … Python 3.11 + requests で Stooq / Alpha Vantage から日次データを収集し、`data/` 以下に JSON を生成。
- `backend/` … Spring Boot Web API が `data/` の JSON を読み込み、`/api/v1/*` エンドポイントとして提供（既定ポートは **8085**）。
- `frontend/` … Vite + React ダッシュボード。環境変数でバックエンド URL を指定するとリアルデータを表示、未設定時はサンプルにフォールバック。
- `data/` … ワーカーが生成する EOD データ一式。バックエンド／フロント双方の参照元になります。

主な画面:
- `/` ダッシュボード: テクニカル指標とサマリー。
- `/markets`, `/sectors`: グローバル指数・セクター俯瞰。
- `/rankings`: 前日比トップ20・配当利回りトップ100のランキング。

## 📁 ディレクトリ構成

| パス | 内容 |
| --- | --- |
| `frontend/` | Vite + React クライアント。`src/data/samples/` がフォールバック用 JSON。 |
| `backend/` | Spring Boot API。`src/main/resources/application.yml` でポートやデータパスを管理。 |
| `worker/` | Python データ収集ワーカー。`UNIVERSE` 設定で銘柄を追加可能。 |
| `data/` | ワーカーが生成する実データ。バックエンドを動かす際は空でも可（実行時に作成）。 |
| `docs/` | 旧設計図や補足資料。最新構成の参考用に保持。 |

## 🧹 バージョン管理しない生成物

リポジトリはクリーンな状態に戻しており、以下の生成物は `.gitignore` で除外済みです。作業中に再生成された場合もコミット前に削除してください。

- `.venv/` などの仮想環境
- `frontend/node_modules/`, `frontend/dist/`, `frontend/.vite/`
- `backend/build/`, `backend/.gradle/`
- `worker/__pycache__/`
- `data/` 以下の実データ（必要分だけ残して運用も可）

## 🚀 クイックスタート（無料データ付き）

```bash
# 1) Python ワーカーでデータ生成
python -m venv .venv            # Windows PowerShell: py -3 -m venv .venv
# Linux/macOS: source .venv/bin/activate
# Windows PowerShell: .venv\Scripts\Activate.ps1
pip install -e worker/
python worker/fetch_market_data.py

# 2) Java バックエンドを起動 (Java 17 + Gradle)
cd backend
gradle bootRun          # Gradle が未導入なら IDE から実行しても OK

# 3) フロントエンドを起動
cd ../frontend
npm install
cp ../.env.example .env.local   # 必要に応じて値を書き換え
npm run dev -- --host            # http://localhost:5173
```

ワーカーが生成した JSON (`data/` 配下) を Spring Boot が配信し、フロントエンドから利用できます。`VITE_API_BASE_URL` を未設定にするとサンプルデータへフォールバックし、ブラウザ右上の表示は `DEMO DATA` のままとなります。バックエンドの既定ポートは `8085` なので、`.env.local` で `VITE_API_BASE_URL=http://localhost:8085` を指定してください。

## 🔧 オプション設定

| 変数 | 既定値 | 用途 |
| --- | --- | --- |
| `VITE_API_BASE_URL` | _(空文字)_ | 任意の REST API / 生成済み JSON に接続したい場合に指定。未設定ならサンプルデータを使用。 |
| `VITE_API_KEY` | `demo-key` | API 接続時に付与する `X-API-Key`。サンプル利用時は無視されます。 |

`.env.local` を `frontend/` 配下に置けば、`npm run dev` / `npm run build` の両方で適用されます。

```ini
# 例: Java バックエンドを利用する場合
VITE_API_BASE_URL=http://localhost:8085
VITE_API_KEY=demo-key

# 例: 独自 API を用意した場合
# VITE_API_BASE_URL=https://your-api.example.com
# VITE_API_KEY=your-api-key
```

## 📡 無料データパイプラインの仕組み

`npm run data:pull` で `worker/fetch_market_data.py` を呼び出し、次の処理を行います。

- **価格ソース**: Stooq の日足 CSV をダウンロードし、レート制限時は yfinance にフォールバック。最終的に取得できない銘柄は教育用の擬似データを生成します。
- **配当メタ情報**: `UNIVERSE` 内の既定値 or `ALPHA_VANTAGE_KEY` を設定した場合は Alpha Vantage `OVERVIEW` で上書き。
- **テクニカル指標**: SMA20/50・RSI14・ボリンジャーバンド・MACD をオンメモリ計算。
- **ランキング**: 前日比トップ20、配当利回りトップ100を集計（配当は静的メタデータ or Alpha Vantage `OVERVIEW` で上書き）。
- **洞察/予測**: 指標から簡易テキスト・ボラティリティコーンによる30日予測帯を生成。
- **出力**: `frontend/public/data/` に stateless な JSON として保存し、Vite 開発サーバ／ビルド成果物からそのまま配信可能。

銘柄を増やしたい場合は `worker/fetch_market_data.py` の `UNIVERSE` リストを編集して再実行するだけです（GitHub Actions などで日次スケジュール化も可能）。S&P500 の構成銘柄を自動で読み込み、最大 200 銘柄まで拡張する仕組みも含まれています。

> Alpha Vantage を併用する場合は `ALPHA_VANTAGE_KEY=<your-key>` を環境変数として設定してから `python worker/fetch_market_data.py`（または `npm run data:pull`）を実行してください（無料枠は 1 分あたり 5 コールまで）。

## 🧰 利用可能な npm スクリプト

- `npm run dev` — 開発サーバ（ホットリロード）
- `npm run build` — 型チェック + 本番ビルド
- `npm run preview` — ビルド成果物のローカルプレビュー
- `npm run lint` — ESLint による静的解析
- `npm run test:e2e` — Playwright スモークテスト（Chrome ヘッドレス）
- `npm run data:pull` — 無償ソース (Stooq + Alpha Vantage optional) から JSON を生成（内部で Python ワーカーを実行）

## 🗂 サンプルデータの仕組み

`frontend/src/data/samples/` にある JSON を `fetchJSON()` のフォールバックとして使用しています。`VITE_API_BASE_URL` が未設定、もしくはリクエストがタイムアウトした場合でも UI が破綻しないように設計されています。サンプルを差し替えたい場合は JSON を編集するだけで OK です。

## 🧪 開発のヒント

- コード整形・静的解析は ESLint + Prettier の設定に合わせてください（`npm run lint -- --fix` など）。
- 主要な状態管理は SWR + React Query ではなく、軽量なカスタムフックで実装しています。API 通信を追加したい場合は `frontend/src/hooks/` を参照してください。
- ダークモード／ライトモードは Tailwind CSS のクラスで切り替えています。UI を追加するときは既存コンポーネントのスタイルを参考にしてください。

## 📝 ライセンス

MIT License。詳細は `LICENSE` を参照してください。

---

困ったときは Issue を作成するか、`frontend/` 内のコメント・型定義を確認してください。Happy hacking! 🎯
