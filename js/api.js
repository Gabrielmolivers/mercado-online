const express = require('express');
const router = express.Router();
const connection = require('./connection');

// Util: validação de CPF/CNPJ
function validateCPF(cpf) {
  if (!cpf) return false;
  const s = String(cpf).replace(/\D/g, '');
  if (s.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(s)) return false; // repetidos
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(s.charAt(i), 10) * (10 - i);
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(s.charAt(9), 10)) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(s.charAt(i), 10) * (11 - i);
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  return rev === parseInt(s.charAt(10), 10);
}

function validateCNPJ(cnpj) {
  if (!cnpj) return false;
  const s = String(cnpj).replace(/\D/g, '');
  if (s.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(s)) return false; // repetidos
  const calc = (base) => {
    const pesos = base === 12 ? [5,4,3,2,9,8,7,6,5,4,3,2] : [6,5,4,3,2,9,8,7,6,5,4,3,2];
    let soma = 0;
    for (let i = 0; i < pesos.length; i++) soma += parseInt(s.charAt(i), 10) * pesos[i];
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  const d1 = calc(12);
  if (d1 !== parseInt(s.charAt(12), 10)) return false;
  const d2 = calc(13);
  return d2 === parseInt(s.charAt(13), 10);
}

// Healthcheck simples (não toca no banco)
router.get('/healthz', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// Rota de login
router.post('/login', express.json(), (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) {
    return res.status(400).json({ success: false, error: 'Email e senha obrigatórios.' });
  }
  connection.conectar((err, db) => {
    if (err) {
      return res.status(500).json({ success: false, error: 'Erro ao conectar ao banco.' });
    }
    db.query('SELECT ID, NOMECLI, EMAIL FROM CLIENTES WHERE EMAIL = ? AND SENHA = ?', [email, senha], (err, result) => {
      db.detach(() => {});
      if (err) {
        return res.status(500).json({ success: false, error: 'Erro ao buscar usuário.' });
      }
      if (result.length === 0) {
        return res.status(401).json({ success: false, error: 'Email ou senha inválidos.' });
      }
      // Retorna dados básicos do usuário
      res.json({ success: true, usuario: { id: result[0].ID, nome: result[0].NOMECLI, email: result[0].EMAIL } });
    });
  });
});
// Cache simples em memória
let produtosCache = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos
// Cache de categorias
let categoriasCache = null;
let categoriasCacheAt = 0;

// ...existing code...
// Rota para buscar dados completos do cliente
router.get('/cliente/:id', (req, res) => {
  const id = req.params.id;
  if (!id) return res.status(400).json({ success: false, error: 'ID obrigatório.' });
  connection.conectar((err, db) => {
    if (err) return res.status(500).json({ success: false, error: 'Erro ao conectar ao banco.' });
    db.query('SELECT ENDERECO, BAIRRO, NUMERO FROM CLIENTES WHERE ID = ?', [id], (err, result) => {
      db.detach(() => {});
      if (err) return res.status(500).json({ success: false, error: 'Erro ao buscar cliente.' });
      if (!result || result.length === 0) return res.status(404).json({ success: false, error: 'Cliente não encontrado.' });
      res.json({ success: true, cliente: result[0] });
    });
  });
});

// Atualizar dados do cliente (não altera EMAIL)
router.put('/cliente/:id', express.json(), (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ success: false, error: 'ID obrigatório' });
  const body = req.body || {};
  // Normalização e validação de CPF/CNPJ, se enviados
  if (Object.prototype.hasOwnProperty.call(body, 'cpf') && body.cpf !== undefined && body.cpf !== null && String(body.cpf).trim() !== '') {
    body.cpf = String(body.cpf).replace(/\D/g, '');
    if (!validateCPF(body.cpf)) {
      return res.status(400).json({ success: false, error: 'CPF inválido' });
    }
  }
  if (Object.prototype.hasOwnProperty.call(body, 'cnpj') && body.cnpj !== undefined && body.cnpj !== null && String(body.cnpj).trim() !== '') {
    body.cnpj = String(body.cnpj).replace(/\D/g, '');
    if (!validateCNPJ(body.cnpj)) {
      return res.status(400).json({ success: false, error: 'CNPJ inválido' });
    }
  }
  // Campos permitidos (EMAIL não pode)
  const camposMap = {
    nome: 'NOMECLI',
    endereco: 'ENDERECO',
    bairro: 'BAIRRO',
    estado: 'UF',
    uf: 'UF',
    cep: 'CEP',
    celular: 'CELULAR',
    telefone: 'CELULAR',
    cpf: 'CPF',
    cnpj: 'CNPJ'
  };
  const sets = [];
  const values = [];
  Object.keys(camposMap).forEach(k => {
    if (Object.prototype.hasOwnProperty.call(body, k) && body[k] !== undefined) {
      sets.push(`${camposMap[k]} = ?`);
      values.push(body[k]);
    }
  });
  if (sets.length === 0) {
    return res.status(400).json({ success: false, error: 'Nenhum campo para atualizar.' });
  }
  values.push(id);
  connection.conectar((err, db) => {
    if (err) return res.status(500).json({ success: false, error: 'Erro ao conectar ao banco.' });
    const sql = `UPDATE CLIENTES SET ${sets.join(', ')} WHERE ID = ?`;
    db.query(sql, values, (err) => {
      db.detach(() => {});
      if (err) return res.status(500).json({ success: false, error: 'Erro ao atualizar cliente.' });
      res.json({ success: true });
    });
  });
});


// Rota para buscar produtos
router.get('/produtos', (req, res) => {
  const offset = parseInt(req.query.offset) || 0;
  const limit = parseInt(req.query.limit) || 20;
  const search = (req.query.search || '').toLowerCase();
  const codgrpFilter = req.query.codgrp ? parseInt(req.query.codgrp) : null;
  const now = Date.now();
  const skipCache = (typeof req.query._ !== 'undefined') || req.query.nocache === '1';
  if (!skipCache && produtosCache && (now - cacheTimestamp < CACHE_TTL)) {
    let filtrados = produtosCache;
    if (search) {
      filtrados = produtosCache.filter(prod => prod.nome && prod.nome.toLowerCase().includes(search));
    }
    if (codgrpFilter) {
      filtrados = filtrados.filter(p => parseInt(p.codgrp) === codgrpFilter);
    }
    const paginados = filtrados.slice(offset, offset + limit);
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
  let filtrados = produtosCache;
  if (search) {
    filtrados = produtosCache.filter(prod => prod.nome && prod.nome.toLowerCase().includes(search));
  }
  if (codgrpFilter) {
    filtrados = filtrados.filter(p => parseInt(p.codgrp) === codgrpFilter);
  }
  const paginados = filtrados.slice(offset, offset + limit);
  res.json({ success: true, produtos: paginados });
    }
  }
  connection.conectar((err, db) => {
    if (respostaEnviada) return;
    if (err) {
      finalizarResposta('Erro ao conectar ao banco');
      return;
    }
    const sqlCompleto = 'SELECT PROCOD, DESCR, PRVENDA, IMAGEM, UND, CODGRP, NOMGRU, INPROMO, FIMPROMO, VALORPROMO FROM PRODUTOS';
    const sqlBasico   = 'SELECT PROCOD, DESCR, PRVENDA, IMAGEM, UND, CODGRP, NOMGRU FROM PRODUTOS';

    function executarProcessamento(result, temCamposPromo){
        let produtosProcessados = [];
        let pendentes = result.length;
        let erroDetectado = false;
        if (pendentes === 0) {
          db.detach();
          finalizarResposta(null, produtosProcessados);
          return;
        }
        // Helper: parse data possivelmente no formato 'DD.MM.AAAA' ou Date
        function toDate(d) {
          if (!d) return null;
          if (d instanceof Date) return d;
          let dt = new Date(d);
          if (!isNaN(dt)) return dt;
          const s = String(d);
          // aceita DD.MM.AAAA, DD/MM/AAAA ou DD-MM-AAAA, com horário opcional após espaço
          let m = s.match(/^(\d{2})[\.\/\-](\d{2})[\.\/\-](\d{4})(?:\s+.*)?$/);
          if (m) {
            dt = new Date(`${m[3]}-${m[2]}-${m[1]}`);
            if (!isNaN(dt)) return dt;
          }
          return null;
        }
          // Helper: parse número possivelmente no formato brasileiro (ex: '5,99')
          function toNumber(n) {
            if (n === null || n === undefined) return NaN;
            if (typeof n === 'number') return n;
            const s = String(n).replace(',', '.');
            const v = Number(s);
            return isNaN(v) ? NaN : v;
          }
        result.forEach(prod => {
          // Promoção (se disponível)
          const now = new Date();
          const iniPromoDate = temCamposPromo ? toDate(prod.INPROMO) : null;
          const fimPromoDate = temCamposPromo ? toDate(prod.FIMPROMO) : null;
            const valorPromo = temCamposPromo && (prod.VALORPROMO !== null && prod.VALORPROMO !== undefined) ? toNumber(prod.VALORPROMO) : NaN;
            const precoBase = toNumber(prod.PRVENDA || 0);
            const promoAtivo = !!(
              temCamposPromo &&
              !isNaN(valorPromo) && valorPromo > 0 &&
              fimPromoDate && fimPromoDate >= now &&
              (!iniPromoDate || iniPromoDate <= now) &&
              !isNaN(precoBase) && valorPromo < precoBase
            );
            // Sempre envie o valor de promoção quando existir (>0), mesmo que não esteja ativo,
            // para permitir fallback no frontend; a exibição dependerá de promoAtivo/datas
            const precoPromo = (!isNaN(valorPromo) && valorPromo > 0) ? valorPromo : null;
          const descontoPerc = promoAtivo && precoBase > 0 ? Math.max(1, Math.min(99, Math.round((1 - (precoPromo / precoBase)) * 100))) : 0;

          let imagemBase64 = '';
          let imagemTipo = '';
          if (typeof prod.IMAGEM === 'function') {
            prod.IMAGEM((err, blobBuffer) => {
              if (respostaEnviada) return;
              if (err) {
                imagemBase64 = '';
                imagemTipo = '';
              } else if (blobBuffer && blobBuffer.length > 0) {
                if (blobBuffer[0] === 0xFF && blobBuffer[1] === 0xD8) imagemTipo = 'jpeg';
                else if (blobBuffer[0] === 0x89 && blobBuffer[1] === 0x50) imagemTipo = 'png';
                else imagemTipo = 'jpeg';
                imagemBase64 = blobBuffer.toString('base64');
                if (imagemBase64.length < 100) { imagemBase64 = ''; imagemTipo = ''; }
              } else {
                imagemBase64 = '';
                imagemTipo = '';
              }
              if (!erroDetectado) {
                produtosProcessados.push({
                  procod: prod.PROCOD,
                  nome: prod.DESCR,
                    preco: precoBase,
                  und: prod.UND,
                  codgrp: prod.CODGRP,
                  grupo: prod.NOMGRU,
                  imagem: imagemBase64,
                  imagemTipo: imagemTipo,
                  promoAtivo: promoAtivo,
                  precoPromo: precoPromo,
                  inipromo: iniPromoDate ? iniPromoDate.toISOString().slice(0,10) : null,
                  fimpromo: fimPromoDate ? fimPromoDate.toISOString().slice(0,10) : null,
                  descontoPerc: descontoPerc
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
              if (Buffer.isBuffer(prod.IMAGEM)) buffer = prod.IMAGEM;
              else if (typeof prod.IMAGEM === 'object' && prod.IMAGEM.buffer) buffer = Buffer.from(prod.IMAGEM.buffer);
              if (buffer && buffer.length > 0) {
                if (buffer[0] === 0xFF && buffer[1] === 0xD8) imagemTipo = 'jpeg';
                else if (buffer[0] === 0x89 && buffer[1] === 0x50) imagemTipo = 'png';
                else imagemTipo = 'jpeg';
                imagemBase64 = buffer.toString('base64');
                if (imagemBase64.length < 100) { imagemBase64 = ''; imagemTipo = ''; }
              }
            }
            if (!erroDetectado) {
              produtosProcessados.push({
                procod: prod.PROCOD,
                nome: prod.DESCR,
                  preco: precoBase,
                und: prod.UND,
                codgrp: prod.CODGRP,
                grupo: prod.NOMGRU,
                imagem: imagemBase64,
                imagemTipo: imagemTipo,
                promoAtivo: promoAtivo,
                precoPromo: precoPromo,
                inipromo: iniPromoDate ? iniPromoDate.toISOString().slice(0,10) : null,
                fimpromo: fimPromoDate ? fimPromoDate.toISOString().slice(0,10) : null,
                descontoPerc: descontoPerc
              });
              pendentes--;
              if (pendentes === 0) {
                db.detach();
                finalizarResposta(null, produtosProcessados);
              }
            }
          }
        });
    }

    db.query(sqlCompleto, [], (err, result) => {
        if (respostaEnviada) { db.detach(); return; }
        if (err) {
          // Fallback para ambientes sem colunas de promoção
          db.query(sqlBasico, [], (err2, result2) => {
            if (respostaEnviada) { db.detach(); return; }
            if (err2) {
              db.detach();
              finalizarResposta('Erro ao buscar produtos');
              return;
            }
            executarProcessamento(result2, false);
          });
          return;
        }
        executarProcessamento(result, true);
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



// Rota para finalizar compra
router.post('/finalizar-compra', express.json(), (req, res) => {
  const itens = req.body.itens;
  const cliente = req.body.cliente || {};
  if (!Array.isArray(itens) || itens.length === 0) {
    return res.status(400).json({ success: false, error: 'Carrinho vazio.' });
  }
  connection.conectar((err, db) => {
    if (err) {
      return res.status(500).json({ success: false, error: 'Erro ao conectar ao banco.' });
    }
    // Cria novo pedido
    db.query('SELECT MAX(IDPEDIDO) AS MAX_ID FROM PEDIDOS', [], (err, result) => {
      if (err) {
        db.detach();
        return res.status(500).json({ success: false, error: 'Erro ao buscar último IDPED.' });
      }
      const novoId = (result[0].MAX_ID || 0) + 1;
      const data = new Date();
      const dtped = `${data.getFullYear()}-${String(data.getMonth()+1).padStart(2,'0')}-${String(data.getDate()).padStart(2,'0')}`;
      const hrped = `${String(data.getHours()).padStart(2,'0')}:${String(data.getMinutes()).padStart(2,'0')}:${String(data.getSeconds()).padStart(2,'0')}`;
      // Dados de entrega e pagamento do cliente
      const clie_cod = cliente.id || null;
      const clie_endentrega = cliente.endereco || '';
      const clie_baientrega = cliente.bairro || '';
      const clie_numentrega = cliente.numero || '';
      const tipo_entrega = cliente.tipo_entrega || '';
      const meio_pagto = cliente.meio_pagto || '';
      const obs = cliente.obs || '';
      db.query(
        'INSERT INTO PEDIDOS (IDPEDIDO, DTPEDIDO, HRPEDIDO, CLIE_COD, CLIE_ENDENTREGA, CLIE_BAIENTREGA, CLIE_NUMENTREGA, TIPO_ENTREGA, MEIO_PAGTO, OBS) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [novoId, dtped, hrped, clie_cod, clie_endentrega, clie_baientrega, clie_numentrega, tipo_entrega, meio_pagto, obs],
        (err) => {
          if (err) {
            db.detach();
            return res.status(500).json({ success: false, error: 'Erro ao inserir pedido.' });
          }
          // Insere itens
          let pendentes = itens.length;
          let erroDetectado = false;
          itens.forEach(item => {
            db.query(
              'INSERT INTO PEDIDOS_ITENS (IDPEDIDO, PROCOD, QTDE, VLRUNI, VLRTOT) VALUES (?, ?, ?, ?, ?)',
              [novoId, item.procod, item.qtd || 1, item.preco, (item.preco * (item.qtd || 1))],
              (err) => {
                if (err && !erroDetectado) {
                  erroDetectado = true;
                  console.error('Erro ao inserir item do pedido:', err, item);
                  db.detach(() => {});
                  return res.status(500).json({ success: false, error: 'Erro ao inserir item do pedido: ' + err.message });
                }
                pendentes--;
                if (pendentes === 0 && !erroDetectado) {
                  db.detach(() => {});
                  res.json({ success: true, idped: novoId });
                }
              }
            );
          });
        }
      );
    });
  });
});


// Rota para categorias (distintas do catálogo)
router.get('/categorias', (req, res) => {
  const now = Date.now();
  if (categoriasCache && (now - categoriasCacheAt < CACHE_TTL)) {
    return res.json({ success: true, categorias: categoriasCache });
  }
  connection.conectar((err, db) => {
    if (err) return res.status(500).json({ success: false, error: 'Erro ao conectar ao banco' });
    db.query('SELECT DISTINCT CODGRP, NOMGRU FROM PRODUTOS WHERE CODGRP IS NOT NULL ORDER BY NOMGRU', [], (err, result) => {
      db.detach(() => {});
      if (err) return res.status(500).json({ success: false, error: 'Erro ao buscar categorias' });
      const lista = (result || []).map(r => ({ codgrp: r.CODGRP, nome: r.NOMGRU }));
      categoriasCache = lista;
      categoriasCacheAt = Date.now();
      res.json({ success: true, categorias: lista });
    });
  });
});

// Pedidos do cliente (resumo com total)
router.get('/cliente/:id/pedidos', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ success: false, error: 'ID inválido' });
  connection.conectar((err, db) => {
    if (err) return res.status(500).json({ success: false, error: 'Erro ao conectar ao banco' });
    const sql = `
      SELECT p.IDPEDIDO, p.DTPEDIDO, p.HRPEDIDO, p.TIPO_ENTREGA, p.MEIO_PAGTO, p.OBS,
             p.CLIE_ENDENTREGA, p.CLIE_BAIENTREGA, p.CLIE_NUMENTREGA,
             COALESCE(SUM(i.VLRTOT), 0) AS TOTAL
        FROM PEDIDOS p
        LEFT JOIN PEDIDOS_ITENS i ON i.IDPEDIDO = p.IDPEDIDO
       WHERE p.CLIE_COD = ?
       GROUP BY p.IDPEDIDO, p.DTPEDIDO, p.HRPEDIDO, p.TIPO_ENTREGA, p.MEIO_PAGTO, p.OBS,
                p.CLIE_ENDENTREGA, p.CLIE_BAIENTREGA, p.CLIE_NUMENTREGA
       ORDER BY p.DTPEDIDO DESC, p.HRPEDIDO DESC`;
    db.query(sql, [id], (err, result) => {
      db.detach(() => {});
      if (err) return res.status(500).json({ success: false, error: 'Erro ao buscar pedidos' });
      const pedidos = (result || []).map(r => ({
        idpedido: r.IDPEDIDO,
        data: r.DTPEDIDO,
        hora: r.HRPEDIDO,
        tipo_entrega: r.TIPO_ENTREGA,
        meio_pagto: r.MEIO_PAGTO,
        obs: r.OBS,
        end_entrega: r.CLIE_ENDENTREGA,
        bai_entrega: r.CLIE_BAIENTREGA,
        num_entrega: r.CLIE_NUMENTREGA,
        total: Number(r.TOTAL || 0)
      }));
      res.json({ success: true, pedidos });
    });
  });
});

// Itens de um pedido
router.get('/pedidos/:id/itens', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ success: false, error: 'ID inválido' });
  connection.conectar((err, db) => {
    if (err) return res.status(500).json({ success: false, error: 'Erro ao conectar ao banco' });
    const sql = `
      SELECT i.PROCOD, i.QTDE, i.VLRUNI, i.VLRTOT, p.DESCR AS NOME, p.UND
        FROM PEDIDOS_ITENS i
        LEFT JOIN PRODUTOS p ON p.PROCOD = i.PROCOD
       WHERE i.IDPEDIDO = ?`;
    db.query(sql, [id], (err, result) => {
      db.detach(() => {});
      if (err) return res.status(500).json({ success: false, error: 'Erro ao buscar itens do pedido' });
      const itens = (result || []).map(r => ({
        procod: r.PROCOD,
        nome: r.NOME,
        und: r.UND,
        qtd: r.QTDE,
        vlruni: Number(r.VLRUNI || 0),
        vlrtot: Number(r.VLRTOT || 0)
      }));
      res.json({ success: true, itens });
    });
  });
});

module.exports = router;
