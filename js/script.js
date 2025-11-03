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
        // Atualiza o conteúdo do mini-carrinho sempre que abrir
        if (typeof atualizarCarrinhoHeader === 'function') atualizarCarrinhoHeader();
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



// Swiper não é mais auto-inicializado aqui.
// Cada página deve inicializar seus próprios sliders após montar o conteúdo
// para evitar conflitos com itens dinâmicos.

// Função para conectar ao banco Firebird
function conectarBanco() {
    fetch(apiUrl('/api/conectar'))
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
    // Atualiza título do login dinamicamente
    function atualizarTituloLogin() {
        const usuario = localStorage.getItem('usuarioLogado');
        let nome = 'visitante';
        if (usuario) {
            try {
                nome = JSON.parse(usuario).nome;
            } catch {}
        }
        document.querySelectorAll('#login-title').forEach(el => {
            el.textContent = `Olá, ${nome}`;
        });
    }
    atualizarTituloLogin();
    window.addEventListener('storage', atualizarTituloLogin);
    window.addEventListener('usuarioLogado', atualizarTituloLogin);
    var btnConectar = document.getElementById('btn-conectar');
    if (btnConectar) btnConectar.addEventListener('click', conectarBanco);

    // Login
    var loginForm = document.querySelector('.login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = loginForm.querySelector('input[type="email"]').value.trim();
            const senha = loginForm.querySelector('input[type="password"]').value.trim();
            if (!email || !senha) {
                alert('Preencha email e senha.');
                return;
            }
            fetch(apiUrl('/api/login'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    // Busca dados completos do cliente após login
                    fetch(apiUrl(`/api/cliente/${data.usuario.id}`))
                        .then(res => res.json())
                        .then(cli => {
                            if (cli.success && cli.cliente) {
                                // Junta dados básicos e dados de endereço
                                const usuarioCompleto = { ...data.usuario, ...cli.cliente };
                                localStorage.setItem('usuarioLogado', JSON.stringify(usuarioCompleto));
                                mostrarAreaLogada(usuarioCompleto);
                            } else {
                                localStorage.setItem('usuarioLogado', JSON.stringify(data.usuario));
                                mostrarAreaLogada(data.usuario);
                            }
                            loginForm.classList.remove('active');
                        })
                        .catch(() => {
                            localStorage.setItem('usuarioLogado', JSON.stringify(data.usuario));
                            mostrarAreaLogada(data.usuario);
                            loginForm.classList.remove('active');
                        });
                } else {
                    alert(data.error || 'Erro ao logar.');
                }
            })
            .catch(() => alert('Erro ao conectar ao servidor.'));
        });

        // Ao abrir o login, mostra área logada se já estiver logado
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) {
            loginBtn.onclick = function() {
                if (loginForm) loginForm.classList.toggle('active');
                if (searchForm) searchForm.classList.remove('active');
                if (shoppingCart) shoppingCart.classList.remove('active');
                if (navbar) navbar.classList.remove('active');
                const usuario = localStorage.getItem('usuarioLogado');
                if (usuario) {
                    // Oculta campos de email/senha e mostra área logada
                    loginForm.querySelector('input[type="email"]').style.display = 'none';
                    loginForm.querySelector('input[type="password"]').style.display = 'none';
                    loginForm.querySelector('button[type="submit"]').style.display = 'none';
                    loginForm.querySelector('button.criar-btn').style.display = 'none';
                    loginForm.querySelector('a').style.display = 'none';
                    let area = loginForm.querySelector('#area-logada-login');
                    if (!area) {
                        area = document.createElement('div');
                        area.id = 'area-logada-login';
                        area.style = 'margin-top:10px;background:#e3f2fd;padding:8px 16px;border-radius:8px;color:#1a4fa3;font-weight:bold;display:flex;flex-direction:column;align-items:flex-start;gap:10px;';
                        loginForm.appendChild(area);
                    }
                    const userObj = JSON.parse(usuario);
                    // Atualiza título do login
                    const loginTitle = loginForm.querySelector('#login-title');
                    if (loginTitle) loginTitle.textContent = `Olá, ${userObj.nome}`;
                                        // Ações rápidas: apenas Ver perfil
                                        area.innerHTML = `
                                                <div style="display:flex;flex-direction:column;gap:6px;">
                                                    <button id="perfil-btn-login" style="background:none;color:#1976d2;border:none;padding:0;font-weight:bold;cursor:pointer;text-decoration:none;">Ver perfil</button>
                                                </div>
                                        `;
                    // Botão sair fora do quadro azul
                    let btnSair = loginForm.querySelector('#logout-btn-login');
                    if (!btnSair) {
                        btnSair = document.createElement('button');
                        btnSair.id = 'logout-btn-login';
                        btnSair.textContent = 'Sair';
                        btnSair.style = 'background:#fff;color:#1976d2;border:1px solid #1976d2;padding:6px 18px;border-radius:6px;cursor:pointer;font-weight:bold;margin-top:12px;display:block;width:100%;transition:background 0.2s,color 0.2s;';
                        btnSair.onmouseover = function() { this.style.background = '#1976d2'; this.style.color = '#fff'; };
                        btnSair.onmouseout = function() { this.style.background = '#fff'; this.style.color = '#1976d2'; };
                        loginForm.appendChild(btnSair);
                    }
                    document.getElementById('perfil-btn-login').onclick = function() {
                        window.location.href = 'perfil.html';
                    };
                    // Removido botão "Meus pedidos" do header/login
                    btnSair.onclick = function() {
                        localStorage.removeItem('usuarioLogado');
                        area.remove();
                        btnSair.remove();
                        if (loginTitle) loginTitle.textContent = 'Olá, Gabriel';
                        loginForm.querySelector('input[type="email"]').style.display = '';
                        loginForm.querySelector('input[type="password"]').style.display = '';
                        loginForm.querySelector('button[type="submit"]').style.display = '';
                        loginForm.querySelector('button.criar-btn').style.display = '';
                        loginForm.querySelector('a').style.display = '';
                    };
                } else {
                    // Exibe campos normalmente se não estiver logado
                    let area = loginForm.querySelector('#area-logada-login');
                    if (area) area.remove();
                    loginForm.querySelector('input[type="email"]').style.display = '';
                    loginForm.querySelector('input[type="password"]').style.display = '';
                    loginForm.querySelector('button[type="submit"]').style.display = '';
                    loginForm.querySelector('button.criar-btn').style.display = '';
                    loginForm.querySelector('a').style.display = '';
                }
            };
        }
    }
});

// Exibe área logada no header
function mostrarAreaLogada(usuario) {
    // Não exibe mais área logada no topo do header
}

// Exibe área logada se já estiver logado
// Não exibe mais área logada no topo ao carregar página

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

        // Botão "Finalizar Compra" do header: se logado, vai para checkout; senão, vai para cadastro
        const finalizarHeader = shoppingCart.querySelector('a.btn');
        if (finalizarHeader) {
            finalizarHeader.addEventListener('click', function(e) {
                e.preventDefault();
                const carrinhoAtual = JSON.parse(localStorage.getItem('carrinho') || '[]');
                if (!carrinhoAtual.length) {
                    alert('Seu carrinho está vazio.');
                    return;
                }
                const usuario = JSON.parse(localStorage.getItem('usuarioLogado') || 'null');
                if (!usuario || !usuario.id) {
                    alert('Você precisa estar logado para continuar.');
                    window.location.href = 'cadastro.html';
                    return;
                }
                window.location.href = 'checkout.html';
            });
        }
}

// Delegação: remover item do mini-carrinho pelo ícone de lixeira
document.addEventListener('click', function(e) {
    const icon = e.target.closest('.shopping-cart .fa-trash');
    if (!icon) return;
    const procod = icon.getAttribute('data-procod');
    let carrinho = JSON.parse(localStorage.getItem('carrinho') || '[]');
    const idx = carrinho.findIndex(item => String(item.procod) === String(procod));
    if (idx !== -1) {
        carrinho.splice(idx, 1);
        localStorage.setItem('carrinho', JSON.stringify(carrinho));
        if (typeof atualizarCarrinhoHeader === 'function') atualizarCarrinhoHeader();
        if (typeof updateCartBadge === 'function') updateCartBadge();
        window.dispatchEvent(new Event('storage'));
    }
});

// Mantém o mini-carrinho atualizado em todas as páginas
window.addEventListener('DOMContentLoaded', function() {
    if (typeof atualizarCarrinhoHeader === 'function') atualizarCarrinhoHeader();
});
window.addEventListener('storage', function() {
    if (typeof atualizarCarrinhoHeader === 'function') atualizarCarrinhoHeader();
});

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



