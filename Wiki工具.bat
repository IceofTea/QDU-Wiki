@echo off
chcp 936 >nul
title QDU-Wiki 智能工具箱
color 0B
mode con: cols=76 lines=28
:menu
cls
echo.
echo   ============================================================
echo                     QDU-Wiki 智能工具箱
echo   ============================================================
echo.
echo    [1]  本地预览（mkdocs serve + 浏览器自动打开）
echo    [2]  一键换校（customize_wiki.py 可视化配置说明）
echo    [3]  打开线上百科（GitHub Pages）
echo    [4]  打开导航站（跨站智能体联动）
echo    [5]  重建知识库（scripts/build_kb.py）
echo    [6]  构建站点（mkdocs build）
echo    [0]  退出
echo.
echo   ============================================================
set /p choice=  请输入数字后回车:
if "%choice%"=="1" goto serve
if "%choice%"=="2" goto rebrand
if "%choice%"=="3" goto online
if "%choice%"=="4" goto nav
if "%choice%"=="5" goto kb
if "%choice%"=="6" goto build
if "%choice%"=="0" exit
goto menu

:serve
echo.
echo   启动本地预览（新窗口）...
start "mkdocs" cmd /c "python -m mkdocs serve -a 127.0.0.1:8010"
ping -n 6 127.0.0.1 >nul
echo   打开浏览器（注意本地挂在 /QDU-Wiki/ 子路径）...
start "" "http://127.0.0.1:8010/QDU-Wiki/"
echo.
echo   提示：每页底部可发评论 / 划选正文加段落批注；
echo         连点标题旁的评论徽章 5 次可进入管理台暗门。
pause
goto menu

:rebrand
echo.
echo   Wiki 一键换校（JSON 配置模式，先编辑配置再执行）：
echo.
echo     python customize_wiki.py                     交互式
echo     python customize_wiki.py --config templates\xxx.json
echo.
echo   配置字段：university / shortName / siteName / agentName /
echo            siteUrl / repoUrl / navUrl / tiebaUrl
echo   落点：mkdocs.yml 站名与链接 + chat-widget 跨站直达与智能体名
echo.
set /p runnow=  现在就运行交互式换校吗？(y/n):
if /i "%runnow%"=="y" python customize_wiki.py
pause
goto menu

:online
start "" "https://iceoftea.github.io/QDU-Wiki/"
goto menu

:nav
start "" "https://iceoftea.github.io/QDU-Nav/"
goto menu

:kb
python scripts\build_kb.py
pause
goto menu

:build
python -m mkdocs build
pause
goto menu
