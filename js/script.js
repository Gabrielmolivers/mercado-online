// Inicialização segura do header (executada após layout.js injetar o HTML)
function initializeHeaderInteractions(){
    const searchForm = document.querySelector('.search-form');
    let shoppingCart = document.querySelector('.shopping-cart');
    let loginForm = document.querySelector('.login-form');
    let navbar = document.querySelector('.navbar');

    const searchBtn = document.querySelector('#search-btn');
    if (searchBtn) {
        searchBtn.onclick = () => {
            if (searchForm) searchForm.classList.add('active');
            if (shoppingCart) shoppingCart.classList.remove('active');
            if (loginForm) loginForm.classList.remove('active');
            if (navbar) navbar.classList.remove('active');
            const searchBox = document.getElementById('search-box');
            if (searchBox) searchBox.focus();
        };
    }
    if (searchForm && !searchForm.__boundSubmit) {
        searchForm.__boundSubmit = true;
        searchForm.addEventListener('submit', function(e){
            e.preventDefault();
            const searchBox = document.getElementById('search-box');
            if (searchBox){
                const termo = searchBox.value.trim();
                if (termo){
                    window.location.href = `produtos.html?search=${encodeURIComponent(termo)}`;
                    searchBox.value='';
                } else {
                    searchBox.value='';
                    searchBox.focus();
                }
            }
        });
    }
    const cartBtn = document.querySelector('#cart-btn');
    if (cartBtn) {
        cartBtn.onclick = () => {
            if (typeof atualizarCarrinhoHeader === 'function') atualizarCarrinhoHeader();
            if (shoppingCart) shoppingCart.classList.toggle('active');
            if (searchForm) searchForm.classList.remove('active');
            if (loginForm) loginForm.classList.remove('active');
            if (navbar) navbar.classList.remove('active');
        };
    }
        // Login: handler centralizado em bindLoginFlow() para evitar duplo toggle
    const menuBtn = document.querySelector('#menu-btn');
    if (menuBtn) {
        menuBtn.onclick = () => {
            if (navbar) navbar.classList.toggle('active');
            if (searchForm) searchForm.classList.remove('active');
            if (shoppingCart) shoppingCart.classList.remove('active');
            if (loginForm) loginForm.classList.remove('active');
        };
    }
    window.addEventListener('scroll', () => {
        if (searchForm) searchForm.classList.remove('active');
        if (shoppingCart) shoppingCart.classList.remove('active');
        if (loginForm) loginForm.classList.remove('active');
        if (navbar) navbar.classList.remove('active');
    }, { passive: true });
}

// Toast moderno reutilizável
function showToast(message, opts){
    const cfg = Object.assign({ type:'info', timeout:4000, icon:true }, opts||{});
    const palette = {
        info:   { bg:'#1657cf', fg:'#fff', icon:'fa-info-circle' },
        success:{ bg:'#2e7d32', fg:'#fff', icon:'fa-check-circle' },
        error:  { bg:'#d32f2f', fg:'#fff', icon:'fa-times-circle' },
        warning:{ bg:'#ff9800', fg:'#fff', icon:'fa-exclamation-triangle' }
    };
    const p = palette[cfg.type] || palette.info;
    let container = document.getElementById('toast-container');
    if (!container){
        container = document.createElement('div');
        container.id='toast-container';
        container.style.position='fixed';
        container.style.top='20px';
        container.style.right='20px';
        container.style.zIndex='10000';
        container.style.display='flex';
        container.style.flexDirection='column';
        container.style.gap='12px';
        container.setAttribute('aria-live','polite');
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className='toast-item';
    toast.style.background=p.bg;
    toast.style.color=p.fg;
    toast.style.minWidth='240px';
    toast.style.maxWidth='360px';
    toast.style.padding='14px 18px 12px';
    toast.style.borderRadius='14px';
    toast.style.boxShadow='0 6px 18px rgba(0,0,0,.18)';
    toast.style.fontFamily='Poppins, sans-serif';
    toast.style.fontSize='1.35rem';
    toast.style.display='flex';
    toast.style.alignItems='flex-start';
    toast.style.gap='10px';
    toast.style.position='relative';
    toast.style.overflow='hidden';
    toast.style.opacity='0';
    toast.style.transform='translateY(-8px)';
    toast.style.transition='opacity .35s ease, transform .35s ease';
    toast.setAttribute('role','alert');
    if (cfg.icon){
        const ic = document.createElement('i');
        ic.className='fas '+p.icon;
        ic.style.fontSize='1.6rem';
        ic.style.flex='0 0 auto';
        ic.style.marginTop='2px';
        toast.appendChild(ic);
    }
    const span = document.createElement('span');
    span.textContent=message;
    span.style.flex='1';
    span.style.lineHeight='1.4';
    span.style.fontWeight='600';
    toast.appendChild(span);
    const close = document.createElement('button');
    close.innerHTML='&times;';
    close.style.background='transparent';
    close.style.color=p.fg;
    close.style.border='none';
    close.style.fontSize='1.8rem';
    close.style.cursor='pointer';
    close.style.lineHeight='1';
    close.style.flex='0 0 auto';
    close.style.padding='0 4px';
    close.style.marginTop='-2px';
    close.addEventListener('click', () => dismiss());
    toast.appendChild(close);
    const bar = document.createElement('div');
    bar.style.position='absolute';
    bar.style.left='0';
    bar.style.bottom='0';
    bar.style.height='4px';
    bar.style.background='rgba(255,255,255,.65)';
    bar.style.width='100%';
    bar.style.transformOrigin='left';
    bar.style.animation=`toast-progress ${cfg.timeout}ms linear forwards`;
    toast.appendChild(bar);
    container.appendChild(toast);
    requestAnimationFrame(()=>{ toast.style.opacity='1'; toast.style.transform='translateY(0)'; });
    let closed=false;
    function dismiss(){
        if (closed) return; closed=true;
        toast.style.opacity='0'; toast.style.transform='translateY(-8px)';
        setTimeout(()=>{ toast.remove(); if (!container.children.length) container.remove(); }, 350);
    }
    setTimeout(dismiss, cfg.timeout + 50);
    return { dismiss };
}

// Chama imediatamente caso o layout já tenha sido injetado
initializeHeaderInteractions();
// Reexecuta após DOM pronto (garantia)
document.addEventListener('DOMContentLoaded', initializeHeaderInteractions);
// Permite que layout.js re-chame se reinjetar conteúdo
window.initializeHeaderInteractions = initializeHeaderInteractions;
window.showToast = showToast;
// Atualiza saudação ao carregar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){ if (typeof updateHeaderUserGreet==='function') updateHeaderUserGreet(); });
} else {
    if (typeof updateHeaderUserGreet==='function') updateHeaderUserGreet();
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
                if (typeof showToast==='function') showToast(data.message || 'Conectado.', {type:'success'});
            } else {
                if (typeof showToast==='function') showToast('Erro: '+(data.error||'Falha'), {type:'error'});
            }
        })
    .catch(err => { if (typeof showToast==='function') showToast('Erro: '+err, {type:'error'}); });
}


// Adiciona eventos aos botões
function bindLoginFlow(){
    const loginForm = document.querySelector('.login-form');
    if (!loginForm || loginForm.__boundLogin) return;
    loginForm.__boundLogin = true;
    function atualizarTituloLogin(){
        const usuario = localStorage.getItem('usuarioLogado');
        let nome = 'visitante';
        if (usuario) { try { nome = JSON.parse(usuario).nome || nome; } catch(e){} }
        document.querySelectorAll('#login-title').forEach(el => { el.textContent = `Olá, ${nome}`; });
    }
    atualizarTituloLogin(); if (typeof updateHeaderUserGreet==='function') updateHeaderUserGreet();
    window.addEventListener('storage', atualizarTituloLogin);
    window.addEventListener('usuarioLogado', function(){ atualizarTituloLogin(); if (typeof updateHeaderUserGreet==='function') updateHeaderUserGreet(); });

    loginForm.addEventListener('submit', function(e){
        e.preventDefault();
        const emailEl = loginForm.querySelector('input[type="email"]');
        const senhaEl = loginForm.querySelector('input[type="password"]');
        const rememberEl = loginForm.querySelector('#remember-email');
    // Email case-insensitive: envia sempre em lowercase
        const email = emailEl ? emailEl.value.trim().toLowerCase() : '';
        const senha = senhaEl ? senhaEl.value.trim() : '';
    if (!email || !senha){ if (typeof showToast==='function') showToast('Preencha email e senha.', {type:'warning'}); return; }
        // Persistência do email se marcado "Lembrar meu email"
        try {
            if (rememberEl && rememberEl.checked) {
                localStorage.setItem('remember_email', email);
            } else {
                localStorage.removeItem('remember_email');
            }
        } catch(e){}
        fetch(apiUrl('/api/login'), { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, senha }) })
            .then(r => r.json())
            .then(data => {
                if (!data.success){ if (typeof showToast==='function') showToast(data.error || 'Erro ao logar.', {type:'error'}); return; }
                fetch(apiUrl(`/api/cliente/${data.usuario.id}`))
                    .then(r => r.json())
                    .then(cli => {
                        let usuarioCompleto = data.usuario;
                        if (cli.success && cli.cliente){ usuarioCompleto = { ...data.usuario, ...cli.cliente }; }
                        localStorage.setItem('usuarioLogado', JSON.stringify(usuarioCompleto));
                        atualizarTituloLogin(); if (typeof updateHeaderUserGreet==='function') updateHeaderUserGreet();
                        loginForm.classList.remove('active');
                        // limpa campos
                        if (emailEl) emailEl.value=''; if (senhaEl) senhaEl.value='';
                        if (typeof showToast === 'function') showToast('CONECTADO COM SUCESSO');
                    })
                    .catch(() => {
                        localStorage.setItem('usuarioLogado', JSON.stringify(data.usuario));
                        atualizarTituloLogin(); if (typeof updateHeaderUserGreet==='function') updateHeaderUserGreet();
                        loginForm.classList.remove('active');
                        if (typeof showToast === 'function') showToast('CONECTADO COM SUCESSO');
                    });
            })
            .catch(() => { if (typeof showToast==='function') showToast('Erro ao conectar ao servidor.', {type:'error'}); });
    });

    const loginBtn = document.getElementById('login-btn');
    if (loginBtn && !loginBtn.__override){
        loginBtn.__override = true;
            loginBtn.addEventListener('click', function(){
                if (loginForm) loginForm.classList.toggle('active');
                // Fecha outros painéis ao abrir o login
                const sf = document.querySelector('.search-form'); if (sf) sf.classList.remove('active');
                const sc = document.querySelector('.shopping-cart'); if (sc) sc.classList.remove('active');
                const nb = document.querySelector('.navbar'); if (nb) nb.classList.remove('active');
            const usuario = localStorage.getItem('usuarioLogado');
            if (usuario){
                // Exibe só saudação e ações rápidas
                const userObj = JSON.parse(usuario);
                const titulo = loginForm.querySelector('#login-title'); if (titulo) titulo.textContent = `Olá, ${userObj.nome}`;
                ['email','password'].forEach(t => { const el = loginForm.querySelector(`input[type="${t}"]`); if (el) el.style.display='none'; });
                // Esconde o lembrete de email quando logado
                const rememberLabel = loginForm.querySelector('label[for="remember-email"], label:has(#remember-email)');
                if (rememberLabel) rememberLabel.style.display = 'none';
                ['submit','button'].forEach(sel => { const b = loginForm.querySelector(`button[type="${sel}"]`); if (b && sel==='submit') b.style.display='none'; });
                const criar = loginForm.querySelector('button.criar-btn'); if (criar) criar.style.display='none';
                const esqueci = loginForm.querySelector('a'); if (esqueci) esqueci.style.display='none';
                let area = loginForm.querySelector('#area-logada-login');
                if (!area){
                    area = document.createElement('div');
                    area.id='area-logada-login';
                    area.style='margin-top:10px;background:#e3f2fd;padding:8px 16px;border-radius:8px;color:#1a4fa3;font-weight:bold;display:flex;flex-direction:column;gap:10px;';
                    loginForm.appendChild(area);
                }
                area.innerHTML = `<button id="perfil-btn-login" style="background:none;color:#1976d2;border:none;padding:0;font-weight:bold;cursor:pointer;text-decoration:none;">Ver perfil</button>`;
                const btnPerfil = area.querySelector('#perfil-btn-login'); if (btnPerfil) btnPerfil.onclick = () => { window.location.href='perfil.html'; };
                let btnSair = loginForm.querySelector('#logout-btn-login');
                if (!btnSair){
                    btnSair = document.createElement('button');
                    btnSair.id='logout-btn-login';
                    btnSair.textContent='Sair';
                    btnSair.style='background:#fff;color:#1976d2;border:1px solid #1976d2;padding:6px 18px;border-radius:6px;cursor:pointer;font-weight:bold;margin-top:12px;display:block;width:100%;transition:background .2s,color .2s;';
                    btnSair.onmouseover=function(){ this.style.background='#1976d2'; this.style.color='#fff'; };
                    btnSair.onmouseout=function(){ this.style.background='#fff'; this.style.color='#1976d2'; };
                    loginForm.appendChild(btnSair);
                }
                btnSair.onclick=function(){
                    localStorage.removeItem('usuarioLogado'); if (typeof updateHeaderUserGreet==='function') updateHeaderUserGreet();
                    if (area) area.remove(); if (btnSair) btnSair.remove();
                    ['email','password'].forEach(t => { const el = loginForm.querySelector(`input[type="${t}"]`); if (el) el.style.display=''; });
                    const submitBtn = loginForm.querySelector('button[type="submit"]'); if (submitBtn) submitBtn.style.display='';
                    const criarBtn = loginForm.querySelector('button.criar-btn'); if (criarBtn) criarBtn.style.display='';
                    const esqueci2 = loginForm.querySelector('a'); if (esqueci2) esqueci2.style.display='';
                    if (titulo) titulo.textContent='Olá, visitante';
                };
            } else {
                // Garantir exibição de campos se não logado
                const area = loginForm.querySelector('#area-logada-login'); if (area) area.remove();
                const btnSair = loginForm.querySelector('#logout-btn-login'); if (btnSair) btnSair.remove();
                ['email','password'].forEach(t => { const el = loginForm.querySelector(`input[type="${t}"]`); if (el) el.style.display=''; });
                // Mostra lembrete quando não logado
                const rememberLabel = loginForm.querySelector('label[for="remember-email"], label:has(#remember-email)');
                if (rememberLabel) rememberLabel.style.display = '';
                const submitBtn = loginForm.querySelector('button[type="submit"]'); if (submitBtn) submitBtn.style.display='';
                const criarBtn = loginForm.querySelector('button.criar-btn'); if (criarBtn) criarBtn.style.display='';
                const esqueci2 = loginForm.querySelector('a'); if (esqueci2) esqueci2.style.display='';
                // Pré-preenche email lembrado, se existir
                try {
                    const saved = localStorage.getItem('remember_email');
                    if (saved && loginForm) {
                        const emailEl2 = loginForm.querySelector('input[type="email"]');
                        const rememberEl2 = loginForm.querySelector('#remember-email');
                        if (emailEl2) emailEl2.value = saved;
                        if (rememberEl2) rememberEl2.checked = true;
                    }
                } catch(e){}
            }
        });
    }
}

bindLoginFlow();
document.addEventListener('DOMContentLoaded', bindLoginFlow);
window.bindLoginFlow = bindLoginFlow;

// Exibe área logada no header
function updateHeaderUserGreet(){
    try {
        const span = document.getElementById('header-user-greet');
        if (!span) return;
        const data = JSON.parse(localStorage.getItem('usuarioLogado') || 'null');
        let nome = 'visitante';
        if (data && data.nome) {
            const parts = String(data.nome).trim().split(/\s+/);
            nome = parts[0] || data.nome;
        }
        span.textContent = `Olá, ${nome}`;
        // Tornar a saudação um atalho para abrir o painel de login/perfil
        if (!span.__boundClick){
            span.__boundClick = true;
            span.style.cursor = 'pointer';
            span.addEventListener('click', function(){
                const loginBtn = document.getElementById('login-btn');
                if (loginBtn) loginBtn.click();
            });
        }
    } catch(e){}
}
// Compatibilidade com chamadas existentes
function mostrarAreaLogada(){ updateHeaderUserGreet(); }

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
    // Atualiza preços dos itens do carrinho com base nos dados atuais de produtos (promoções e valores vigentes)
    // Usa cache de produtos se existir; se não, busca e depois re-renderiza.
    function refreshPrices(baseProdutos){
        if (!Array.isArray(baseProdutos)) return;
        let mudou = false;
        const toNumber = (n)=>{ if (n===null||n===undefined) return NaN; if (typeof n==='number') return n; const s=String(n).replace(',','.'); const v=Number(s); return isNaN(v)?NaN:v; };
        const hoje = new Date(); const today = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
        const parseDate = (s)=>{ if(!s) return null; if (/^\d{4}-\d{2}-\d{2}$/.test(s)){ const [Y,M,D]=s.split('-').map(Number); return new Date(Y,M-1,D);} const m=s.match(/(\d{2})[.\/-](\d{2})[.\/-](\d{4})/); if(m){ return new Date(Number(m[3]), Number(m[2])-1, Number(m[1])); } const d=new Date(s); return isNaN(d)?null:new Date(d.getFullYear(),d.getMonth(),d.getDate()); };
        carrinho.forEach(item => {
            const prod = baseProdutos.find(p => String(p.procod) === String(item.procod));
            if (!prod) return;
            const precoBase = toNumber(prod.preco);
            const precoPromo = toNumber(prod.precoPromo);
            const fimPromo = parseDate(prod.fimpromo);
            const promoAtiva = !!(fimPromo && fimPromo.getTime() > today.getTime() && !isNaN(precoPromo) && precoPromo>0 && !isNaN(precoBase) && precoPromo < precoBase);
            const precoAtual = promoAtiva ? precoPromo : precoBase;
            if (!isNaN(precoAtual) && Number(item.preco) !== precoAtual) {
                item.preco = precoAtual;
                mudou = true;
            }
            // Atualiza UND caso tenha mudado
            if (prod.und && item.und !== prod.und){ item.und = prod.und; mudou = true; }
        });
        if (mudou){ localStorage.setItem('carrinho', JSON.stringify(carrinho)); }
    }
    if (window.__PRODUTOS_CACHE__) {
        refreshPrices(window.__PRODUTOS_CACHE__);
    } else {
        // Busca silenciosa de todos produtos para garantir sincronização (limit alto)
        fetch(apiUrl('/api/produtos?offset=0&limit=10000&_=' + Date.now()))
          .then(r=>r.json())
          .then(data => { if (data.success && Array.isArray(data.produtos)) { window.__PRODUTOS_CACHE__ = data.produtos; refreshPrices(data.produtos); atualizarCarrinhoHeader(); } })
          .catch(()=>{});
    }
    let shoppingCart = document.querySelector('.shopping-cart');
    if (!shoppingCart) return;
    shoppingCart.innerHTML = '';
    // Total deve considerar TODOS os itens do carrinho, não apenas os exibidos
    const total = (carrinho || []).reduce((acc, item) => {
        const precoNum = typeof item.preco === 'string' ? parseFloat(String(item.preco).replace(',', '.')) : Number(item.preco);
        const qtd = (typeof item.qtd === 'number' ? item.qtd : 1);
        const sub = (isNaN(precoNum) ? 0 : precoNum) * (isNaN(qtd) ? 1 : qtd);
        return acc + sub;
    }, 0);
        carrinho.slice(0, 3).forEach((item, idx) => {
            let imgSrc = item.img || item.imagem || 'image/SEM-IMAGEM.png';
            let precoNum = typeof item.preco === 'string' ? parseFloat(item.preco.replace(',', '.')) : Number(item.preco);
            let subtotal = precoNum * (item.qtd || 1);
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
                    if (typeof showToast==='function') showToast('Seu carrinho está vazio.', {type:'warning'});
                    return;
                }
                const usuario = JSON.parse(localStorage.getItem('usuarioLogado') || 'null');
                if (!usuario || !usuario.id) {
                    if (typeof showToast==='function') showToast('Você precisa estar logado para continuar.', {type:'info'});
                    // pequena pausa para exibir o toast antes de redirecionar
                    setTimeout(() => { window.location.href = 'cadastro.html'; }, 800);
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

// (Footer collapse agora inicializado em layout.js - código antigo removido para evitar conflito)

