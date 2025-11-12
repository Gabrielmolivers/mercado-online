// Layout padrão (Header e Footer) para todas as páginas
// Depende de apiUrl (js/config.js)
(function(){
  function headerHTML(){
    return `
    <a href="index.html" class="logo"><i class="fas fa-shopping-basket"></i> Mercado Online</a>
    <nav class="navbar">
      <a href="maisvendidos" style="text-decoration: line-through;">Mais Vendidos</a>
      <a href="ofertas.html">Ofertas</a>
      <a href="produtos.html">Produtos</a>
      <a href="departamentos.html">Departamentos</a>
      <a href="contato" style="text-decoration: line-through;">Contato</a>
    </nav>
    <div class="icons">
      <div id="search-btn" class="fas fa-search"></div>
      <div id="cart-btn" class="fas fa-shopping-cart"></div>
      <div id="login-btn" class="fas fa-user"></div>
      <span id="header-user-greet" class="user-greet-label">Olá, visitante</span>
      <div id="menu-btn" class="fas fa-bars"></div>
    </div>
    <form class="search-form">
      <input type="text" id="search-box" placeholder="Buscar produtos...">
      <label for="search-box" class="fas fa-search"></label>
    </form>
    <div class="shopping-cart"></div>
    <form action="#" class="login-form">
      <h3 id="login-title">Olá, visitante</h3>
      <input type="email" placeholder="Email" required>
      <input type="password" placeholder="Senha" required>
      <label style="display:flex;align-items:center;gap:.5rem;font-size:1.2rem;margin:.4rem 0 .2rem;cursor:pointer;color:#444;">
        <input type="checkbox" id="remember-email" style="width:16px;height:16px;cursor:pointer;"> Lembrar meu email
      </label>
      <a href="esqueci-senha.html">Esqueceu a senha?</a>
      <button type="submit" class="btn">Entrar</button>
      <button type="button" class="criar-btn" onclick="window.location.href='cadastro.html'">Criar uma Conta</button>
    </form>`;
  }

  function footerHTML(){
    return `
    <!--FOOTER padrão-->
    <section class="footer">
      <div class="box-container">
        <div class="box">
          <div class="section-header">
            <h3> Quem somos </h3>
            <button class="toggle-btn" aria-label="Expandir Quem somos"><i class="fas fa-chevron-down" aria-hidden="true"></i></button>
          </div>
          <div class="box-content">
            <p> Seu Mercado Digital com ofertas e produtos sempre à mão!
            Compre online e receba em casa com segurança e praticidade. </p>
          </div>
        </div>
        <div class="box">
          <div class="section-header">
            <h3> Formas de Pagamento </h3>
            <button class="toggle-btn" aria-label="Expandir Formas de Pagamento"><i class="fas fa-chevron-down" aria-hidden="true"></i></button>
          </div>
          <div class="box-content">
            <p> Aceitamos cartões de crédito, débito e vale alimentação. </p>
          </div>
        </div>
        <div class="box">
          <div class="section-header">
            <h3> Institucional </h3>
            <button class="toggle-btn" aria-label="Expandir Institucional"><i class="fas fa-chevron-down" aria-hidden="true"></i></button>
          </div>
          <div class="box-content">
            <a href="institucional.html" class="links"><i class="fa fa-arrow-right"></i> Sobre Nós </a>
            <a href="institucional.html" class="links"><i class="fa fa-arrow-right"></i> Política de Privacidade </a>
            <a href="institucional.html" class="links"><i class="fa fa-arrow-right"></i> Como Comprar </a>
            <a href="institucional.html" class="links"><i class="fa fa-arrow-right"></i> Formas de Pagamento </a>
            <a href="institucional.html" class="links"><i class="fa fa-arrow-right"></i> FAQ </a>
            <a href="institucional.html" class="links"><i class="fa fa-arrow-right"></i> Fale Conosco </a>
            <a href="institucional.html" class="links"><i class="fa fa-arrow-right"></i> Simulador de Frete </a>
            <a href="institucional.html" class="links"><i class="fa fa-arrow-right"></i> Site Institucional </a>
          </div>
        </div>
        <div class="box">
          <div class="section-header">
            <h3> Relacionamento com o Cliente </h3>
            <button class="toggle-btn" aria-label="Expandir Relacionamento com o Cliente"><i class="fas fa-chevron-down" aria-hidden="true"></i></button>
          </div>
          <div class="box-content">
            <a href="#" class="links" id="contato-telefone"><i class="fa fa-phone"></i> (00) 0000-0000 </a>
            <a href="#" class="links" id="contato-whats"><i class="fab fa-whatsapp"></i> (00) 00000-0000 </a>
            <a href="#" class="links" id="contato-email"><i class="fa fa-envelope"></i> mercado@email.com </a>
          </div>
        </div>
        <div class="box">
          <div class="app">
            <h3> Baixe Nosso App </h3>
            <div class="store-buttons">
              <a href="#"><img src="image/google-play.png" alt="Google Play"></a>
              <a href="#"><img src="image/app-store.png" alt="App Store"></a>
            </div>
          </div>
          <h3> Siga-Nos </h3>
          <div class="share">
            <a href="#"><i class="fab fa-facebook-f"></i></a>
            <a href="#"><i class="fab fa-youtube"></i></a>
            <a href="#"><i class="fab fa-instagram"></i></a>
          </div>
        </div>
      </div>
      <div class="box wide-text-box">
        <div class="wide-text" aria-hidden="false">
          <p>
            <strong id="empresa-razao">Mercado Online LTDA</strong>
            / CNPJ: <span id="empresa-cnpj">00.000.000/0001-00</span> / IE: <span id="empresa-ie">00000000-00</span>
            <br>
            <strong id="empresa-nome-curto">Mercado Online</strong>
            é um website de vendas pelo qual você tem fácil acesso aos nossos produtos com facilidade, segurança e comodidade. Possui o conforto para agendar a entrega do seu pedido no local e horário que desejar, além de poder acompanhar o status do seu pedido em tempo real. Com um sistema e plataforma adequado para gerir sua compra, os seus dados permanecem em absoluta segurança.
            <br><br>
            Em caso de divergência entre os valores no site, o valor válido é o do carrinho de compras. Imagens ilustrativas. Compras sujeitas à confirmação de estoque. A fim de garantir o acesso de um maior número de clientes, as ofertas promocionais podem ter uma quantidade limitada por cliente. Os preços e condições de pagamento são válidos somente para compras via internet e podem ser alterados sem aviso prévio.
            <br><br>
            <strong>Proibida a venda de bebidas alcoólicas para menores de idade, conforme Lei n.º 8069/90, art. 81, inciso II do Estatuto da Criança e do Adolescente (ECA).</strong>
          </p>
        </div>
      </div>
    </section>
    <div class="footer-bottom">
      <p id="footer-dynamic">&copy; 2025 Mercado Online. Todos os direitos reservados.</p>
    </div>`;
  }

  function maskCNPJ(v){
    const s = String(v||'').replace(/\D/g,'');
    if (s.length !== 14) return v || '';
    return s.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  function maskPhoneBR(v){
    const d = String(v||'').replace(/\D/g,'');
    if (d.length >= 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7,11)}`;
    if (d.length >= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6,10)}`;
    return v || '';
  }

  function preencherParametros(p){
    try {
      window.__PARAMS__ = p;
      const ano = new Date().getFullYear();
      const nome = p.razao || 'Mercado Online';
      const f = document.getElementById('footer-dynamic');
      if (f) f.textContent = `© ${ano} ${nome}. Todos os direitos reservados.`;
      const rz = document.getElementById('empresa-razao'); if (rz) rz.textContent = nome;
      const cj = document.getElementById('empresa-cnpj'); if (cj) cj.textContent = maskCNPJ(p.cnpj||'');
      const ie = document.getElementById('empresa-ie'); if (ie) ie.textContent = p.ie || '—';
      const nc = document.getElementById('empresa-nome-curto'); if (nc) nc.textContent = nome;
      const tel = document.getElementById('contato-telefone'); if (tel) tel.innerHTML = `<i class='fa fa-phone'></i> ${maskPhoneBR(p.celular||'')}`;
      const whats = document.getElementById('contato-whats'); if (whats) whats.innerHTML = `<i class='fab fa-whatsapp'></i> ${maskPhoneBR(p.celular||'')}`;
    } catch(e) {}
  }

  function carregarParametros(){
    if (window.__PARAMS__ && window.__PARAMS__.razao) {
      preencherParametros(window.__PARAMS__);
      return;
    }
    try {
      fetch(typeof apiUrl === 'function' ? apiUrl('/api/parametros') : '/api/parametros')
        .then(r=>r.json())
        .then(data => { if (data && data.success && data.parametros) preencherParametros(data.parametros); })
        .catch(()=>{});
    } catch(e) {}
  }

  function ensureHeaderFooter(){
    const h = document.querySelector('header.header');
    if (h) h.innerHTML = headerHTML();
    const f = document.querySelector('footer');
    if (f) f.innerHTML = footerHTML();
    carregarParametros();
    inicializarFooterCollapse();
    // Após injetar, alguns listeners/áreas devem ser atualizados
    if (typeof window.atualizarCarrinhoHeader === 'function') {
      try { window.atualizarCarrinhoHeader(); } catch(e) {}
    }
    if (typeof window.updateCartBadge === 'function') {
      try { window.updateCartBadge(); } catch(e) {}
    }
    if (typeof window.initializeHeaderInteractions === 'function') {
      try { window.initializeHeaderInteractions(); } catch(e) {}
    }
    if (typeof window.bindLoginFlow === 'function') {
      try { window.bindLoginFlow(); } catch(e) {}
    }
    if (typeof window.updateHeaderUserGreet === 'function') {
      try { window.updateHeaderUserGreet(); } catch(e) {}
    }
  }

  function inicializarFooterCollapse(){
    try {
      const isDesktop = window.matchMedia('(min-width: 860px)').matches;
      const boxes = document.querySelectorAll('.footer .box');
      boxes.forEach(box => {
        const header = box.querySelector('.section-header');
        const content = box.querySelector('.box-content');
        const btn = box.querySelector('.toggle-btn');
        if (!header || !content) return; // ignora caixas sem conteúdo colapsável
        function toggle(){
          const open = box.classList.toggle('open');
          if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        }
        if (!isDesktop){
          box.classList.remove('open'); // fecha tudo inicialmente no mobile
          header.addEventListener('click', e => { e.preventDefault(); toggle(); });
          if (btn) btn.addEventListener('click', e => { e.stopPropagation(); toggle(); });
        } else {
          box.classList.add('open'); // mantém aberto no desktop
        }
      });
      // Informações Legais sempre visíveis (remove comportamento de toggle)
      // Reavalia quando mudar o tamanho
      window.addEventListener('resize', () => {
        const nowDesktop = window.matchMedia('(min-width: 860px)').matches;
        if (nowDesktop !== isDesktop){ inicializarFooterCollapse(); }
      }, { once:true });
    } catch(e) { /* silencia erros */ }
  }

  // Injeta o header/footer o quanto antes para que outros scripts (defer) encontrem os elementos
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureHeaderFooter);
  } else {
    ensureHeaderFooter();
  }
})();
