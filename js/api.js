
const express = require('express');
const router = express.Router();
const connection = require('./connection');

// Rota para cadastro de novo cliente
router.post('/cadastro', express.json(), (req, res) => {
  connection.conectar((err, db) => {
    if (err) {
      return res.status(500).json({ success: false, error: 'Erro ao conectar ao banco' });
    }
    db.query('SELECT MAX(ID) AS MAX_ID FROM CLIENTES', (err, result) => {
      if (err) {
        db.detach();
        return res.status(500).json({ success: false, error: 'Erro ao buscar último ID' });
      }
      const novoId = (result[0].MAX_ID || 0) + 1;
      const {
        nome, email, endereco, bairro, numero, complemento,
  cidade, estado, cep, celular, senha, dtcadastro
      } = req.body;
      db.query(
        'INSERT INTO CLIENTES (ID, NOMECLI, EMAIL, ENDERECO, BAIRRO, NUMERO, REFERENCIA, CIDADE, UF, CEP, CELULAR, SENHA, DTCADASTRO) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          parseInt(novoId), nome, email, endereco, bairro, numero, complemento,
          cidade, estado, cep, celular, senha, dtcadastro
        ],
        (err) => {
          db.detach();
          if (err) {
            console.error('Erro ao inserir cliente:', err);
            return res.status(500).json({ success: false, error: err.message });
          }
          res.json({ success: true, id: novoId });
        }
      );
    });
  });
});

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


module.exports = router;
