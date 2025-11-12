@echo off
setlocal enabledelayedexpansion
REM ===============================================
REM Inicia a API do Mercado Online (Windows)
REM Mantém a janela aberta mesmo em caso de erro
REM ===============================================

REM Ir para a pasta deste script (independente de onde foi clicado)
cd /d "%~dp0"

REM Porta e host
set PORT=3000
set HOST=127.0.0.1

REM Domínios permitidos para CORS (ajuste conforme produção)
set ALLOWED_ORIGINS=https://www.controlpowerapp.com.br,https://controlpowerapp.com.br
REM Para ambiente de desenvolvimento sem restrição, comente acima e descomente abaixo:
REM set ALLOWED_ORIGINS=*

REM =============================
REM Configuração SMTP (Gmail) - NÃO COMMITAR SENHA EM REPOS PÚBLICO
REM =============================
set SMTP_HOST=smtp.gmail.com
set SMTP_PORT=587
set SMTP_USER=nfecontrolpower@gmail.com
set SMTP_PASS=hikwewwmphpirbum

echo Verificando dependencias...
if not exist node_modules ( echo node_modules ausente. Instalando... & call npm install )
if not exist node_modules\nodemailer ( echo nodemailer ausente. Instalando... & call npm install nodemailer )

echo Iniciando servidor em %HOST%:%PORT% ...
echo (Feche esta janela para encerrar ou CTRL+C para interromper)
node server.js

REM Se o processo encerrar (erro ou parada), manter janela aberta
echo. & echo Servidor finalizado. Codigo de saida: %errorlevel%
pause
endlocal
