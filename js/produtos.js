// produtos.js
// Script para funcionalidades relacionadas aos produtos


let produtosOrdenados = [];
let paginaAtual = 1;
const itensPorPagina = 20;
const MAX_PRODUTOS = 500;

function buscarProdutos(offset = 0, limit = 20) {
    // Mostra loader
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'flex';
    const unique = Date.now();
    // Verifica se há termo de busca na URL
    const urlParams = new URLSearchParams(window.location.search);
    const termoBusca = urlParams.get('search');
    const codgrp = urlParams.get('codgrp');
    const categoriaNome = urlParams.get('categoria');
    let url = `/api/produtos?offset=0&limit=10000&_=${unique}`;
    if (termoBusca) {
        url += `&search=${encodeURIComponent(termoBusca)}`;
    }
    if (codgrp) {
        url += `&codgrp=${encodeURIComponent(codgrp)}`;
    }
    return fetch(apiUrl(url), {
        headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Expires': '0'
        }
    })
        .then(res => res.json())
        .then(data => {
            if (loader) loader.style.display = 'none';
            if (data.success && Array.isArray(data.produtos)) {
                let lista = data.produtos;
                // Fallback: se não veio codgrp mas veio categoria, filtra por nome do grupo
                if (!codgrp && categoriaNome) {
                    const alvo = normalizar(categoriaNome);
                    lista = lista.filter(p => normalizar(p.grupo || '') === alvo);
                }
                return lista;
            }
            return [];
        })
        .catch(() => {
            if (loader) loader.style.display = 'none';
            return [];
        });
}

// Normaliza acentos/maiúsculas
function normalizar(txt) {
    return String(txt || '')
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .trim()
        .toLowerCase();
}

function exibirProdutos(lista) {
    const container = document.getElementById('produtos-lista');
    if (!container) return;
    container.innerHTML = '';
    const toNumber = (n) => {
        if (n === null || n === undefined) return NaN;
        if (typeof n === 'number') return n;
        const s = String(n).replace(',', '.');
        const v = Number(s);
        return isNaN(v) ? NaN : v;
    };
    lista.forEach(prod => {
        const box = document.createElement('div');
        box.className = 'box';
        box.setAttribute('data-procod', prod.procod);
        box.style = 'background: #fff; box-shadow: 0 .1rem 1rem rgb(124, 124, 124); border-radius: .5rem; text-align: center; display: block; height: 25rem; width: 20rem; position:relative;';
        // Nova regra: promoção ativa SOMENTE se FIMPROMO > hoje; usa VALORPROMO como preço
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const toDateOnly = (s) => {
            if (!s) return null;
            if (/^\d{4}-\d{2}-\d{2}$/.test(s)) { const [Y,M,D]=s.split('-').map(Number); return new Date(Y, M-1, D); }
            const m = String(s).match(/^(\d{2})[.\/-](\d{2})[.\/-](\d{4})$/);
            if (m) return new Date(Number(m[3]), Number(m[2])-1, Number(m[1]));
            const d = new Date(s); return isNaN(d) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate());
        };
        const fimDate = toDateOnly(prod.fimpromo);
        const precoBaseNum = toNumber(prod.preco);
        const precoPromoNum = toNumber(prod.precoPromo);
        const isPromoActive = !!(fimDate && fimDate.getTime() > today.getTime() && !isNaN(precoPromoNum) && precoPromoNum > 0 && precoPromoNum < precoBaseNum);
        const descontoPerc = isPromoActive && precoBaseNum > 0 ? Math.max(1, Math.min(99, Math.round((1 - (precoPromoNum / precoBaseNum)) * 100))) : 0;
        const precoBaseFmt = (!isNaN(precoBaseNum) ? precoBaseNum : 0).toFixed(2);
        const precoPromoFmt = (!isNaN(precoPromoNum) ? precoPromoNum : 0).toFixed(2);
        box.innerHTML = `
            ${isPromoActive ? `<div class="badge-desconto">-${descontoPerc}%</div>` : ''}
            ${prod.imagemTipo && prod.imagem ? `<img src="data:image/${prod.imagemTipo};base64,${prod.imagem}" alt="${prod.nome}" style="height: 50%; width: 80%; object-fit: contain; margin-top: 1rem;">` : `<img src="image/SEM-IMAGEM.png" alt="Sem imagem" style="height: 50%; width: 80%; object-fit: contain; margin-top: 1rem;">`}
            <h1 style="font-size: 1.5rem; color: rgb(22, 87, 207);">${prod.nome}</h1>
            <div class="qty-selector" style="margin: 0.5rem 0; display: flex; justify-content: center; align-items: center; gap: 0.5rem;">
                <button class="qty-minus" type="button">-</button>
                <input type="number" class="qty-input" min="1" value="1" style="width: 40px; text-align: center; font-size: 1.2rem;">
                <button class="qty-plus" type="button">+</button>
            </div>
            <div class="box-footer">
                <div style="display:flex; flex-direction:column; align-items:flex-start;">
                  ${isPromoActive ? `<div class="price-old">R$ ${precoBaseFmt}</div>` : ''}
                  <div class="price">R$ ${isPromoActive ? precoPromoFmt : precoBaseFmt} <span class="und">/${prod.und}</span></div>
                </div>
                <button class="add-carrinho-btn"><i class="fas fa-shopping-cart"></i></button>
            </div>
        `;
        container.appendChild(box);
    });
    // Adiciona eventos de quantidade e carrinho
    container.querySelectorAll('.box').forEach(box => {
        const minus = box.querySelector('.qty-minus');
        const plus = box.querySelector('.qty-plus');
        const input = box.querySelector('.qty-input');
        minus.onclick = () => {
            let val = parseInt(input.value) || 1;
            if (val > 1) input.value = val - 1;
        };
        plus.onclick = () => {
            let val = parseInt(input.value) || 1;
            input.value = val + 1;
        };
        input.oninput = () => {
            if (input.value < 1) input.value = 1;
        };
        box.querySelector('.add-carrinho-btn').onclick = () => {
            const prodcod = box.getAttribute('data-procod');
            const prod = lista.find(p => p.procod == prodcod);
            const qtd = parseInt(input.value) || 1;
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const toDateOnly = (s) => {
                if (!s) return null;
                if (/^\d{4}-\d{2}-\d{2}$/.test(s)) { const [Y,M,D]=s.split('-').map(Number); return new Date(Y, M-1, D); }
                const m = String(s).match(/^(\d{2})[.\/-](\d{2})[.\/-](\d{4})$/);
                if (m) return new Date(Number(m[3]), Number(m[2])-1, Number(m[1]));
                const d = new Date(s); return isNaN(d) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate());
            };
            const fimDate = toDateOnly(prod.fimpromo);
            const precoBaseNum = toNumber(prod.preco);
            const precoPromoNum = toNumber(prod.precoPromo);
            const isPromoActive = !!(fimDate && fimDate.getTime() > today.getTime() && !isNaN(precoPromoNum) && precoPromoNum > 0 && precoPromoNum < precoBaseNum);
            const prodCarrinho = { ...prod, preco: isPromoActive ? precoPromoNum : precoBaseNum };
            adicionarAoCarrinho(prodCarrinho, qtd);
            // Mensagem de confirmação com fade out
            let msg = document.createElement('div');
            msg.textContent = 'ADICIONADO COM SUCESSO';
            msg.style.position = 'fixed';
            msg.style.top = '20px';
            msg.style.left = '50%';
            msg.style.transform = 'translateX(-50%)';
            msg.style.background = '#1657cf';
            msg.style.color = '#fff';
            msg.style.padding = '1rem 2rem';
            msg.style.borderRadius = '2rem';
            msg.style.fontSize = '1.4rem';
            msg.style.fontWeight = 'bold';
            msg.style.zIndex = '9999';
            msg.style.transition = 'opacity 0.5s';
            document.body.appendChild(msg);
            setTimeout(() => {
                msg.style.opacity = '0';
                setTimeout(() => { msg.remove(); }, 500);
            }, 1000);
        };
    });
    atualizarPaginacao();
}

function ordenarProdutos(tipo) {
    buscarProdutos().then(produtos => {
        let lista = [...produtos];
        if (tipo === 'menor') {
            lista.sort((a, b) => parseFloat(a.preco) - parseFloat(b.preco));
            lista = lista.slice(0, MAX_PRODUTOS);
        } else if (tipo === 'maior') {
            lista.sort((a, b) => parseFloat(b.preco) - parseFloat(a.preco));
            lista = lista.slice(0, MAX_PRODUTOS);
        } else {
            lista = lista.slice(0, MAX_PRODUTOS);
        }
        produtosOrdenados = lista;
        paginaAtual = 1;
        exibirProdutos(produtosOrdenados.slice(0, itensPorPagina));
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // Ajusta título com categoria, se presente
    const urlParams = new URLSearchParams(window.location.search);
    const categoriaNome = urlParams.get('categoria');
    const titulo = document.querySelector('.produtos-section h2');
    if (titulo && categoriaNome) {
        titulo.textContent = `Produtos - ${categoriaNome}`;
    }
    const selectOrdenar = document.getElementById('ordenar-select');
    const btnMais = document.getElementById('mostrarMais');

    // Popular e lidar com select de categorias
    const categoriaSelect = document.getElementById('categoria-select');
    if (categoriaSelect) {
        fetch(apiUrl('/api/categorias'))
            .then(r => r.json())
            .then(data => {
                if (!data.success || !Array.isArray(data.categorias)) return;
                // Preenche opções
                data.categorias.forEach(cat => {
                    const opt = document.createElement('option');
                    opt.value = cat.codgrp;
                    opt.textContent = cat.nome;
                    categoriaSelect.appendChild(opt);
                });
                // Seleciona atual se vier na URL
                const codgrpAtual = (new URLSearchParams(window.location.search)).get('codgrp');
                const categoriaAtual = (new URLSearchParams(window.location.search)).get('categoria');
                if (codgrpAtual && categoriaSelect.querySelector(`option[value="${CSS.escape(codgrpAtual)}"]`)) {
                    categoriaSelect.value = codgrpAtual;
                } else if (categoriaAtual) {
                    // Tenta selecionar pelo nome
                    [...categoriaSelect.options].forEach(o => {
                        if (o.textContent.toLowerCase() === categoriaAtual.toLowerCase()) categoriaSelect.value = o.value;
                    });
                }
            })
            .catch(() => {});

        categoriaSelect.addEventListener('change', () => {
            const sel = categoriaSelect.options[categoriaSelect.selectedIndex];
            const codgrpSel = categoriaSelect.value;
            const nomeSel = sel ? sel.textContent : '';
            const params = new URLSearchParams(window.location.search);
            if (codgrpSel) {
                params.set('codgrp', codgrpSel);
                params.set('categoria', nomeSel);
            } else {
                params.delete('codgrp');
                params.delete('categoria');
            }
            const novaUrl = 'produtos.html' + (params.toString() ? ('?' + params.toString()) : '');
            window.history.replaceState(null, '', novaUrl);
            // Atualiza título
            if (titulo) titulo.textContent = codgrpSel ? `Produtos - ${nomeSel}` : 'Produtos';
            // Recarrega lista com novo filtro
            atualizarProdutosOrdenados(selectOrdenar ? selectOrdenar.value : 'padrao');
        });
    }
    function atualizarProdutosOrdenados(tipo) {
        buscarProdutos().then(produtos => {
            produtosCache = produtos;
            ordenarProdutos(tipo);
        });
    }
    atualizarProdutosOrdenados(selectOrdenar ? selectOrdenar.value : 'padrao');
    if (selectOrdenar) {
        selectOrdenar.addEventListener('change', (e) => {
            atualizarProdutosOrdenados(e.target.value);
        });
    }

    // Busca automática ao carregar se houver termo na URL
    const urlParams2 = new URLSearchParams(window.location.search);
    const termoBusca = urlParams2.get('search');
    if (termoBusca) {
        buscarProdutos().then(produtos => {
            produtosOrdenados = produtos;
            const termo = termoBusca.trim().toLowerCase();
            const filtrados = produtosOrdenados.filter(prod =>
                prod.nome && prod.nome.toLowerCase().includes(termo)
            );
            exibirProdutos(filtrados.slice(0, itensPorPagina));
            const searchBox = document.getElementById('search-box');
            if (searchBox) searchBox.value = termoBusca;
        });
    }
    // Mantém funcionalidade de busca manual
    const searchForm = document.querySelector('.search-form');
    const searchBox = document.getElementById('search-box');
    if (searchForm && searchBox) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const termo = searchBox.value.trim().toLowerCase();
            const filtrados = produtosOrdenados.filter(prod =>
                prod.nome && prod.nome.toLowerCase().includes(termo)
            );
            exibirProdutos(filtrados.slice(0, itensPorPagina));
        });
    }

    // Polling a cada 5 minutos para atualizar os produtos
    setInterval(() => {
        // Sempre faz nova conexão e importa os produtos
        atualizarProdutosOrdenados(selectOrdenar ? selectOrdenar.value : 'padrao');
    }, 300000); // 300000 ms = 5 minutos

        
});


function atualizarPaginacao() {
    const paginacao = document.getElementById('paginacao');
    if (!paginacao) return;
    paginacao.innerHTML = '';
    const totalPaginas = Math.ceil(produtosOrdenados.length / itensPorPagina);
    if (totalPaginas <= 1) return;

    // Botão anterior
    const btnAnterior = document.createElement('button');
    btnAnterior.textContent = '<';
    btnAnterior.disabled = paginaAtual === 1;
    btnAnterior.onclick = () => {
        if (paginaAtual > 1) {
            paginaAtual--;
            const inicio = (paginaAtual - 1) * itensPorPagina;
            exibirProdutos(produtosOrdenados.slice(inicio, inicio + itensPorPagina));
        }
    };
    paginacao.appendChild(btnAnterior);

    // Botões de página numerados (máximo 7)
    let start = 1;
    let end = totalPaginas;
    if (totalPaginas > 7) {
        if (paginaAtual <= 4) {
            start = 1;
            end = 7;
        } else if (paginaAtual >= totalPaginas - 3) {
            start = totalPaginas - 6;
            end = totalPaginas;
        } else {
            start = paginaAtual - 3;
            end = paginaAtual + 3;
        }
    }
    for (let i = start; i <= end; i++) {
        const paginaBtn = document.createElement('button');
        paginaBtn.textContent = i;
        paginaBtn.className = 'pagina-btn' + (i === paginaAtual ? ' active' : '');
        paginaBtn.disabled = i === paginaAtual;
        paginaBtn.onclick = () => {
            paginaAtual = i;
            const inicio = (paginaAtual - 1) * itensPorPagina;
            exibirProdutos(produtosOrdenados.slice(inicio, inicio + itensPorPagina));
        };
        paginacao.appendChild(paginaBtn);
    }

    // Botão próxima
    const btnProxima = document.createElement('button');
    btnProxima.textContent = '>';
    btnProxima.disabled = paginaAtual === totalPaginas;
    btnProxima.onclick = () => {
        if (paginaAtual < totalPaginas) {
            paginaAtual++;
            const inicio = (paginaAtual - 1) * itensPorPagina;
            exibirProdutos(produtosOrdenados.slice(inicio, inicio + itensPorPagina));
        }
    };
    paginacao.appendChild(btnProxima);
}

// Adiciona ao carrinho
function adicionarAoCarrinho(produto, qtd = 1) {
    let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
    const idx = carrinho.findIndex(item => item.procod === produto.procod);
    if (idx > -1) {
        // Atualiza o preço para o valor atual (pode ser promocional)
        carrinho[idx].preco = produto.preco;
        carrinho[idx].und = produto.und || carrinho[idx].und;
        carrinho[idx].qtd += qtd; // Soma a quantidade selecionada ao que já existe
    } else {
        // Cria um novo objeto para evitar mutação do produto original
        const novoProduto = { ...produto, qtd };
        carrinho.push(novoProduto);
    }
    localStorage.setItem('carrinho', JSON.stringify(carrinho));
    if (typeof updateCartBadge === 'function') updateCartBadge();
    window.dispatchEvent(new Event('storage'));
}

// Atualiza badge do carrinho ao modificar carrinho
if (typeof updateCartBadge === 'function') updateCartBadge();