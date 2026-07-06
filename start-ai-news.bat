@echo off
rem ============================================================
rem  AI News Hub ワンクリック起動スクリプト(Windows用)
rem  ダブルクリックするだけで、コードの取得から起動まで行います。
rem  必要なもの: Git と Node.js(なければ案内を表示します)
rem ============================================================
chcp 65001 >nul
setlocal

set "REPO_URL=https://github.com/kontazzz/C-Users-konta-AI-Poc.git"
set "DIR=%USERPROFILE%\ai-news-hub"

where git >nul 2>nul
if errorlevel 1 (
  echo [!] Git がインストールされていません。
  echo     ブラウザで開くダウンロードページからインストールして、もう一度実行してください。
  start https://git-scm.com/downloads/win
  pause
  exit /b 1
)

where node >nul 2>nul
if errorlevel 1 (
  echo [!] Node.js がインストールされていません。
  echo     ブラウザで開くページから LTS 版をインストールして、もう一度実行してください。
  start https://nodejs.org/ja
  pause
  exit /b 1
)

if exist "%DIR%\.git" (
  echo [1/3] 最新版に更新しています...
  git -C "%DIR%" pull origin main
) else (
  echo [1/3] アプリをダウンロードしています...
  git clone "%REPO_URL%" "%DIR%"
  if errorlevel 1 (
    echo [!] ダウンロードに失敗しました。GitHubへのログインが求められた場合は認証してください。
    pause
    exit /b 1
  )
)

cd /d "%DIR%\ai-news"

echo [2/3] 必要なパッケージをインストールしています(初回は数分かかります)...
call npm install
if errorlevel 1 (
  echo [!] インストールに失敗しました。上のエラーメッセージを確認してください。
  pause
  exit /b 1
)

echo [3/3] アプリを起動します。このウィンドウは閉じないでください。
echo       ブラウザが自動で開きます(開かない場合は http://localhost:3100 を開いてください)
start "" cmd /c "timeout /t 8 >nul & start http://localhost:3100"
call npm run dev

pause
