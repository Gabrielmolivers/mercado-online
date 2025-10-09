@echo off
REM ===============================================
REM Inicia a API do Mercado Online em PORT=3000
REM ===============================================

set PORT=3000
REM Atrás do reverse proxy (Caddy), é mais seguro expor só localmente
set HOST=127.0.0.1

REM Ajuste os domínios do seu site para CORS (separe por vírgula), ex:
set ALLOWED_ORIGINS=https://www.controlpowerapp.com.br,https://controlpowerapp.com.br
REM Se quiser testar local sem restrições, comente a linha acima e use com cautela:
REM set ALLOWED_ORIGINS=

cd /d C:\CLIENTES_EXTERNO\MERCADO_ONLINE
node server.js
