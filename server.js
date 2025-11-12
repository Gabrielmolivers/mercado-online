// Carrega variáveis de ambiente de um arquivo .env (força caminho absoluto para evitar cwd incorreto)
try {
	const path = require('path');
	const dotenvPath = path.join(__dirname, '.env');
	require('dotenv').config({ path: dotenvPath });
} catch(_) {
	console.warn('[BOOT] dotenv não carregado (ignorado).');
}
const express = require('express');
const path = require('path');
const cors = require('cors');
const app = express();
const api = require('./js/api');

// Helper para detectar URL base pública para emails/cópia
function resolvePublicBase(req){
	const envBase = process.env.APP_BASE_URL || process.env.APP_URL || process.env.WEB_URL || '';
	if (envBase) return envBase.replace(/\/$/, '');
	// Fallback monta pela requisição atual
	const host = req.headers.host || `localhost:${PORT}`;
	const proto = (req.headers['x-forwarded-proto'] || 'http');
	return `${proto}://${host}`.replace(/\/$/, '');
}

// Diagnóstico rápido de SMTP (mascara senha) e CORS
(function logBootDiagnostics(){
	const host = process.env.SMTP_HOST;
	const port = process.env.SMTP_PORT;
	const user = process.env.SMTP_USER;
	const pass = process.env.SMTP_PASS;
	if (!host || !user || !pass) {
		console.warn('[BOOT][SMTP] Incompleto. Faltando:', !host?'HOST ':'', !user?'USER ':'', !pass?'PASS ':'');
	} else {
		const maskedUser = user.replace(/^[^@]+/, m => m.length <= 2 ? '*'.repeat(m.length) : m[0] + '***' + m.slice(-1));
		console.log(`[BOOT][SMTP] OK host=${host} port=${port} user=${maskedUser} pass_len=${pass.length}`);
	}
})();

// CORS: permita o domínio do seu site hospedado (ajuste a origem abaixo)
// Use a variável de ambiente ALLOWED_ORIGINS para separar por vírgulas em produção
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '*')
	.split(',')
	.map(o => o.trim())
	.filter(Boolean);
app.use(cors({ origin: allowedOrigins.length === 1 && allowedOrigins[0] === '*' ? '*' : allowedOrigins }));

// Servir arquivos estáticos da pasta atual
app.use(express.static(__dirname));
app.use('/api', api);

// Página intermediária para copiar código e redirecionar
app.get('/copiar-codigo', (req, res) => {
	const code = String(req.query.code || '').replace(/[^0-9]/g,'');
	const email = String(req.query.email || '').trim();
	if (!code || code.length !== 6){
		return res.status(400).send('<meta charset="UTF-8"/><h2>Código inválido.</h2>');
	}
	const base = resolvePublicBase(req);
	const target = `${base}/redefinir-senha.html?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`;
	res.setHeader('Content-Type','text/html; charset=UTF-8');
	res.end(`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/><title>Código copiado</title><style>body{font-family:Arial,Helvetica,sans-serif;background:#f5f7fb;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;color:#333} .box{background:#fff;padding:32px 28px;border-radius:18px;box-shadow:0 6px 24px rgba(0,0,0,.08);max-width:460px;text-align:center} h1{font-size:1.8rem;margin:0 0 12px;color:#1657cf} p{font-size:1.2rem;margin:0 6px 10px} .code{font-size:2rem;font-weight:600;letter-spacing:4px;margin:12px 0 20px;color:#130f40} .row{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:10px} .btn{display:inline-block;background:#1657cf;color:#fff !important;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:600} .btn.secondary{background:#64748b} .small{font-size:.9rem;color:#666;margin-top:10px} </style></head><body><div class="box"><h1>Código copiado!</h1><p>Seu código foi copiado para a área de transferência.</p><div class="code">${code}</div><div class="row"><button id="copyAgain" class="btn" type="button">Copiar novamente</button><a class="btn secondary" href="${target}">Abrir página de redefinição</a></div><p class="small">Você pode fechar esta janela após colar o código onde desejar.</p></div><script>(function(){var c='${code}';function fallback(){try{var t=document.createElement('textarea');t.value=c;document.body.appendChild(t);t.select();document.execCommand('copy');t.remove();}catch(e){}}(async function(){try{if(navigator.clipboard){await navigator.clipboard.writeText(c);}else{fallback();}}catch(e){fallback();}})();document.getElementById('copyAgain').addEventListener('click', async function(){try{if(navigator.clipboard){await navigator.clipboard.writeText(c);}else{fallback();}}catch(e){fallback();}});})();</script></body></html>`);
});

// Exemplo de rota principal
app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, 'index.html'));
});

// Iniciar servidor na porta configurável
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const server = app.listen(PORT, HOST, () => {
	console.log(`Servidor Express rodando em http://${HOST}:${PORT}`);
	if (allowedOrigins) {
		console.log('CORS permitido para:', allowedOrigins);
	}
});

server.on('error', (err) => {
	if (err && err.code === 'EADDRINUSE') {
		console.error(`A porta ${PORT} já está em uso. Verifique se outro serviço está ouvindo nesta porta (ex.: Firebird na 3050) ou altere a variável de ambiente PORT.`);
	} else {
		console.error('Erro ao iniciar o servidor:', err);
	}
	process.exit(1);
});

