@echo off
rem ===========================================================
rem  alimtalk - save and push to GitHub (double-click to run)
rem  KEEP THIS FILE ASCII-ONLY. Korean text lives in dev\*.txt
rem  After the push, Netlify deploys alimtalk.kr by itself.
rem ===========================================================
"%SystemRoot%\System32\chcp.com" 65001 >nul
title alimtalk - GitHub
cd /d "%~dp0"
"%SystemRoot%\System32\where.exe" git >nul 2>nul
if errorlevel 1 goto NOGIT
type dev\push-hello.txt
echo.
rem  First run on a new PC: tell Git who is saving (stored in this folder only)
for /f "delims=" %%e in ('git config user.email') do set GITMAIL=%%e
if not defined GITMAIL git config user.name "tax0213-sanghee"
if not defined GITMAIL git config user.email "tax0213@gmail.com"
git add -A
git diff --cached --quiet
if errorlevel 1 goto COMMIT
goto PUSH
:COMMIT
git commit -m "update %date% %time:~0,5%"
if errorlevel 1 goto FAILED
:PUSH
git push -u origin main
if errorlevel 1 goto FAILED
echo.
type dev\push-done.txt
echo.
pause
exit /b 0
:FAILED
echo.
type dev\push-failed.txt
echo.
pause
exit /b 1
:NOGIT
echo.
type dev\push-nogit.txt
echo.
pause
exit /b 1
