// ofertas.js - lista somente produtos com promoção ativa

let ofertasOrdenadas = [];
let paginaAtual = 1;
const itensPorPagina = 20;

function buscarOfertas() {
  const loader = document.getElementById('loader');
  if (loader) loader.style.display = 'flex';
  const url = apiUrl(`/api/produtos?offset=0&limit=10000&_=${Date.now()}`);
  return fetch(url, { headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache', 'Expires': '0' }})
    .then(r => r.json())
    .then(data => {
      if (loader) loader.style.display = 'none';
      if (!data.success || !Array.isArray(data.produtos)) return [];
      // Apenas promoções ativas: somente se FIMPROMO > hoje e VALORPROMO > 0
      const toNumber = (n) => {
        if (n === null || n === undefined) return NaN;
        if (typeof n === 'number') return n;
        const s = String(n).replace(',', '.');
        const v = Number(s);
        return isNaN(v) ? NaN : v;
      };
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // usar apenas data
      const toDateOnly = (s) => {
        if (!s) return null;
        // Aceita 'YYYY-MM-DD' (API) ou 'DD.MM.AAAA' (caso eventual)
        if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
          const [Y,M,D] = s.split('-').map(Number);
          return new Date(Y, M-1, D);
        }
        const m = String(s).match(/^(\d{2})[.\/-](\d{2})[.\/-](\d{4})$/);
        if (m) {
          return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
        }
        const d = new Date(s);
        return isNaN(d) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate());
      };
      // Diagnóstico: contagens brutas
      const total = data.produtos.length;
      const withPrecoPromo = data.produtos.filter(p => toNumber(p.precoPromo) > 0).length;
      const withFimPromo = data.produtos.filter(p => !!p.fimpromo).length;
      // Se nenhuma coluna de promo veio, destacar possível fallback no backend
      if (withPrecoPromo === 0 && withFimPromo === 0) {
        console.warn('Nenhuma coluna de promoção recebida do backend. Verifique se a API está retornando VALORPROMO/FIMPROMO.');
      }
      try {
        console.info(`Diagnóstico promo (bruto): total=${total}, com VALORPROMO>0=${withPrecoPromo}, com FIMPROMO definido=${withFimPromo}`);
      } catch(_) {}
      const onlyPromos = data.produtos.filter(p => {
        const fimDate = toDateOnly(p.fimpromo);
        const precoPromoNum = toNumber(p.precoPromo);
        const precoBaseNum = toNumber(p.preco);
        // Regra: data (sem hora) e preço promo válido menor que o base
        return !!(fimDate && fimDate.getTime() > today.getTime() && !isNaN(precoPromoNum) && precoPromoNum > 0 && precoPromoNum < precoBaseNum);
      });
      // Ordena por nome (ou mantém) – sem percentuais
      onlyPromos.sort((a,b) => String(a.nome||'').localeCompare(String(b.nome||'')));
      try {
        console.groupCollapsed(`Promoções importadas com sucesso • ${onlyPromos.length} item(ns)`);
        console.table(onlyPromos.map(p => ({
          procod: p.procod,
          nome: p.nome,
          precoPromo: toNumber(p.precoPromo),
          fimpromo: p.fimpromo,
        })));
        console.groupEnd();
        // Se zerado, mostrar amostra dos 10 primeiros para depuração
        if (onlyPromos.length === 0) {
          const sample = data.produtos.slice(0, 10).map(p => {
            const fimDate = p.fimpromo ? new Date(`${p.fimpromo}T23:59:59`) : null;
            const precoPromoNum = toNumber(p.precoPromo);
            return {
              procod: p.procod,
              nome: p.nome,
              precoBase: toNumber(p.preco),
              precoPromo: precoPromoNum,
              fimpromo: p.fimpromo,
              ativa: !!(fimDate && fimDate.getTime() > now.getTime() && !isNaN(precoPromoNum) && precoPromoNum > 0)
            };
          });
          console.groupCollapsed('Diagnóstico promo (amostra até 10 itens)');
          console.table(sample);
          console.groupEnd();
        }
      } catch(_) {}
      return onlyPromos;
    })
    .catch((err) => { 
      if (loader) loader.style.display = 'none'; 
      console.error('Falha ao importar promoções:', err);
      return []; 
    });
}

function renderOfertas(lista) {
  const container = document.getElementById('ofertas-lista');
  if (!container) return;
  container.innerHTML = '';
  if (!lista.length) {
    container.innerHTML = '<div>Nenhum item em promoção no momento.</div>';
    document.getElementById('paginacao').innerHTML = '';
    return;
  }
  lista.forEach(prod => {
  const box = document.createElement('div');
  box.className = 'box';
    box.setAttribute('data-procod', prod.procod);
    box.style = 'background:#fff;box-shadow:0 .1rem 1rem rgb(124,124,124);border-radius:.5rem;text-align:center;display:block;height:25rem;width:20rem;position:relative;margin:0 auto;';
    const precoBaseFmt = Number(prod.preco || 0).toFixed(2);
    const precoPromoFmt = Number(prod.precoPromo || 0).toFixed(2);
    const base = Number(prod.preco || 0);
    const promo = Number(prod.precoPromo || 0);
    const descontoPerc = base > 0 && promo > 0 && promo < base ? Math.max(1, Math.min(99, Math.round((1 - (promo/base))*100))) : 0;
    box.innerHTML = `
      <div class="badge-desconto">-${descontoPerc}%</div>
      ${prod.imagemTipo && prod.imagem ? `<img src="data:image/${prod.imagemTipo};base64,${prod.imagem}" alt="${prod.nome}" style="height:50%;width:80%;object-fit:contain;margin-top:1rem;">` : `<img src="image/SEM-IMAGEM.png" alt="Sem imagem" style="height:50%;width:80%;object-fit:contain;margin-top:1rem;">`}
      <h1 style="font-size:1.5rem;color:rgb(22,87,207);">${prod.nome}</h1>
      <div class="qty-selector" style="margin:0.5rem 0;display:flex;justify-content:center;align-items:center;gap:0.5rem;">
        <button class="qty-minus" type="button">-</button>
        <input type="number" class="qty-input" min="1" value="1" style="width:40px;text-align:center;font-size:1.2rem;">
        <button class="qty-plus" type="button">+</button>
      </div>
      <div class="box-footer">
        <div style="display:flex;flex-direction:column;align-items:flex-start;">
          <div class="price-old">R$ ${precoBaseFmt}</div>
          <div class="price">R$ ${precoPromoFmt} <span class="und">/${prod.und}</span></div>
        </div>
        <button class="add-carrinho-btn"><i class="fas fa-shopping-cart"></i></button>
      </div>
    `;
    container.appendChild(box);
  });

  // Eventos
  container.querySelectorAll('.box').forEach(box => {
    const minus = box.querySelector('.qty-minus');
    const plus = box.querySelector('.qty-plus');
    const input = box.querySelector('.qty-input');
    minus.onclick = () => { let v = parseInt(input.value)||1; if (v>1) input.value = v-1; };
    plus.onclick  = () => { let v = parseInt(input.value)||1; input.value = v+1; };
    input.oninput  = () => { if (input.value < 1) input.value = 1; };
    box.querySelector('.add-carrinho-btn').onclick = () => {
      const procod = box.getAttribute('data-procod');
      const prod = ofertasOrdenadas.find(p => String(p.procod) === String(procod));
      const qtd = parseInt(input.value) || 1;
      // Garante número mesmo se vier string com vírgula
      const precoPromoNum = typeof prod.precoPromo === 'number' ? prod.precoPromo : parseFloat(String(prod.precoPromo).replace(',', '.'));
      const prodCarrinho = { ...prod, preco: isNaN(precoPromoNum) ? Number(prod.precoPromo) : precoPromoNum };
      adicionarAoCarrinho(prodCarrinho, qtd);
      // Feedback rápido
      let msg = document.createElement('div');
      msg.textContent = 'ADICIONADO COM SUCESSO';
      msg.style = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#1657cf;color:#fff;padding:1rem 2rem;border-radius:2rem;font-size:1.4rem;font-weight:bold;z-index:9999;transition:opacity .5s';
      document.body.appendChild(msg);
      setTimeout(()=>{ msg.style.opacity='0'; setTimeout(()=>msg.remove(),500); },1000);
    };
  });

  atualizarPaginacao();
}

function atualizarPaginacao() {
  const pag = document.getElementById('paginacao');
  if (!pag) return;
  pag.innerHTML = '';
  const totalPaginas = Math.ceil(ofertasOrdenadas.length / itensPorPagina);
  if (totalPaginas <= 1) return;

  const btnAnt = document.createElement('button');
  btnAnt.textContent = '<';
  btnAnt.disabled = paginaAtual === 1;
  btnAnt.onclick = () => {
    if (paginaAtual > 1) {
      paginaAtual--;
      const inicio = (paginaAtual - 1) * itensPorPagina;
      renderOfertas(ofertasOrdenadas.slice(inicio, inicio + itensPorPagina));
    }
  };
  pag.appendChild(btnAnt);

  let start = 1, end = totalPaginas;
  if (totalPaginas > 7) {
    if (paginaAtual <= 4) { start = 1; end = 7; }
    else if (paginaAtual >= totalPaginas - 3) { start = totalPaginas - 6; end = totalPaginas; }
    else { start = paginaAtual - 3; end = paginaAtual + 3; }
  }
  for (let i=start;i<=end;i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    btn.className = 'pagina-btn' + (i === paginaAtual ? ' active' : '');
    btn.disabled = i === paginaAtual;
    btn.onclick = () => {
      paginaAtual = i;
      const inicio = (paginaAtual - 1) * itensPorPagina;
      renderOfertas(ofertasOrdenadas.slice(inicio, inicio + itensPorPagina));
    };
    pag.appendChild(btn);
  }

  const btnProx = document.createElement('button');
  btnProx.textContent = '>';
  btnProx.disabled = paginaAtual === totalPaginas;
  btnProx.onclick = () => {
    if (paginaAtual < totalPaginas) {
      paginaAtual++;
      const inicio = (paginaAtual - 1) * itensPorPagina;
      renderOfertas(ofertasOrdenadas.slice(inicio, inicio + itensPorPagina));
    }
  };
  pag.appendChild(btnProx);
}

function adicionarAoCarrinho(produto, qtd = 1) {
  let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
  const idx = carrinho.findIndex(item => String(item.procod) === String(produto.procod));
  if (idx > -1) {
    // Atualiza preço/und para refletir promoção atual
    carrinho[idx].preco = produto.preco;
    carrinho[idx].und = produto.und || carrinho[idx].und;
    carrinho[idx].qtd += qtd;
  } else {
    carrinho.push({ ...produto, qtd });
  }
  localStorage.setItem('carrinho', JSON.stringify(carrinho));
  if (typeof updateCartBadge === 'function') updateCartBadge();
  window.dispatchEvent(new Event('storage'));
}

// Boot
document.addEventListener('DOMContentLoaded', () => {
  buscarOfertas().then(lista => {
    ofertasOrdenadas = lista;
    paginaAtual = 1;
    renderOfertas(ofertasOrdenadas.slice(0, itensPorPagina));
  });
});
