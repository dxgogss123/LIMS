@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ==========================================
echo   项目开发环境一键检测与初始化脚本
echo ==========================================
echo.

:: 1. 检测 Node.js
echo [1/4] 检测 Node.js 环境...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 未检测到 Node.js，请先安装 nvm-windows 或 Node.js LTS
    echo    下载地址: https://nodejs.org/ 或 https://github.com/coreybutler/nvm-windows/releases
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
echo ✅ Node.js 已安装: %NODE_VER%

:: 2. 检测 pnpm（可在此处修改为你项目实际使用的包管理器）
echo [2/4] 检测 pnpm 包管理器...
where pnpm >nul 2>nul
if %errorlevel% neq 0 (
    echo ⚠️  未检测到 pnpm，正在通过 corepack 自动启用...
    where corepack >nul 2>nul
    if !errorlevel! neq 0 (
        echo ❌ corepack 也不可用，请手动安装: npm install -g pnpm
        pause
        exit /b 1
    )
    call corepack enable
    call corepack prepare pnpm@latest --activate
    if !errorlevel! neq 0 (
        echo ❌ pnpm 自动启用失败，请手动安装
        pause
        exit /b 1
    )
    echo ✅ pnpm 已通过 corepack 自动启用
) else (
    for /f "tokens=*" %%i in ('pnpm -v') do set PNPM_VER=%%i
    echo ✅ pnpm 已安装: v!PNPM_VER!
)

:: 3. 检测并安装依赖
echo [3/4] 检测项目依赖完整性...
if not exist "node_modules" (
    echo ⚠️  node_modules 不存在，正在安装依赖...
    call pnpm install --frozen-lockfile
    if !errorlevel! neq 0 (
        echo ❌ 依赖安装失败，请检查网络或锁文件
        pause
        exit /b 1
    )
    echo ✅ 依赖安装完成
) else (
    echo ✅ node_modules 已存在，跳过安装
    echo 💡 如需强制重装，请删除 node_modules 后重新运行此脚本
)

:: 4. 检测环境变量文件
echo [4/4] 检测环境变量配置...
if not exist ".env.local" (
    if exist ".env.example" (
        echo ⚠️  .env.local 不存在，已从 .env.example 复制模板
        copy ".env.example" ".env.local" >nul
        echo ✅ 已创建 .env.local，请根据需要修改其中的配置值
    ) else (
        echo ⚠️  .env.local 和 .env.example 均不存在
        echo    请手动创建 .env.local 并配置所需环境变量
    )
) else (
    echo ✅ .env.local 已存在
)

echo.
echo ==========================================
echo   ✅ 环境检测完成！
echo   启动开发服务器: pnpm dev
echo ==========================================
pause