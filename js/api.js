const express = require('express');
const router = express.Router();
const connection = require('./connection');
const nodemailer = require('nodemailer');

// Constrói template moderno em HTML para o email de recuperação
function buildStyledRecoveryEmail(code, horasValidade = 2, email = '', appUrl = '') {
  const brandBlue = '#1657cf';
  const brandDark = '#130f40';
  const bg = '#f5f7fb';
  const border = '#e2e8f0';
  const codeBg = '#ffffff';
  const base = (appUrl || process.env.APP_BASE_URL || process.env.APP_URL || process.env.WEB_URL || '').replace(/\/$/, '');
  // Sem links de ação: apenas exibição do código
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Recuperação de Senha</title>
  <style>
    body{margin:0;padding:0;background:${bg};font-family:'Poppins',Arial,sans-serif;}
    .wrapper{max-width:560px;margin:0 auto;padding:32px 20px;}
    .card{background:#fff;border:1px solid ${border};border-radius:16px;box-shadow:0 6px 25px rgba(0,0,0,.06);overflow:hidden;}
    .top-bar{height:6px;background:${brandBlue};}
    h1{font-size:22px;margin:0 0 8px;color:${brandDark};letter-spacing:.5px;}
    p{margin:0 0 14px;font-size:15px;line-height:1.5;color:#444;}
    .code-box{margin:18px 0 26px;display:flex;justify-content:center;}
    .code-single{background:${codeBg};border:2px solid ${brandBlue};color:${brandDark};font-weight:600;font-size:30px;border-radius:14px;padding:18px 26px;letter-spacing:6px;box-shadow:0 4px 18px rgba(0,0,0,.10);font-family:'Poppins',monospace;}
    .badge{display:inline-block;background:${brandBlue};color:#fff;font-size:11px;font-weight:600;padding:4px 10px;border-radius:40px;letter-spacing:.5px;text-transform:uppercase;margin-bottom:12px;}
    .footer{margin-top:28px;padding:16px 24px;background:${brandBlue};color:#fff;border-radius:0 0 16px 16px;font-size:12px;}
    .quiet{color:#6b7280;font-size:12px;margin-top:6px;}
    @media (max-width:480px){h1{font-size:20px;} .digit{font-size:24px;padding:12px 14px;} .wrapper{padding:24px 14px;} .card{border-radius:14px;} }
  </style></head><body><div class="wrapper"><div class="card"><div class="top-bar"></div>
  <div style="padding:28px 28px 6px;">
    <span class="badge">Recuperação de Senha</span>
    <h1>Seu código de verificação</h1>
    <p>Use o código abaixo para continuar o processo de redefinição da sua senha. Ele é válido por <strong>${horasValidade} horas</strong>. Copie e cole na página de redefinição.</p>
    <div class="code-box"><div class="code-single">${String(code)}</div></div>
    <p style="margin-top:4px;">Se você não solicitou esta operação, pode ignorar este email com segurança. Nenhuma alteração foi feita na sua conta.</p>
    <p class="quiet">Por segurança, não encaminhe este código para ninguém.</p>
  </div>
  <div class="footer">Mercado Online &mdash; Atendimento: suporte@mercadoonline<br/><span style="opacity:.85;">&copy; ${new Date().getFullYear()} Mercado Online. Todos os direitos reservados.</span></div>
  </div></div></body></html>`;
}

// Util: envio de email (configurado via variáveis de ambiente) com template moderno
function enviarEmail(destino, assunto, texto, opts = {}) {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    console.warn('[EMAIL] Configuração SMTP ausente. Código:', texto);
    return Promise.resolve({ simulated: true });
  }
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });
  // Detecta código de verificação (6 dígitos) para aplicar HTML estilizado
  let html = null;
  if (/Recuperação/i.test(assunto)) {
    const match = texto.match(/(\d{6})/);
    if (match) {
      const baseFromOpts = opts.appUrl && String(opts.appUrl).trim();
      html = buildStyledRecoveryEmail(
        match[1],
        2,
        destino,
        baseFromOpts || process.env.APP_BASE_URL || process.env.APP_URL || process.env.WEB_URL
      );
    }
  }
  return transporter.verify()
    .then(() => transporter.sendMail({
      from: { name: 'Mercado Online', address: user },
      to: destino,
      subject: assunto,
      text: texto,
      html: html || undefined
    }))
    .catch(err => { console.error('[EMAIL] Falha ao enviar:', err.message); return { error: err.message }; });
}

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
// Login case-insensitive para o email
router.post('/login', express.json(), (req, res) => {
  let { email, senha } = req.body;
  if (!email || !senha) {
    return res.status(400).json({ success: false, error: 'Email e senha obrigatórios.' });
  }
  // Normaliza email para comparação (lowercase)
  email = String(email).trim().toLowerCase();
  connection.conectar((err, db) => {
    if (err) {
      return res.status(500).json({ success: false, error: 'Erro ao conectar ao banco.' });
    }
    db.query('SELECT ID, NOMECLI, EMAIL FROM CLIENTES WHERE LOWER(EMAIL) = ? AND SENHA = ?', [email, senha], (err, result) => {
      db.detach(() => {});
      if (err) {
        return res.status(500).json({ success: false, error: 'Erro ao buscar usuário.' });
      }
      if (result.length === 0) {
        return res.status(401).json({ success: false, error: 'Email ou senha inválidos.' });
      }
      res.json({ success: true, usuario: { id: result[0].ID, nome: result[0].NOMECLI, email: result[0].EMAIL } });
    });
  });
});

// =============================
// Recuperação de senha
// Campos: CLIENTES.DIGVERIFICADOR armazena "CODIGO|TIMESTAMP" para expiração em 2h
// =============================

// Armazena em memória dados temporários de recuperação: email -> { code, ts }
// Banco persistirá somente o código (sem timestamp) para evitar truncation
const __memCodes = new Map();

// Solicita código de verificação (esqueci a senha)
router.post('/esqueci-senha', express.json(), (req, res) => {
  let { email } = req.body;
  if (!email) return res.status(400).json({ success:false, error:'Email obrigatório.' });
  email = String(email).trim().toLowerCase();
  connection.conectar((err, db) => {
    if (err) return res.status(500).json({ success:false, error:'Erro de conexão.' });
    // Também traz o DIGVERIFICADOR para aplicar cooldown de reenvio
    db.query('SELECT ID, EMAIL, DIGVERIFICADOR FROM CLIENTES WHERE LOWER(EMAIL) = ?', [email], (qErr, result=[]) => {
      if (qErr) { db.detach(); return res.status(500).json({ success:false, error:'Erro ao buscar email.' }); }
      if (!result.length) { db.detach(); return res.json({ success:true, sent:false }); } // não revela existência
      const id = result[0].ID;
      const raw = (result[0].DIGVERIFICADOR || '').toString();
      // Usa timestamp somente da memória (se já havia requisitado antes)
      let ts = __memCodes.has(email) ? (__memCodes.get(email).ts || 0) : 0;
      const COOLDOWN_MS = 60 * 1000; // 60 segundos
      const agora = Date.now();
      if (ts && (agora - ts) < COOLDOWN_MS) {
        const retryAfterMs = COOLDOWN_MS - (agora - ts);
        const retryAfter = Math.ceil(retryAfterMs / 1000);
        db.detach();
        return res.json({ success:true, sent:true, cooldown:true, retryAfter });
      }
      const codigo = String(Math.floor(100000 + Math.random()*900000)); // 6 dígitos
      const codigoBanco = /^\d+$/.test(codigo) ? parseInt(codigo,10) : codigo;
      db.query('UPDATE CLIENTES SET DIGVERIFICADOR = ? WHERE ID = ?', [codigoBanco, id], (uErr) => {
        db.detach();
        if (uErr) {
          console.error('[ESQUECI-SENHA] Falha ao gravar código:', uErr && uErr.message);
          return res.status(500).json({ success:false, error:'Erro ao gerar código.' });
        }
        __memCodes.set(email, { code: String(codigoBanco), ts: agora });
        enviarEmail(email, 'Recuperação de Senha', `Seu código de verificação: ${codigo}\nVálido por 2 horas.`)
          .then(()=> res.json({ success:true, sent:true, message:'CÓDIGO ENVIADO COM SUCESSO' }))
          .catch(()=> res.json({ success:true, sent:true, message:'CÓDIGO ENVIADO COM SUCESSO', warning:'Falha envio real (simulado).' }));
      });
    });
  });
});

// Verifica código
router.post('/verificar-codigo', express.json(), (req, res) => {
  let { email, codigo } = req.body;
  if (!email || !codigo) return res.status(400).json({ success:false, error:'Email e código obrigatórios.' });
  email = String(email).trim().toLowerCase();
  codigo = String(codigo).trim();
  connection.conectar((err, db) => {
    if (err) return res.status(500).json({ success:false, error:'Erro de conexão.' });
    db.query('SELECT DIGVERIFICADOR FROM CLIENTES WHERE LOWER(EMAIL) = ?', [email], (qErr, result=[]) => {
      if (qErr) { db.detach(); return res.status(500).json({ success:false, error:'Erro ao verificar.' }); }
      if (!result.length) { db.detach(); return res.json({ success:false, error:'Código inválido.' }); }
      const raw = result[0].DIGVERIFICADOR || '';
      const savedCode = raw; // banco guarda apenas o código
      let ts = __memCodes.has(email) ? __memCodes.get(email).ts : null;
      const expirado = ts ? ((Date.now() - ts) > (2*60*60*1000)) : false;
      if (expirado) {
        // Limpa código expirado
        db.query('UPDATE CLIENTES SET DIGVERIFICADOR = NULL WHERE LOWER(EMAIL) = ?', [email], () => {
          db.detach();
          __memCodes.delete(email);
          return res.json({ success:false, error:'Código expirado.' });
        });
        return;
      }
      if (codigo !== savedCode) { db.detach(); return res.json({ success:false, error:'Código inválido.' }); }
      db.detach();
      return res.json({ success:true, valid:true });
    });
  });
});

// Redefinir senha
router.post('/redefinir-senha', express.json(), (req, res) => {
  let { email, codigo, novaSenha } = req.body;
  if (!email || !codigo || !novaSenha) return res.status(400).json({ success:false, error:'Campos obrigatórios.' });
  email = String(email).trim().toLowerCase();
  codigo = String(codigo).trim();
  novaSenha = String(novaSenha).trim();
  if (novaSenha.length < 4) return res.status(400).json({ success:false, error:'Senha muito curta.' });
  connection.conectar((err, db) => {
    if (err) return res.status(500).json({ success:false, error:'Erro de conexão.' });
    db.query('SELECT ID, DIGVERIFICADOR FROM CLIENTES WHERE LOWER(EMAIL) = ?', [email], (qErr, result=[]) => {
      if (qErr) { db.detach(); return res.status(500).json({ success:false, error:'Erro ao verificar.' }); }
      if (!result.length) { db.detach(); return res.status(400).json({ success:false, error:'Código inválido.' }); }
      const raw = result[0].DIGVERIFICADOR || '';
      const savedCode = raw;
      let ts = __memCodes.has(email) ? __memCodes.get(email).ts : null;
      const expirado = ts ? ((Date.now() - ts) > (2*60*60*1000)) : false;
      if (expirado) {
        // Limpa expirado e informa
        db.query('UPDATE CLIENTES SET DIGVERIFICADOR = NULL WHERE LOWER(EMAIL) = ?', [email], () => {
          db.detach();
          __memCodes.delete(email);
          return res.status(400).json({ success:false, error:'Código expirado.' });
        });
        return;
      }
      if (codigo !== savedCode) { db.detach(); return res.status(400).json({ success:false, error:'Código inválido.' }); }
      db.query('UPDATE CLIENTES SET SENHA = ?, DIGVERIFICADOR = NULL WHERE LOWER(EMAIL) = ?', [novaSenha, email], (uErr) => {
        db.detach();
        if (uErr) return res.status(500).json({ success:false, error:'Erro ao atualizar senha.' });
        __memCodes.delete(email);
        res.json({ success:true, updated:true });
      });
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
// Cache de parâmetros (empresa, entrega, etc.)
let parametrosCache = null;
let parametrosCacheAt = 0;

// ...existing code...
// Rota para buscar dados completos do cliente (tolerante a ausência de colunas)
router.get('/cliente/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ success: false, error: 'ID obrigatório.' });
  connection.conectar((err, db) => {
    if (err) return res.status(500).json({ success: false, error: 'Erro ao conectar ao banco.' });

    // Descobre dinamicamente quais colunas existem na tabela CLIENTES
    const metaSql = "SELECT TRIM(RDB$FIELD_NAME) AS FIELD FROM RDB$RELATION_FIELDS WHERE RDB$RELATION_NAME = 'CLIENTES'";
    db.query(metaSql, [], (mErr, metaRes = []) => {
      if (mErr) {
        console.error('[CLIENTE] Falha ao ler metadados:', mErr);
      }
      const existentes = new Set(
        (metaRes || []).map(r => (r.FIELD || r.RDB$FIELD_NAME || '').trim().toUpperCase())
      );
      // Mapeamento lógico -> coluna física (quando existir)
      const campos = [
        ['ID', 'ID'],
        ['NOME', 'NOMECLI'],
        ['EMAIL', 'EMAIL'],
        ['CELULAR', 'CELULAR'],
        ['CPF', 'CPF'],
        ['CNPJ', 'CNPJ'],
        ['ENDERECO', 'ENDERECO'],
        ['BAIRRO', 'BAIRRO'],
        ['NUMERO', 'NUMERO'],
        ['CIDADE', 'CIDADE'],
        ['UF', 'UF'],
        ['CEP', 'CEP'],
        ['REFERENCIA', 'REFERENCIA']
      ].filter(([_, col]) => existentes.has(col));

      // Garante pelo menos ID, NOMECLI, EMAIL para não quebrar
      const essenciais = ['ID','NOMECLI','EMAIL'];
      essenciais.forEach(col => { if (!existentes.has(col)) console.warn('[CLIENTE] Coluna essencial ausente:', col); });

      const selectFrag = campos.map(([alias, col]) => col === alias ? col : `${col} AS ${alias}`).join(', ');
      const sql = `SELECT ${selectFrag} FROM CLIENTES WHERE ID = ?`;

      db.query(sql, [id], (qErr, result = []) => {
        db.detach(() => {});
        if (qErr) {
          console.error('[CLIENTE] Erro na consulta principal, tentando fallback simplificado:', qErr.message);
          // Fallback mínimo
            connection.conectar((fbErr, db2) => {
              if (fbErr) return res.status(500).json({ success:false, error:'Erro ao recuperar (fallback).'});
              db2.query('SELECT ID, NOMECLI AS NOME, EMAIL FROM CLIENTES WHERE ID = ?', [id], (fbQE, fbRes = []) => {
                db2.detach(() => {});
                if (fbQE) {
                  console.error('[CLIENTE] Fallback também falhou:', fbQE.message);
                  return res.status(500).json({ success:false, error:'Erro ao buscar cliente.' });
                }
                if (!fbRes.length) return res.status(404).json({ success:false, error:'Cliente não encontrado.' });
                // Preenche campos opcionais como null
                const base = fbRes[0];
                const cliente = {
                  ID: base.ID,
                  NOME: base.NOME,
                  EMAIL: base.EMAIL,
                  CELULAR: null, CPF: null, CNPJ: null, ENDERECO: null, BAIRRO: null,
                  NUMERO: null, CIDADE: null, UF: null, CEP: null, REFERENCIA: null
                };
                return res.json({ success:true, cliente });
              });
            });
          return;
        }
        if (!result.length) return res.status(404).json({ success: false, error: 'Cliente não encontrado.' });
        res.json({ success: true, cliente: result[0] });
      });
    });
  });
});

// Atualizar dados do cliente (não altera EMAIL)
router.put('/cliente/:id', express.json(), (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ success: false, error: 'ID obrigatório' });
  const body = req.body || {};
  // Normaliza documento: usa sempre o campo CPF para armazenar CPF ou CNPJ
  const hasCpf = Object.prototype.hasOwnProperty.call(body, 'cpf') && body.cpf !== undefined && body.cpf !== null && String(body.cpf).trim() !== '';
  const hasCnpj = Object.prototype.hasOwnProperty.call(body, 'cnpj') && body.cnpj !== undefined && body.cnpj !== null && String(body.cnpj).trim() !== '';
  if (hasCpf || hasCnpj) {
    const doc = String(hasCpf ? body.cpf : body.cnpj).replace(/\D/g, '');
    if (doc.length === 11) { if (!validateCPF(doc)) return res.status(400).json({ success:false, error:'CPF inválido' }); }
    else if (doc.length === 14) { if (!validateCNPJ(doc)) return res.status(400).json({ success:false, error:'CNPJ inválido' }); }
    else { return res.status(400).json({ success:false, error:'Documento inválido' }); }
    body.cpf = doc; // unifica
    delete body.cnpj;
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
    cpf: 'CPF'
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
  // Corrige nome de coluna: INIPROMO (e não INPROMO)
  const sqlCompleto = 'SELECT PROCOD, DESCR, PRVENDA, IMAGEM, UND, CODGRP, NOMGRU, INIPROMO, FIMPROMO, VALORPROMO FROM PRODUTOS';
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
          // Atenção: coluna chama-se INIPROMO
          const iniPromoDate = temCamposPromo ? toDate(prod.INIPROMO) : null;
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
  const emailNorm = String(email).trim().toLowerCase();
  db.query('SELECT ID FROM CLIENTES WHERE LOWER(EMAIL) = ?', [emailNorm], (err, result) => {
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
          nome, email: emailOriginal, endereco, bairro, numero, complemento,
          cidade, estado, cep, celular, senha, dtcadastro, cpf, cnpj
        } = req.body;
        // Normaliza documento: usa sempre a coluna CPF para armazenar CPF ou CNPJ
        function toDigits(v){ return String(v||'').replace(/\D/g,''); }
        const cpfClean = toDigits(cpf);
        const cnpjClean = toDigits(cnpj);
        const docClean = cpfClean || cnpjClean;
        if (!docClean) { db.detach(); return res.status(400).json({ success:false, error:'CPF ou CNPJ obrigatório' }); }
        if (docClean.length === 11) {
          if (!validateCPF(docClean)) { db.detach(); return res.status(400).json({ success:false, error:'CPF inválido' }); }
        } else if (docClean.length === 14) {
          if (!validateCNPJ(docClean)) { db.detach(); return res.status(400).json({ success:false, error:'CNPJ inválido' }); }
        } else {
          db.detach(); return res.status(400).json({ success:false, error:'Documento inválido' });
        }
          // Lê metadados para verificar se colunas CPF/CNPJ existem
          const metaSql = "SELECT TRIM(RDB$FIELD_NAME) AS FIELD FROM RDB$RELATION_FIELDS WHERE RDB$RELATION_NAME = 'CLIENTES'";
          db.query(metaSql, [], (mErr, metaRes=[]) => {
            if (mErr) {
              console.warn('[CADASTRO] Falha ao ler metadados CLIENTES, prosseguindo com colunas básicas. Erro:', mErr.message);
            }
            const existentes = new Set((metaRes||[]).map(r => (r.FIELD || '').toUpperCase()));
            // Colunas obrigatórias básicas
            const cols = ['ID','NOMECLI','EMAIL','ENDERECO','BAIRRO','NUMERO','REFERENCIA','CIDADE','UF','CEP','CELULAR','SENHA','DTCADASTRO'];
            const placeholders = ['?','?','?','?','?','?','?','?','?','?','?','?','?'];
            const values = [
              parseInt(novoId),
              nome,
              String(emailOriginal).trim().toLowerCase(),
              endereco, bairro, numero, complemento,
              cidade, estado, cep, celular, senha, dtcadastro
            ];
            // Usa somente a coluna CPF para armazenar CPF ou CNPJ
            if (existentes.has('CPF')) { cols.push('CPF'); placeholders.push('?'); values.push(docClean); }
            else { console.warn('[CADASTRO] Coluna CPF ausente. Documento será ignorado no INSERT.'); }
            const insertSql = `INSERT INTO CLIENTES (${cols.join(', ')}) VALUES (${placeholders.join(', ')})`;
            db.query(insertSql, values, (iErr) => {
              db.detach();
              if (iErr) {
                console.error('Erro ao inserir cliente:', iErr);
                return res.status(500).json({ success: false, error: iErr.message });
              }
              res.json({ success: true, id: novoId });
            });
          });
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


// Rota para parâmetros da empresa (entrega, mínimo, contato, etc.)
router.get('/parametros', (req, res) => {
  const now = Date.now();
  if (parametrosCache && (now - parametrosCacheAt < CACHE_TTL)) {
    return res.json({ success: true, parametros: parametrosCache });
  }
  connection.conectar((err, db) => {
    if (err) {
      // Fallback: retorna defaults quando não conseguir conectar
      return res.json({ success: true, parametros: {
        razao: 'Mercado Online', cnpj: '', ie: '', endereco: '', bairro: '', numero: '', cidade: '', uf: '', celular: '',
        vlr_entrega: 5, vlr_pedminimo: 50
      }});
    }
    const sql = 'SELECT FIRST 1 RAZAO, CNPJ, IE, ENDERECO, BAIRRO, NUMERO, CIDADE, UF, CELULAR, VLR_ENTREGA, VLR_PEDMINIMO FROM PARAMETROS';
    db.query(sql, [], (qerr, result = []) => {
      db.detach(() => {});
      if (qerr || !result || result.length === 0) {
        // Tabela ausente ou vazia: retorna defaults
        parametrosCache = {
          razao: 'Mercado Online', cnpj: '', ie: '', endereco: '', bairro: '', numero: '', cidade: '', uf: '', celular: '',
          vlr_entrega: 5, vlr_pedminimo: 50
        };
        parametrosCacheAt = Date.now();
        return res.json({ success: true, parametros: parametrosCache });
      }
      const r = result[0] || {};
      const toNum = (v) => {
        if (v === null || v === undefined) return 0;
        if (typeof v === 'number') return v;
        const s = String(v).replace(',', '.');
        const n = parseFloat(s);
        return isNaN(n) ? 0 : n;
      };
      parametrosCache = {
        razao: r.RAZAO || '',
        cnpj: r.CNPJ || '',
        ie: r.IE || '',
        endereco: r.ENDERECO || '',
        bairro: r.BAIRRO || '',
        numero: r.NUMERO || '',
        cidade: r.CIDADE || '',
        uf: r.UF || '',
        celular: r.CELULAR || '',
        vlr_entrega: toNum(r.VLR_ENTREGA),
        vlr_pedminimo: toNum(r.VLR_PEDMINIMO)
      };
      parametrosCacheAt = Date.now();
      res.json({ success: true, parametros: parametrosCache });
    });
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
    // Detecta colunas opcionais na tabela PEDIDOS (FLAG, VLR_ENTREGA)
    const colsSql = "SELECT TRIM(RDB$FIELD_NAME) AS FIELD FROM RDB$RELATION_FIELDS WHERE RDB$RELATION_NAME = 'PEDIDOS' AND RDB$FIELD_NAME IN ('FLAG','VLR_ENTREGA')";
    db.query(colsSql, [], (chkErr, colRes = []) => {
      const fields = Array.isArray(colRes) ? colRes.map(r => (r.FIELD || r.RDB$FIELD_NAME || '').trim()) : [];
      const hasFlag = fields.includes('FLAG');
      const hasVlrEntrega = fields.includes('VLR_ENTREGA');
      // Calcula subtotal dos itens e taxa de entrega
      const subtotal = (itens || []).reduce((acc, it) => acc + (Number(it.preco) * (it.qtd || 1)), 0);
      // Busca parâmetros (com fallback 50/5) para calcular entrega
      const getParamsSql = 'SELECT FIRST 1 VLR_ENTREGA, VLR_PEDMINIMO FROM PARAMETROS';
      db.query(getParamsSql, [], (perr, pres = []) => {
        let pedMin = 50;
        let vlrEnt = 5;
        if (!perr && pres && pres.length > 0) {
          const toNum = (v) => {
            if (v === null || v === undefined) return 0;
            if (typeof v === 'number') return v;
            const s = String(v).replace(',', '.');
            const n = parseFloat(s);
            return isNaN(n) ? 0 : n;
          };
          pedMin = toNum(pres[0].VLR_PEDMINIMO) || 0;
          vlrEnt = toNum(pres[0].VLR_ENTREGA) || 0;
          if (pedMin <= 0) pedMin = 50;
        }
        const entregaFee = String(cliente.tipo_entrega) === '2' && subtotal < pedMin ? vlrEnt : 0;
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
        // Monta INSERT dinâmico considerando FLAG e VLR_ENTREGA
        let cols = 'IDPEDIDO, DTPEDIDO, HRPEDIDO, CLIE_COD, CLIE_ENDENTREGA, CLIE_BAIENTREGA, CLIE_NUMENTREGA, TIPO_ENTREGA, MEIO_PAGTO, OBS';
        let ph   = '?, ?, ?, ?, ?, ?, ?, ?, ?, ?';
        const params = [novoId, dtped, hrped, clie_cod, clie_endentrega, clie_baientrega, clie_numentrega, tipo_entrega, meio_pagto, obs];
        if (hasFlag) { cols += ', FLAG'; ph += ', ?'; params.push('A'); }
        if (hasVlrEntrega) { cols += ', VLR_ENTREGA'; ph += ', ?'; params.push(entregaFee); }
        const insertSql = `INSERT INTO PEDIDOS (${cols}) VALUES (${ph})`;
        db.query(
          insertSql,
          params,
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
    // Detecta colunas opcionais (FLAG e VLR_ENTREGA)
    const colsSql = "SELECT TRIM(RDB$FIELD_NAME) AS FIELD FROM RDB$RELATION_FIELDS WHERE RDB$RELATION_NAME = 'PEDIDOS' AND RDB$FIELD_NAME IN ('FLAG','VLR_ENTREGA')";
    db.query(colsSql, [], (chkErr, colRes = []) => {
      const fields = Array.isArray(colRes) ? colRes.map(r => (r.FIELD || r.RDB$FIELD_NAME || '').trim()) : [];
      const hasFlag = fields.includes('FLAG');
      const hasVlrEntrega = fields.includes('VLR_ENTREGA');
      const selFlag = hasFlag ? ', p.FLAG' : '';
      const grpFlag = hasFlag ? ', p.FLAG' : '';
      const selVlr = hasVlrEntrega ? ', p.VLR_ENTREGA' : '';
      const totalExpr = hasVlrEntrega ? 'COALESCE(SUM(i.VLRTOT), 0) + COALESCE(p.VLR_ENTREGA, 0)' : 'COALESCE(SUM(i.VLRTOT), 0)';
      const sql = `
        SELECT p.IDPEDIDO, p.DTPEDIDO, p.HRPEDIDO, p.TIPO_ENTREGA, p.MEIO_PAGTO, p.OBS,
               p.CLIE_ENDENTREGA, p.CLIE_BAIENTREGA, p.CLIE_NUMENTREGA${selFlag}${selVlr},
               ${totalExpr} AS TOTAL
          FROM PEDIDOS p
          LEFT JOIN PEDIDOS_ITENS i ON i.IDPEDIDO = p.IDPEDIDO
         WHERE p.CLIE_COD = ?
         GROUP BY p.IDPEDIDO, p.DTPEDIDO, p.HRPEDIDO, p.TIPO_ENTREGA, p.MEIO_PAGTO, p.OBS,
                  p.CLIE_ENDENTREGA, p.CLIE_BAIENTREGA, p.CLIE_NUMENTREGA${grpFlag}${hasVlrEntrega ? ', p.VLR_ENTREGA' : ''}
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
        flag: r.FLAG, // pode ser undefined se coluna não existir
        vlr_entrega: r.VLR_ENTREGA || 0,
        total: Number(r.TOTAL || 0)
      }));
      res.json({ success: true, pedidos });
    });
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
