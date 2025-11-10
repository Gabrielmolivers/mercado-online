

// Adiciona campo de seleção de quantidade nos produtos do carrinho
function renderCarrinho() {
    const carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
    // Sincroniza preços com cache de produtos (caso já carregados em outra página)
    if (window.__PRODUTOS_CACHE__ && Array.isArray(window.__PRODUTOS_CACHE__)) {
        const toNumber = (n)=>{ if (n===null||n===undefined) return NaN; if (typeof n==='number') return n; const s=String(n).replace(',','.'); const v=Number(s); return isNaN(v)?NaN:v; };
        const hoje = new Date(); const today = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
        const parseDate = (s)=>{ if(!s) return null; if (/^\d{4}-\d{2}-\d{2}$/.test(s)){ const [Y,M,D]=s.split('-').map(Number); return new Date(Y,M-1,D);} const m=s.match(/(\d{2})[.\/-](\d{2})[.\/-](\d{4})/); if(m){ return new Date(Number(m[3]), Number(m[2])-1, Number(m[1])); } const d=new Date(s); return isNaN(d)?null:new Date(d.getFullYear(),d.getMonth(),d.getDate()); };
        let mudou=false;
        carrinho.forEach(item => {
            const prod = window.__PRODUTOS_CACHE__.find(p => String(p.procod) === String(item.procod));
            if (!prod) return;
            const precoBase = toNumber(prod.preco);
            const precoPromo = toNumber(prod.precoPromo);
            const fimPromo = parseDate(prod.fimpromo);
            const promoAtiva = !!(fimPromo && fimPromo.getTime() > today.getTime() && !isNaN(precoPromo) && precoPromo>0 && !isNaN(precoBase) && precoPromo < precoBase);
            const precoAtual = promoAtiva ? precoPromo : precoBase;
            if (!isNaN(precoAtual) && Number(item.preco) !== precoAtual) { item.preco = precoAtual; mudou = true; }
            if (prod.und && item.und !== prod.und) { item.und = prod.und; mudou = true; }
        });
        if (mudou) localStorage.setItem('carrinho', JSON.stringify(carrinho));
    }
    const carrinhoLista = document.getElementById('carrinho-lista');
    const carrinhoTotal = document.getElementById('carrinho-total');
    if (!carrinhoLista || !carrinhoTotal) return;
    carrinhoLista.innerHTML = '';
    let total = 0;
    if (carrinho.length === 0) {
        carrinhoLista.innerHTML = '<p>Seu carrinho está vazio.</p>';
        carrinhoTotal.innerHTML = '<h3>Total:<span class="price"> R$ 0,00</span></h3>';
        return;
    }
    carrinho.forEach((item, idx) => {
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <i class="fas fa-trash" data-idx="${idx}"></i>
            <img src="${item.imagem || 'image/SEM-IMAGEM.png'}" alt="${item.nome}">
            <div class="content">
                <h3>${item.nome}</h3>
                <div class="qty-selector" style="margin: 0.5rem 0; display: flex; justify-content: start; align-items: center; gap: 0.5rem;">
                    <button class="qty-minus" type="button">-</button>
                    <input type="number" class="qty-input" min="1" value="${item.qtd || 1}" style="width: 40px; text-align: center; font-size: 1.2rem;">
                    <button class="qty-plus" type="button">+</button>
                </div>
                <span class="price">R$ ${Number(item.preco).toFixed(2)} ${item.und ? '| ' + item.und : ''}</span>
            </div>
        `;
        carrinhoLista.appendChild(div);
        total += Number(item.preco) * (item.qtd || 1);
    });
    carrinhoTotal.innerHTML = `<h3>Total:<span class="price"> R$ ${total.toFixed(2)}</span></h3>`;
    // Botões de quantidade
    carrinhoLista.querySelectorAll('.cart-item').forEach((div, idx) => {
        const minus = div.querySelector('.qty-minus');
        const plus = div.querySelector('.qty-plus');
        const input = div.querySelector('.qty-input');
        minus.onclick = () => {
            let val = parseInt(input.value) || 1;
            if (val > 1) input.value = val - 1;
            carrinho[idx].qtd = parseInt(input.value);
            localStorage.setItem('carrinho', JSON.stringify(carrinho));
            renderCarrinho();
            if (typeof updateCartBadge === 'function') updateCartBadge();
            window.dispatchEvent(new Event('storage'));
        };
        plus.onclick = () => {
            let val = parseInt(input.value) || 1;
            input.value = val + 1;
            carrinho[idx].qtd = parseInt(input.value);
            localStorage.setItem('carrinho', JSON.stringify(carrinho));
            renderCarrinho();
            if (typeof updateCartBadge === 'function') updateCartBadge();
            window.dispatchEvent(new Event('storage'));
        };
        input.oninput = () => {
            if (input.value < 1) input.value = 1;
            carrinho[idx].qtd = parseInt(input.value);
            localStorage.setItem('carrinho', JSON.stringify(carrinho));
            renderCarrinho();
            if (typeof updateCartBadge === 'function') updateCartBadge();
            window.dispatchEvent(new Event('storage'));
        };
    });
    // Remover produto do carrinho (remove completamente)
    carrinhoLista.querySelectorAll('.fa-trash').forEach(trash => {
        trash.onclick = function() {
            const idx = parseInt(this.getAttribute('data-idx'));
            if (idx !== -1) {
                carrinho.splice(idx, 1);
                localStorage.setItem('carrinho', JSON.stringify(carrinho));
                renderCarrinho();
                if (typeof updateCartBadge === 'function') updateCartBadge();
                window.dispatchEvent(new Event('storage'));
            }
        };
    });
}
document.addEventListener('DOMContentLoaded', function () {
    renderCarrinho();
});
