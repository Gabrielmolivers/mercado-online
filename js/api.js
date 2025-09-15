// Cache simples em memória
let produtosCache = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hora

const express = require('express');
const router = express.Router();
const connection = require('./connection');


// Rota para buscar produtos
router.get('/produtos', (req, res) => {
  const offset = parseInt(req.query.offset) || 0;
  const limit = parseInt(req.query.limit) || 20;
  const now = Date.now();
  // Se cache válido, retorna do cache
  if (produtosCache && (now - cacheTimestamp < CACHE_TTL)) {
    const paginados = produtosCache.slice(offset, offset + limit);
    return res.json({ success: true, produtos: paginados });
  }
  connection.conectar((err, db) => {
    if (err) {
      return res.status(500).json({ success: false, error: 'Erro ao conectar ao banco' });
    }
    db.query('SELECT PROCOD, DESCR, PRVENDA, IMAGEM FROM PRODUTOS', [], (err, result) => {
      if (err) {
        db.detach();
        return res.status(500).json({ success: false, error: 'Erro ao buscar produtos' });
      }
      // Converter BLOB para base64
      produtosCache = result.map(prod => {
        let imagemBase64 = '';
        if (prod.IMAGEM) {
          if (Buffer.isBuffer(prod.IMAGEM)) {
            imagemBase64 = prod.IMAGEM.toString('base64');
          } else if (typeof prod.IMAGEM === 'object' && prod.IMAGEM.buffer) {
            imagemBase64 = Buffer.from(prod.IMAGEM.buffer).toString('base64');
          }
        }
        return {
          procod: prod.PROCOD,
          nome: prod.DESCR,
          preco: prod.PRVENDA,
          imagem: imagemBase64
        };
      });
      cacheTimestamp = Date.now();
      db.detach();
      const paginados = produtosCache.slice(offset, offset + limit);
      res.json({ success: true, produtos: paginados });
    });
  });
});



// Rota para cadastro de novo cliente
router.post('/cadastro', express.json(), (req, res) => {
  connection.conectar((err, db) => {
    if (err) {
      return res.status(500).json({ success: false, error: 'Erro ao conectar ao banco' });
    }
    const { email } = req.body;
    db.query('SELECT ID FROM CLIENTES WHERE EMAIL = ?', [email], (err, result) => {
      if (err) {
        db.detach();
        return res.status(500).json({ success: false, error: 'Erro ao verificar email' });
      }
      if (result.length > 0) {
        db.detach();
        return res.status(400).json({ success: false, error: 'EMAIL JÁ CADASTRADO' });
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
