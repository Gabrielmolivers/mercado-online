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

    document.getElementById('cadastroForm').addEventListener('submit', function (e) {
        e.preventDefault();
        const form = e.target;
        const btnCadastrar = form.querySelector('button[type="submit"]');
        const senha = form.senha.value;
        const confirmarSenha = form.confirmarSenha.value;
        const erroSenha = document.getElementById('senha-erro');
        if (senha !== confirmarSenha) {
            erroSenha.style.display = 'block';
            btnCadastrar.disabled = true;
            e.preventDefault();
            document.getElementById('confirmarSenha').focus();
            return;
        } else {
            erroSenha.style.display = 'none';
            btnCadastrar.disabled = false;
        }
        // ...continua o envio normalmente

        const dados = {
            nome: form.nome.value,
            email: form.email.value,
            senha: form.senha.value,
            endereco: form.endereco.value,
            bairro: form.bairro.value,
            numero: form.numero.value,
            complemento: form.complemento.value,
            cidade: form.cidade.value,
            estado: form.estado.value,
            cep: form.cep.value,
            celular: form.celular.value,
            dtcadastro: new Date().toISOString().slice(0, 10) // formato YYYY-MM-DD
        };
        fetch('/api/cadastro', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dados)
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    alert('Cadastro realizado com sucesso!');
                    form.reset();
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
                <span class="price">R$ ${Number(item.preco).toFixed(2)} ${item.und ? '| ' + item.und : ''}</span>
                <span class="qtd">Qtde: ${item.qtd || 1} ${item.und || ''}</span>
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

    // Remover produto do carrinho (diminui quantidade)
    carrinhoContainer.querySelectorAll('.fa-trash').forEach(trash => {
        trash.onclick = function() {
            const idx = parseInt(this.getAttribute('data-idx'));
            if (carrinho[idx].qtd && carrinho[idx].qtd > 1) {
                carrinho[idx].qtd--;
            } else {
                carrinho.splice(idx, 1);
            }
            localStorage.setItem('carrinho', JSON.stringify(carrinho));
            renderCarrinho();
        };
    });
}

document.addEventListener('DOMContentLoaded', function () {
    renderCarrinho();
});
