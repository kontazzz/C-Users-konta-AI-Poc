@echo off
rem ============================================================
rem  AI News Hub ワンクリック起動スクリプト(Windows用)
rem  ダブルクリックするだけで、コードの取得から起動まで行います。
rem  ※このファイルは Shift_JIS(CP932)で保存すること
rem ============================================================
setlocal

set "REPO_URL=https://github.com/kontazzz/C-Users-konta-AI-Poc.git"
set "DIR=%USERPROFILE%\ai-news-hub"

where git >nul 2>nul
if errorlevel 1 goto NO_GIT

where node >nul 2>nul
if errorlevel 1 goto NO_NODE

if exist "%DIR%\.git" goto UPDATE

echo [1/3] アプリをダウンロードしています...
git clone "%REPO_URL%" "%DIR%"
if errorlevel 1 goto CLONE_FAIL
goto INSTALL

:UPDATE
echo [1/3] 最新版に更新しています...
git -C "%DIR%" pull origin main

:INSTALL
cd /d "%DIR%\ai-news"
if errorlevel 1 goto CD_FAIL

echo [2/3] 必要なパッケージをインストールしています(初回は数分かかります)...
call npm install
if errorlevel 1 goto NPM_FAIL

echo [3/3] アプリを起動します。このウィンドウは閉じないでください。
echo        ブラウザが自動で開きます(開かない場合は http://localhost:3100 を開いてください)
start "" cmd /c "timeout /t 8 >nul & start http://localhost:3100"
call npm run dev
pause
exit /b 0

:NO_GIT
echo [エラー] Git がインストールされていません。
echo          ブラウザで開くページからインストールして、もう一度このファイルを実行してください。
start https://git-scm.com/downloads/win
pause
exit /b 1

:NO_NODE
echo [エラー] Node.js がインストールされていません。
echo          ブラウザで開くページから LTS 版をインストールして、もう一度このファイルを実行してください。
start https://nodejs.org/ja
pause
exit /b 1

:CLONE_FAIL
echo [エラー] ダウンロードに失敗しました。
echo          GitHub のサインイン画面が出た場合は、ブラウザで認証してから再実行してください。
pause
exit /b 1

:CD_FAIL
echo [エラー] アプリのフォルダが見つかりませんでした: %DIR%\ai-news
pause
exit /b 1

:NPM_FAIL
echo [エラー] パッケージのインストールに失敗しました。上のエラーメッセージを確認してください。
pause
exit /b 1
