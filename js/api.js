const express = require('express');
const router = express.Router();
const connection = require('./connection');

// Rota para conectar ao banco
router.get('/conectar', (req, res) => {
  connection.conectar((err, db) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    db.detach();
    res.json({ success: true, message: 'Conectado com sucesso!' });
  });
});

// Rota para testar query
router.get('/testar-query', (req, res) => {
  connection.testarQuery((err, result) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, result });
  });
});

module.exports = router;
