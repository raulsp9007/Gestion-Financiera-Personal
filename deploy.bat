@echo off
setlocal

set TOKEN=TU_GITHUB_TOKEN_AQUI
set REPO_URL=https://%TOKEN%@github.com/raulsp9007/Gestion-Financiera-Personal.git

echo Buscando repositorio...

cd /d "%~dp0"

:: Verificar si ya existe el repo local
if exist ".git" (
    echo Repositorio git ya inicializado.
) else (
    git init
    git remote add origin %REPO_URL%
)

:: Intentar fetch para ver el nombre de la rama principal
git fetch origin 2>nul

:: Obtener rama principal
for /f "tokens=*" %%i in ('git remote show origin 2^>nul ^| findstr "HEAD branch"') do set HEAD_LINE=%%i
echo %HEAD_LINE%

git add index.html
git commit -m "fix: category remapping - openHomeTxModal + openCustomTxModal"
git push origin HEAD:main 2>nul || git push origin HEAD:master 2>nul

echo.
echo === Deploy completado ===
pause
