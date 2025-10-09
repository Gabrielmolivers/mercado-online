const express = require('express');
const path = require('path');
const cors = require('cors');
const app = express();
const api = require('./js/api');

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

