const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(path.resolve('C:/CLIENTES_EXTERNO/MERCADO_ONLINE')));

// Redireciona qualquer rota não encontrada para index.html
app.use((req, res) => {
  res.sendFile(path.resolve('C:/CLIENTES_EXTERNO/MERCADO_ONLINE/index.html'));
});

app.listen(3055, '0.0.0.0', () => {
  console.log('Servidor rodando em http://controlpowerapp.com.br:3055');
});