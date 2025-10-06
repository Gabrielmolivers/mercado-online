const searchForm = document.querySelector('.search-form');

const searchBtn = document.querySelector('#search-btn');
if (searchBtn) {
    searchBtn.onclick = () => {
        if (searchForm) searchForm.classList.add('active');
        if (shoppingCart) shoppingCart.classList.remove('active');
        if (loginForm) loginForm.classList.remove('active');
        if (navbar) navbar.classList.remove('active');
        const searchBox = document.getElementById('search-box');
        if (searchBox) {
            searchBox.focus();
        }
    };
}
// Redireciona ao submeter o formulário de busca
if (searchForm) {
    searchForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const searchBox = document.getElementById('search-box');
        if (searchBox) {
            const termo = searchBox.value.trim();
            if (termo) {
                window.location.href = `produtos.html?search=${encodeURIComponent(termo)}`;
                searchBox.value = '';
            } else {
                searchBox.value = '';
                searchBox.focus();
            }
        }
    });
}

let shoppingCart = document.querySelector('.shopping-cart');

const cartBtn = document.querySelector('#cart-btn');
if (cartBtn) {
    cartBtn.onclick = () => {
        if (shoppingCart) shoppingCart.classList.toggle('active');
        if (searchForm) searchForm.classList.remove('active');
        if (loginForm) loginForm.classList.remove('active');
        if (navbar) navbar.classList.remove('active');
    };
}

let loginForm = document.querySelector('.login-form');
const loginBtn = document.querySelector('#login-btn');
if (loginBtn) {
    loginBtn.onclick = () => {
        if (loginForm) loginForm.classList.toggle('active');
        if (searchForm) searchForm.classList.remove('active');
        if (shoppingCart) shoppingCart.classList.remove('active');
        if (navbar) navbar.classList.remove('active');
    };
}

let navbar = document.querySelector('.navbar');

const menuBtn = document.querySelector('#menu-btn');
if (menuBtn) {
    menuBtn.onclick = () => {
        if (navbar) navbar.classList.toggle('active');
        if (searchForm) searchForm.classList.remove('active');
        if (shoppingCart) shoppingCart.classList.remove('active');
        if (loginForm) loginForm.classList.remove('active');
    };
}

window.onscroll = () => {
    searchForm.classList.remove('active');
    shoppingCart.classList.remove('active');
    loginForm.classList.remove('active');
    navbar.classList.remove('active');
}



if (typeof Swiper !== 'undefined') {
    var swiper = new Swiper(".produto-slider, .categorias-slider", {
        loop: true,
        spaceBetween: 20,

        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },

        autoplay: {
            delay: 7500,
            disableOnInteraction: false,
        },

        breakpoints: {
            0: {
                slidesPerView: 2,
            },
            768: {
                slidesPerView: 3,
            },
            1020: {
                slidesPerView: 4,
            },
            1240: {
                slidesPerView: 5,
            },
        }
    });
}

// Função para conectar ao banco Firebird
function conectarBanco() {
    fetch('/api/conectar')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert(data.message);
            } else {
                alert('Erro: ' + data.error);
            }
        })
        .catch(err => alert('Erro: ' + err));
}


// Adiciona eventos aos botões
window.addEventListener('DOMContentLoaded', function() {
    var btnConectar = document.getElementById('btn-conectar');
    if (btnConectar) btnConectar.addEventListener('click', conectarBanco);
    
});

// Adiciona badge de quantidade ao ícone do carrinho
function updateCartBadge() {
    const cartBtn = document.getElementById('cart-btn');
    if (!cartBtn) return;
    let badge = cartBtn.querySelector('.cart-qty-badge');
    let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
    const qty = carrinho.reduce((sum, item) => sum + (typeof item.qtd === 'number' ? item.qtd : 1), 0);
    if (!badge) {
        badge = document.createElement('span');
        badge.className = 'cart-qty-badge';
        cartBtn.appendChild(badge);
    }
    badge.textContent = qty > 0 ? qty : '0'; // Mostra 0 quando vazio
}

// Atualiza o header do carrinho com os itens
function atualizarCarrinhoHeader() {
    let carrinho = JSON.parse(localStorage.getItem('carrinho') || '[]');
    let shoppingCart = document.querySelector('.shopping-cart');
    if (!shoppingCart) return;
    shoppingCart.innerHTML = '';
    let total = 0;
        carrinho.slice(0, 3).forEach((item, idx) => {
            let imgSrc = item.img || item.imagem || 'image/SEM-IMAGEM.png';
            let precoNum = typeof item.preco === 'string' ? parseFloat(item.preco.replace(',', '.')) : Number(item.preco);
            let subtotal = precoNum * (item.qtd || 1);
            total += subtotal;
            shoppingCart.innerHTML += `
                <div class="cart-item">
                    <i class="fas fa-trash" data-procod="${item.procod}"></i>
                    <img src="${imgSrc}" alt="${item.nome}">
                    <div class="content">
                        <h3>${item.nome}</h3>
                        <div class="qty-selector" style="margin: 0.5rem 0; display: flex; align-items: center; gap: 0.5rem;">
                            <button class="qty-minus" type="button" data-idx="${idx}">-</button>
                            <input type="number" class="qty-input" min="1" value="${item.qtd || 1}" style="width: 40px; text-align: center; font-size: 1.2rem;">
                            <button class="qty-plus" type="button" data-idx="${idx}">+</button>
                        </div>
                        <span class="price">R$ ${precoNum.toFixed(2)} ${item.und ? '| ' + item.und : ''}</span>
                    </div>
                </div>
            `;
    });
    let totalQtd = carrinho.reduce((acc, item) => acc + (item.qtd || 1), 0);
    shoppingCart.innerHTML += `<div class=\"ver-mais\"><a href=\"carrinho.html\" class=\"btn-ver-mais\">VER CARRINHO (${totalQtd})</a></div>`;
    shoppingCart.innerHTML += `<div class=\"total\"><h3>Total:<span class=\"price\"> R$ ${total.toFixed(2)}</span></h3></div>`;
    shoppingCart.innerHTML += `<a href=\"#\" class=\"btn\">Finalizar Compra</a>`;

        // Eventos de quantidade no header
        shoppingCart.querySelectorAll('.cart-item').forEach((div, idx) => {
            const minus = div.querySelector('.qty-minus');
            const plus = div.querySelector('.qty-plus');
            const input = div.querySelector('.qty-input');
            minus.onclick = () => {
                let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
                if (carrinho[idx].qtd > 1) {
                    carrinho[idx].qtd -= 1;
                    localStorage.setItem('carrinho', JSON.stringify(carrinho));
                    atualizarCarrinhoHeader();
                    if (typeof updateCartBadge === 'function') updateCartBadge();
                    window.dispatchEvent(new Event('storage'));
                }
            };
            plus.onclick = () => {
                let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
                carrinho[idx].qtd += 1;
                localStorage.setItem('carrinho', JSON.stringify(carrinho));
                atualizarCarrinhoHeader();
                if (typeof updateCartBadge === 'function') updateCartBadge();
                window.dispatchEvent(new Event('storage'));
            };
            input.oninput = () => {
                let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
                let val = parseInt(input.value) || 1;
                if (val < 1) val = 1;
                carrinho[idx].qtd = val;
                localStorage.setItem('carrinho', JSON.stringify(carrinho));
                atualizarCarrinhoHeader();
                if (typeof updateCartBadge === 'function') updateCartBadge();
                window.dispatchEvent(new Event('storage'));
            };
        });
}

// Atualiza badge ao carregar página e ao modificar carrinho
window.addEventListener('DOMContentLoaded', updateCartBadge);
window.addEventListener('storage', updateCartBadge);

// Observa alterações no localStorage do carrinho e atualiza badge imediatamente
(function observeCarrinho() {
    let lastCarrinho = localStorage.getItem('carrinho');
    setInterval(() => {
        const atualCarrinho = localStorage.getItem('carrinho');
        if (atualCarrinho !== lastCarrinho) {
            lastCarrinho = atualCarrinho;
            updateCartBadge();
        }
    }, 300);
})();



