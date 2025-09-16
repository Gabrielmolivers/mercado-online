// Cache simples em memória
let produtosCache = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

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
  let respostaEnviada = false;
  function finalizarResposta(erro, produtosProcessados) {
    if (!respostaEnviada) {
      respostaEnviada = true;
      if (erro) {
        return res.status(500).json({ success: false, error: erro });
      }
      produtosCache = produtosProcessados || [];
      cacheTimestamp = Date.now();
      const paginados = produtosCache.slice(offset, offset + limit);
      res.json({ success: true, produtos: paginados });
    }
  }
  connection.conectar((err, db) => {
    if (respostaEnviada) return;
    if (err) {
      finalizarResposta('Erro ao conectar ao banco');
      return;
    }
    db.query('SELECT PROCOD, DESCR, PRVENDA, IMAGEM FROM PRODUTOS', [], (err, result) => {
      if (respostaEnviada) { db.detach(); return; }
      if (err) {
        db.detach();
        finalizarResposta('Erro ao buscar produtos');
        return;
      }
      let produtosProcessados = [];
      let pendentes = result.length;
      let erroDetectado = false;
      if (pendentes === 0) {
        db.detach();
        finalizarResposta(null, produtosProcessados);
        return;
      }
      result.forEach(prod => {
        let imagemBase64 = '';
        let imagemTipo = '';
        if (typeof prod.IMAGEM === 'function') {
          prod.IMAGEM((err, blobBuffer) => {
            if (respostaEnviada) return;
            if (prod.PROCOD === 14725) {
              if (err) {
                console.log('Erro ao ler BLOB do produto 14725:', err);
              } else {
                console.log('Produto 14725 - callback BLOB, tamanho:', blobBuffer ? blobBuffer.length : 0);
              }
            }
            if (err && !erroDetectado) {
              erroDetectado = true;
              db.detach();
              finalizarResposta('Erro ao ler imagem do produto: ' + prod.PROCOD);
              return;
            }
            if (!erroDetectado && blobBuffer && blobBuffer.length > 0) {
              if (blobBuffer[0] === 0xFF && blobBuffer[1] === 0xD8) {
                imagemTipo = 'jpeg';
              } else if (blobBuffer[0] === 0x89 && blobBuffer[1] === 0x50) {
                imagemTipo = 'png';
              } else {
                imagemTipo = 'jpeg';
              }
              imagemBase64 = blobBuffer.toString('base64');
              // LOG: mostrar se a imagem está vindo corretamente
              console.log(`Produto ${prod.PROCOD} - IMAGEM OK: tipo=${imagemTipo}, base64Length=${imagemBase64.length}`);
              // Só envia imagem se o base64 for suficiente
              if (imagemBase64.length < 100) {
                imagemBase64 = '';
                imagemTipo = '';
                console.log(`Produto ${prod.PROCOD} - IMAGEM IGNORADA (base64 muito pequeno)`);
              }
            } else {
              // LOG: mostrar se não veio imagem
              console.log(`Produto ${prod.PROCOD} - SEM IMAGEM`);
              imagemBase64 = '';
              imagemTipo = '';
            }
            if (!erroDetectado) {
              produtosProcessados.push({
                procod: prod.PROCOD,
                nome: prod.DESCR,
                preco: prod.PRVENDA,
                imagem: imagemBase64,
                imagemTipo: imagemTipo
              });
              pendentes--;
              if (pendentes === 0) {
                db.detach();
                finalizarResposta(null, produtosProcessados);
              }
            }
          });
        } else {
          let buffer = null;
          if (prod.IMAGEM) {
            if (Buffer.isBuffer(prod.IMAGEM)) {
              buffer = prod.IMAGEM;
            } else if (typeof prod.IMAGEM === 'object' && prod.IMAGEM.buffer) {
              buffer = Buffer.from(prod.IMAGEM.buffer);
            }
            if (buffer && buffer.length > 0) {
              if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
                imagemTipo = 'jpeg';
              } else if (buffer[0] === 0x89 && buffer[1] === 0x50) {
                imagemTipo = 'png';
              } else {
                imagemTipo = 'jpeg';
              }
              imagemBase64 = buffer.toString('base64');
              // Só envia imagem se o base64 for suficiente
              if (imagemBase64.length < 100) {
                imagemBase64 = '';
                imagemTipo = '';
                console.log(`Produto ${prod.PROCOD} - IMAGEM IGNORADA (base64 muito pequeno)`);
              }
            }
          }
          if (!erroDetectado) {
            produtosProcessados.push({
              procod: prod.PROCOD,
              nome: prod.DESCR,
              preco: prod.PRVENDA,
              imagem: imagemBase64,
              imagemTipo: imagemTipo
            });
            pendentes--;
            if (pendentes === 0) {
              db.detach();
              finalizarResposta(null, produtosProcessados);
            }
          }
        }
      });
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
