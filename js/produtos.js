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
    return fetch(`/api/produtos?offset=0&limit=10000&_=${unique}`, {
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
                return data.produtos;
            }
            return [];
        })
        .catch(() => {
            if (loader) loader.style.display = 'none';
            return [];
        });
}

function exibirProdutos(lista) {
    const container = document.getElementById('produtos-lista');
    if (!container) return;
    container.innerHTML = '';
    lista.forEach(prod => {
        const box = document.createElement('div');
        box.className = 'box';
        box.setAttribute('data-procod', prod.procod);
        box.style = 'background: #fff; box-shadow: 0 .1rem 1rem rgb(124, 124, 124); border-radius: .5rem; text-align: center; display: block; height: 25rem; width: 20rem;';
        const precoFormatado = Number(prod.preco).toFixed(2);
        box.innerHTML = `
            ${prod.imagemTipo && prod.imagem ? `<img src="data:image/${prod.imagemTipo};base64,${prod.imagem}" alt="${prod.nome}" style="height: 50%; width: 80%; object-fit: contain; margin-top: 1rem;">` : `<img src="image/SEM-IMAGEM.png" alt="Sem imagem" style="height: 50%; width: 80%; object-fit: contain; margin-top: 1rem;">`}
            <h1 style="font-size: 1.5rem; color: rgb(22, 87, 207);">${prod.nome}</h1>
            <div class="box-footer">
                <div class="price">R$ ${precoFormatado} <span class="und">/${prod.und}</span></div>
                <button class="add-carrinho-btn"><i class="fas fa-shopping-cart"></i></button>
            </div>
        `;
        container.appendChild(box);
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
    const selectOrdenar = document.getElementById('ordenar-select');
    const btnMais = document.getElementById('mostrarMais');
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