

// Adiciona campo de seleção de quantidade nos produtos do carrinho
function renderCarrinho() {
    const carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
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
