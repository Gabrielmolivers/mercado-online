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
      // Apenas promoções ativas e válidas (robusto): usa flag promoAtivo OU checa datas e valores
      const toNumber = (n) => {
        if (n === null || n === undefined) return NaN;
        if (typeof n === 'number') return n;
        const s = String(n).replace(',', '.');
        const v = Number(s);
        return isNaN(v) ? NaN : v;
      };
      const now = new Date();
      const onlyPromos = data.produtos.filter(p => {
        const precoBaseNum = toNumber(p.preco);
        const precoPromoNum = toNumber(p.precoPromo);
        const precoCond = precoPromoNum > 0 && precoPromoNum < precoBaseNum;
        const fimOk = p.fimpromo ? (new Date(p.fimpromo) >= now) : false;
        const iniOk = p.inipromo ? (new Date(p.inipromo) <= now) : true;
        return (p.promoAtivo && precoCond) || (precoCond && fimOk && iniOk);
      });
      // Ordena por maior desconto (%)
      onlyPromos.sort((a,b) => Number(b.descontoPerc||0) - Number(a.descontoPerc||0));
      return onlyPromos;
    })
    .catch(() => { if (loader) loader.style.display = 'none'; return []; });
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
    const precoBaseFmt = Number(prod.preco).toFixed(2);
    const precoPromoFmt = Number(prod.precoPromo).toFixed(2);
    box.innerHTML = `
      <div class="badge-desconto">-${Number(prod.descontoPerc||0)}%</div>
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
      const prodCarrinho = { ...prod, preco: Number(prod.precoPromo) };
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
  if (idx > -1) carrinho[idx].qtd += qtd; else carrinho.push({ ...produto, qtd });
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
