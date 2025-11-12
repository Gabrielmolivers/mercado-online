

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
    const hintsBox = document.getElementById('cart-hints');
    if (!carrinhoLista || !carrinhoTotal) return;
    carrinhoLista.innerHTML = '';
    let total = 0;
    if (carrinho.length === 0) {
        carrinhoLista.innerHTML = '<p>Seu carrinho está vazio.</p>';
        carrinhoTotal.innerHTML = '<h3>Total:<span class="price"> R$ 0,00</span></h3>';
        if (hintsBox) hintsBox.style.display='none';
        return;
    }
        carrinho.forEach((item, idx) => {
                const preco = Number(item.preco);
                const qtd = item.qtd || 1;
                const sub = preco * qtd;
                total += sub;
                const card = document.createElement('div');
                card.className = 'cart-card';
                card.innerHTML = `
                    <div class="thumb"><img src="${item.imagem || 'image/SEM-IMAGEM.png'}" alt="${item.nome}" /></div>
                    <div class="info">
                        <h3>${item.nome}</h3>
                        <div class="meta">${item.und ? ('Unidade: ' + item.und) : ''}</div>
                        <div class="qty-ctrl" data-idx="${idx}">
                            <button type="button" class="qminus">-</button>
                            <input type="number" class="qty-input" min="1" value="${qtd}" />
                            <button type="button" class="qplus">+</button>
                        </div>
                    </div>
                    <div class="price-col">
                        <div class="subtotal">R$ ${sub.toFixed(2)}</div>
                        <button type="button" class="remove" data-idx="${idx}"><i class="fas fa-trash"></i> Remover</button>
                    </div>
                `;
                carrinhoLista.appendChild(card);
        });
    carrinhoTotal.innerHTML = `<h3>Total:<span class="price"> R$ ${total.toFixed(2)}</span></h3>`;
        // Controles de quantidade e remoção (delegação)
        carrinhoLista.querySelectorAll('.cart-card').forEach(card => {
            const idx = parseInt(card.querySelector('.remove')?.getAttribute('data-idx'));
            const minus = card.querySelector('.qminus');
            const plus = card.querySelector('.qplus');
            const input = card.querySelector('.qty-input');
            if (minus) minus.onclick = () => {
                let val = parseInt(input.value) || 1;
                if (val > 1) { input.value = val - 1; carrinho[idx].qtd = parseInt(input.value); localStorage.setItem('carrinho', JSON.stringify(carrinho)); renderCarrinho(); if (typeof updateCartBadge==='function') updateCartBadge(); window.dispatchEvent(new Event('storage')); }
            };
            if (plus) plus.onclick = () => {
                let val = parseInt(input.value) || 1;
                input.value = val + 1;
                carrinho[idx].qtd = parseInt(input.value);
                localStorage.setItem('carrinho', JSON.stringify(carrinho));
                renderCarrinho();
                if (typeof updateCartBadge==='function') updateCartBadge();
                window.dispatchEvent(new Event('storage'));
            };
            if (input) input.oninput = () => {
                let v = parseInt(input.value) || 1;
                if (v < 1) v = 1;
                input.value = v;
                carrinho[idx].qtd = v;
                localStorage.setItem('carrinho', JSON.stringify(carrinho));
                renderCarrinho();
                if (typeof updateCartBadge==='function') updateCartBadge();
                window.dispatchEvent(new Event('storage'));
            };
            const removeBtn = card.querySelector('.remove');
            if (removeBtn) removeBtn.onclick = () => {
                carrinho.splice(idx,1);
                localStorage.setItem('carrinho', JSON.stringify(carrinho));
                renderCarrinho();
                if (typeof updateCartBadge==='function') updateCartBadge();
                window.dispatchEvent(new Event('storage'));
            };
        });

        // Hints de frete grátis (se parâmetros disponíveis)
        if (hintsBox) {
            const params = window.__PARAMS__ || {};
            const min = Number(params.vlr_pedminimo) || 50;
            const falta = Math.max(0, min - total);
            const perc = Math.min(100, Math.round(((min - falta) / min) * 100));
            hintsBox.style.display='block';
            hintsBox.innerHTML = `
                <div class="hint-line"><i class="fas fa-truck"></i> ${falta > 0 ? `Faltam <strong>R$ ${falta.toFixed(2)}</strong> para frete grátis` : 'Você ganhou frete grátis!'}</div>
                <div class="progress"><div class="bar" style="width:${perc}%;"></div></div>
            `;
        }
}
document.addEventListener('DOMContentLoaded', function () {
    renderCarrinho();
});
