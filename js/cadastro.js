// Validação de senha ao sair do campo
const senhaInput = document.querySelector('input[name="senha"]');
const confirmarSenhaInput = document.getElementById('confirmarSenha');
const erroSenha = document.getElementById('senha-erro');
function validarSenhas() {
    if (senhaInput && confirmarSenhaInput && erroSenha) {
        if (senhaInput.value !== confirmarSenhaInput.value) {
            erroSenha.style.display = 'block';
        } else {
            erroSenha.style.display = 'none';
        }
    }
}
if (confirmarSenhaInput) {
    confirmarSenhaInput.addEventListener('blur', validarSenhas);
    confirmarSenhaInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === 'Tab') {
            setTimeout(validarSenhas, 0);
        }
    });
}
// Validação de e-mail
document.addEventListener('DOMContentLoaded', function () {
    const emailInput = document.querySelector('input[name="email"]');
    if (emailInput) {
        emailInput.addEventListener('blur', function () {
            const email = emailInput.value;
            const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
            let erro = document.getElementById('email-erro');
            if (!erro) {
                erro = document.createElement('div');
                erro.id = 'email-erro';
                erro.style.color = '#d32f2f';
                erro.style.fontSize = '1.4rem';
                erro.style.marginTop = '.5rem';
                erro.style.paddingBottom = '1rem';
                erro.style.fontWeight = 'bolder';
                emailInput.parentNode.insertBefore(erro, emailInput.nextSibling);
            }
            if (!emailValido && email.length > 0) {
                erro.textContent = 'E-mail inválido';
                erro.style.display = 'block';
            } else {
                erro.textContent = '';
                erro.style.display = 'none';
            }
        });
    }
});
// Preencher cidade e estado pelo CEP e bloquear edição
document.addEventListener('DOMContentLoaded', function () {
    const cepInput = document.getElementById('cep');
    const cidadeInput = document.querySelector('input[name="cidade"]');
    const estadoInput = document.querySelector('input[name="estado"]');
    if (cepInput && cidadeInput && estadoInput) {
        function buscarCidadeEstado() {
            const cep = cepInput.value.replace(/\D/g, '');
            if (cep.length === 8) {
                fetch(`https://viacep.com.br/ws/${cep}/json/`)
                    .then(response => response.json())
                    .then(data => {
                        if (!data.erro) {
                            cidadeInput.value = data.localidade;
                            estadoInput.value = data.uf;
                            cidadeInput.readOnly = true;
                            estadoInput.readOnly = true;
                            document.getElementById('cep-erro').style.display = 'none';
                        } else {
                            cidadeInput.value = '';
                            estadoInput.value = '';
                            cidadeInput.readOnly = true;
                            estadoInput.readOnly = true;
                            document.getElementById('cep-erro').style.display = 'block';
                        }
                    });
            }
        }
        cepInput.addEventListener('blur', buscarCidadeEstado);
        cepInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === 'Tab') {
                buscarCidadeEstado();
            }
        });
    }
});
// Máscara para CEP (formato XXXXX-XXX)
document.addEventListener('DOMContentLoaded', function () {
    const cepInput = document.querySelector('input[name="cep"]');
    if (cepInput) {
        cepInput.addEventListener('input', function (e) {
            let v = e.target.value.replace(/\D/g, "");
            if (v.length > 5) {
                v = v.slice(0, 5) + '-' + v.slice(5, 8);
            }
            e.target.value = v;
        });
    }
});
document.addEventListener('DOMContentLoaded', function () {
    const celularInput = document.getElementById('celular');
    if (celularInput) {
        celularInput.addEventListener('input', function (e) {
            let v = e.target.value.replace(/\D/g, "");
            if (v.length > 2) {
                v = `(${v.slice(0, 2)})${v.slice(2, 7)}-${v.slice(7, 11)}`;
            }
            // Remove hífen se o usuário apagar
            if (v.endsWith('-')) {
                v = v.slice(0, -1);
            }
            e.target.value = v;
        });
    }

    const cadastroForm = document.getElementById('cadastroForm');
    const btnCadastrar = document.getElementById('btnCadastrar');
    const erroSenha = document.getElementById('senha-erro');
    function validarBotao() {
        // Verifica todos os campos obrigatórios
        const obrigatorios = [
            'nome', 'email', 'endereco', 'bairro', 'numero', 'cep', 'cidade', 'estado', 'celular', 'senha', 'confirmarSenha'
        ];
        let preenchidos = true;
        obrigatorios.forEach(campo => {
            const input = cadastroForm.querySelector(`[name="${campo}"]`);
            if (!input || !input.value.trim()) preenchidos = false;
        });
        // Senhas devem coincidir
        const senhaInput = cadastroForm.querySelector('input[name="senha"]');
        const confirmarSenhaInput = cadastroForm.querySelector('input[name="confirmarSenha"]');
        const senhasOk = senhaInput.value === confirmarSenhaInput.value && senhaInput.value.length > 0;
        if (preenchidos && senhasOk) {
            btnCadastrar.disabled = false;
            btnCadastrar.style.background = '';
            btnCadastrar.style.color = '';
            btnCadastrar.style.cursor = '';
            erroSenha.style.display = 'none';
        } else {
            btnCadastrar.disabled = true;
            btnCadastrar.style.background = '#ccc';
            btnCadastrar.style.color = '#888';
            btnCadastrar.style.cursor = 'not-allowed';
            if (senhaInput.value.length > 0 && confirmarSenhaInput.value.length > 0 && senhaInput.value !== confirmarSenhaInput.value) {
                erroSenha.style.display = 'block';
            } else {
                erroSenha.style.display = 'none';
            }
        }
    }
    cadastroForm.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', validarBotao);
    });
    validarBotao();

    cadastroForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const senha = cadastroForm.senha.value;
        const confirmarSenha = cadastroForm.confirmarSenha.value;
        if (senha !== confirmarSenha) {
            erroSenha.style.display = 'block';
            btnCadastrar.disabled = true;
            btnCadastrar.style.background = '#ccc';
            btnCadastrar.style.color = '#888';
            btnCadastrar.style.cursor = 'not-allowed';
            document.getElementById('confirmarSenha').focus();
            return;
        } else {
            erroSenha.style.display = 'none';
            btnCadastrar.disabled = false;
            btnCadastrar.style.background = '';
            btnCadastrar.style.color = '';
            btnCadastrar.style.cursor = '';
        }
        // ...continua o envio normalmente
        const dados = {
            nome: cadastroForm.nome.value,
            email: cadastroForm.email.value,
            senha: cadastroForm.senha.value,
            endereco: cadastroForm.endereco.value,
            bairro: cadastroForm.bairro.value,
            numero: cadastroForm.numero.value,
            complemento: cadastroForm.complemento.value,
            cidade: cadastroForm.cidade.value,
            estado: cadastroForm.estado.value,
            cep: cadastroForm.cep.value,
            celular: cadastroForm.celular.value,
            dtcadastro: new Date().toISOString().slice(0, 10) // formato YYYY-MM-DD
        };
    fetch(apiUrl('/api/cadastro'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dados)
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    // Auto login com os dados recém-cadastrados
                    try {
                        const usuario = { id: data.id, nome: dados.nome, email: String(dados.email||'').toLowerCase() };
                        localStorage.setItem('usuarioLogado', JSON.stringify(usuario));
                        // Notificação de sucesso
                        if (typeof window.showToast === 'function') window.showToast('CONECTADO COM SUCESSO');
                        // Dispara eventos para atualizar header/badge
                        window.dispatchEvent(new Event('usuarioLogado'));
                        window.dispatchEvent(new Event('storage'));
                    } catch(e) {}
                    alert('Cadastro realizado com sucesso!');
                    cadastroForm.reset();
                    window.location.href = 'index.html';
                } else {
                    alert('Erro ao cadastrar: ' + (data.error || ''));
                    btnCadastrar.disabled = false;
                }
            })
            .catch(() => {
                alert('Erro ao conectar com o servidor.');
                btnCadastrar.disabled = false;
            });
    });
});
// Adiciona campo de seleção de quantidade nos produtos do carrinho
function renderCarrinho() {
    const carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
    const carrinhoContainer = document.querySelector('.shopping-cart');
    if (!carrinhoContainer) return;
    carrinhoContainer.innerHTML = '';
    let total = 0;
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
        carrinhoContainer.appendChild(div);
        total += Number(item.preco) * (item.qtd || 1);
    });
    const totalDiv = document.createElement('div');
    totalDiv.className = 'total';
    totalDiv.innerHTML = `<h3>Total:<span class="price"> R$ ${total.toFixed(2)}</span></h3>`;
    carrinhoContainer.appendChild(totalDiv);
    const btn = document.createElement('a');
    btn.href = '#';
    btn.className = 'btn';
    btn.textContent = 'Finalizar Compra';
    carrinhoContainer.appendChild(btn);
    // Botões de quantidade
    carrinhoContainer.querySelectorAll('.cart-item').forEach((div, idx) => {
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
    carrinhoContainer.querySelectorAll('.fa-trash').forEach(trash => {
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
