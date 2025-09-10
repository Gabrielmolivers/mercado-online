const express = require('express');
const path = require('path');
const app = express();
const api = require('./js/api');

// Servir arquivos estáticos da pasta atual
app.use(express.static(__dirname));
app.use('/api', api);

// Exemplo de rota principal
app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, 'index.html'));
});

// Iniciar servidor na porta 3000
app.listen(3000, '0.0.0.0', () => {
	console.log('Servidor Express rodando na porta 3000');
});

