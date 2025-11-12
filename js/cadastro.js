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

    // Máscara para CPF/CNPJ (documento obrigatório)
    const docEl = document.getElementById('doc');
    if (docEl) {
        const group = docEl.closest('.input-group');
        function setInvalidState(msg){
            if (group) group.classList.add('invalid');
            const err = document.getElementById('doc-erro');
            if (err){ err.textContent = msg; err.style.display='block'; }
            docEl.title = msg;
        }
        function clearInvalid(){
            if (group) group.classList.remove('invalid');
            const err = document.getElementById('doc-erro');
            if (err){ err.style.display='none'; }
            docEl.removeAttribute('title');
        }
        function validateDocRaw(raw){
            function cpfOk(s){ if (s.length!==11) return false; if(/^(\d)\1{10}$/.test(s)) return false; let sum=0; for(let i=0;i<9;i++) sum+=parseInt(s[i])*(10-i); let rev=11-(sum%11); if(rev>=10) rev=0; if(rev!==parseInt(s[9])) return false; sum=0; for(let i=0;i<10;i++) sum+=parseInt(s[i])*(11-i); rev=11-(sum%11); if(rev>=10) rev=0; return rev===parseInt(s[10]); }
            function cnpjOk(s){ if (s.length!==14) return false; if(/^(\d)\1{13}$/.test(s)) return false; const calc=(base)=>{ const pesos= base===12?[5,4,3,2,9,8,7,6,5,4,3,2]:[6,5,4,3,2,9,8,7,6,5,4,3,2]; let soma=0; for(let i=0;i<pesos.length;i++) soma+=parseInt(s[i])*pesos[i]; const resto=soma%11; return resto<2?0:11-resto; }; const d1=calc(12); if(d1!==parseInt(s[12])) return false; const d2=calc(13); return d2===parseInt(s[13]); }
            if (!raw) return { ok:false, msg:'DOCUMENTO OBRIGATÓRIO' };
            if (raw.length<11) return { ok:false, msg:'INCOMPLETO' };
            if (raw.length===11) return cpfOk(raw)? { ok:true } : { ok:false, msg:'CPF INVÁLIDO' };
            if (raw.length<14) return { ok:false, msg:'INCOMPLETO' };
            if (raw.length===14) return cnpjOk(raw)? { ok:true } : { ok:false, msg:'CNPJ INVÁLIDO' };
            return { ok:false, msg:'FORMATO INVÁLIDO' };
        }
        let debounceId = null;
        function scheduleValidate(){
            if (debounceId) clearTimeout(debounceId);
            debounceId = setTimeout(() => {
                const raw = (docEl.value||'').replace(/\D/g,'');
                const r = validateDocRaw(raw);
                if (r.ok) clearInvalid(); else setInvalidState(r.msg);
            }, 120);
        }
        docEl.addEventListener('input', function(e){
            let d = (e.target.value || '').replace(/\D/g, '');
            if (d.length <= 11) {
                d = d.slice(0,11);
                const p1=d.slice(0,3), p2=d.slice(3,6), p3=d.slice(6,9), p4=d.slice(9,11);
                let s=p1; if (p2) s+='.'+p2; if (p3) s+='.'+p3; if (p4) s+='-'+p4;
                e.target.value = s;
            } else {
                d = d.slice(0,14);
                const a=d.slice(0,2), b=d.slice(2,5), c=d.slice(5,8), d4=d.slice(8,12), d5=d.slice(12,14);
                let s=a; if (b) s+='.'+b; if (c) s+='.'+c; if (d4) s+='/'+d4; if (d5) s+='-'+d5;
                e.target.value = s;
            }
            scheduleValidate();
            validarBotao();
        });
        docEl.addEventListener('blur', function(){ scheduleValidate(); validarBotao(); });
    }

    const cadastroForm = document.getElementById('cadastroForm');
    const btnCadastrar = document.getElementById('btnCadastrar');
    const erroSenha = document.getElementById('senha-erro');
    function validarBotao() {
        // Verifica todos os campos obrigatórios
        const obrigatorios = [
            'nome', 'email', 'doc', 'endereco', 'bairro', 'numero', 'cep', 'cidade', 'estado', 'celular', 'senha', 'confirmarSenha'
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
        // Documento (CPF/CNPJ) obrigatório e válido
        const docField = document.getElementById('doc');
        const rawDoc = (docField && docField.value ? docField.value.replace(/\D/g,'') : '');
        function validaCPF(s){
            if (s.length !== 11) return false; if (/^(\d)\1{10}$/.test(s)) return false;
            let sum=0; for (let i=0;i<9;i++) sum += parseInt(s[i])*(10-i);
            let rev = 11 - (sum % 11); if (rev>=10) rev=0; if (rev !== parseInt(s[9])) return false;
            sum=0; for (let i=0;i<10;i++) sum += parseInt(s[i])*(11-i);
            rev = 11 - (sum % 11); if (rev>=10) rev=0; return rev === parseInt(s[10]);
        }
        function validaCNPJ(s){
            if (s.length !== 14) return false; if (/^(\d)\1{13}$/.test(s)) return false;
            const calc=(base)=>{ const pesos = base===12?[5,4,3,2,9,8,7,6,5,4,3,2]:[6,5,4,3,2,9,8,7,6,5,4,3,2]; let soma=0; for(let i=0;i<pesos.length;i++) soma+=parseInt(s[i])*pesos[i]; const resto=soma%11; return resto<2?0:11-resto; };
            const d1=calc(12); if (d1 !== parseInt(s[12])) return false; const d2=calc(13); return d2 === parseInt(s[13]);
        }
        const docOk = (rawDoc.length===11 && validaCPF(rawDoc)) || (rawDoc.length===14 && validaCNPJ(rawDoc));
        const docErroDiv = document.getElementById('doc-erro');
        if (rawDoc.length === 0) {
            if (docErroDiv) docErroDiv.style.display='block', docErroDiv.textContent='DOCUMENTO OBRIGATÓRIO';
        } else if (!docOk) {
            if (docErroDiv) {
                if (rawDoc.length===11) docErroDiv.textContent='CPF INVÁLIDO';
                else if (rawDoc.length===14) docErroDiv.textContent='CNPJ INVÁLIDO';
                else docErroDiv.textContent='FORMATO INVÁLIDO';
                docErroDiv.style.display='block';
            }
        } else if (docErroDiv) {
            docErroDiv.style.display='none';
        }
        if (preenchidos && senhasOk && docOk) {
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
        // Documento obrigatório: envia como cpf ou cnpj
        (function(){
            const f = document.getElementById('doc');
            const raw = (f && f.value ? f.value.replace(/\D/g,'') : '');
            // Backend agora usa a coluna CPF para ambos; envia sempre como cpf
            dados.cpf = raw;
        })();
        if (!dados.cpf) { if (window.showToast) window.showToast('Documento inválido ou incompleto.', {type:'error'}); return; }
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
                    if (typeof window.showToast === 'function') window.showToast('Cadastro realizado com sucesso!', {type:'success'});
                    cadastroForm.reset();
                    window.location.href = 'index.html';
                } else {
                    if (typeof window.showToast === 'function') window.showToast('Erro ao cadastrar: ' + (data.error || ''), {type:'error'});
                    btnCadastrar.disabled = false;
                }
            })
            .catch(() => {
                if (typeof window.showToast === 'function') window.showToast('Erro ao conectar com o servidor.', {type:'error'});
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

// Função isolada para validar doc e mostrar erro (usada na máscara)
function validarDocumentoVisual(){
    const f = document.getElementById('doc');
    const err = document.getElementById('doc-erro');
    if (!f || !err) return;
    const raw = (f.value||'').replace(/\D/g,'');
    function cpfOk(s){
        if (s.length!==11) return false; if (/^(\d)\1{10}$/.test(s)) return false; let sum=0; for(let i=0;i<9;i++) sum+=parseInt(s[i])*(10-i); let rev=11-(sum%11); if(rev>=10) rev=0; if(rev!==parseInt(s[9])) return false; sum=0; for(let i=0;i<10;i++) sum+=parseInt(s[i])*(11-i); rev=11-(sum%11); if(rev>=10) rev=0; return rev===parseInt(s[10]); }
    function cnpjOk(s){ if (s.length!==14) return false; if (/^(\d)\1{13}$/.test(s)) return false; const calc=(base)=>{ const pesos= base===12?[5,4,3,2,9,8,7,6,5,4,3,2]:[6,5,4,3,2,9,8,7,6,5,4,3,2]; let soma=0; for(let i=0;i<pesos.length;i++) soma+=parseInt(s[i])*pesos[i]; const resto=soma%11; return resto<2?0:11-resto; }; const d1=calc(12); if(d1!==parseInt(s[12])) return false; const d2=calc(13); return d2===parseInt(s[13]); }
    if (!raw){ err.style.display='none'; return; }
    if ((raw.length===11 && cpfOk(raw)) || (raw.length===14 && cnpjOk(raw))){ err.style.display='none'; return; }
    // mostra erro adaptado
    if (raw.length<11) { err.textContent='INCOMPLETO'; }
    else if (raw.length===11) { err.textContent='CPF INVÁLIDO'; }
    else if (raw.length<14) { err.textContent='INCOMPLETO'; }
    else if (raw.length===14) { err.textContent='CNPJ INVÁLIDO'; }
    else { err.textContent='FORMATO INVÁLIDO'; }
    err.style.display='block';
}
