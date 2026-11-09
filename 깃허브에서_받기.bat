@echo off
rem ===========================================================
rem  alimtalk - pull from GitHub (double-click to run)
rem  KEEP THIS FILE ASCII-ONLY. --ff-only: stops instead of half-merging.
rem ===========================================================
"%SystemRoot%\System32\chcp.com" 65001 >nul
title alimtalk - GitHub
cd /d "%~dp0"
"%SystemRoot%\System32\where.exe" git >nul 2>nul
if errorlevel 1 goto NOGIT
type dev\pull-hello.txt
echo.
for /f "delims=" %%a in ('git status --porcelain') do goto DIRTY
git pull --ff-only origin main
if errorlevel 1 goto FAILED
echo.
type dev\pull-done.txt
echo.
pause
exit /b 0
:DIRTY
echo.
type dev\pull-dirty.txt
echo.
pause
exit /b 1
:FAILED
echo.
type dev\pull-failed.txt
echo.
pause
exit /b 1
:NOGIT
echo.
type dev\push-nogit.txt
echo.
pause
exit /b 1
