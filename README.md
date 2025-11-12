# Mercado Online

## Recuperação de Senha (Esqueci minha senha)

Fluxo implementado para recuperação de senha via código de verificação (6 dígitos) enviado por e-mail, com expiração de 2 horas.

- Solicitação do código: POST `/api/esqueci-senha`
  - Entrada: `{ email: string }`
  - Comportamento: Gera código de 6 dígitos, armazena em `DIGVERIFICADOR` no formato `CODIGO|TIMESTAMP` (epoch ms) e envia e-mail ao usuário se SMTP estiver configurado. A resposta não revela a existência do e-mail no sistema.

- Verificação do código: POST `/api/verificar-codigo`
  - Entrada: `{ email: string, codigo: string }`
  - Comportamento: Valida o código e se ainda está dentro do prazo (2 horas). Não altera senha.

- Redefinição de senha: POST `/api/redefinir-senha`
  - Entrada: `{ email: string, codigo: string, novaSenha: string }`
  - Comportamento: Valida o código/expiração e atualiza a senha do usuário; limpa `DIGVERIFICADOR` ao concluir.

### Páginas
- `esqueci-senha.html`: Formulário para solicitar envio do código para o e-mail.
- `redefinir-senha.html`: Formulário para informar e-mail, código e nova senha.
- O link "Esqueceu a senha?" no menu de login do cabeçalho aponta para `esqueci-senha.html`.

---

## Configuração de E-mail (SMTP)
Para envio real de e-mails, configure as variáveis de ambiente abaixo (por exemplo, em `.env` ou no ambiente do sistema):

- `SMTP_HOST`: host do servidor SMTP (ex.: `smtp.gmail.com` ou servidor do seu provedor)
- `SMTP_PORT`: porta SMTP (comum: `587` para STARTTLS, `465` para SSL)
- `SMTP_USER`: usuário (login) da conta SMTP
- `SMTP_PASS`: senha da conta SMTP (ou App Password quando aplicável)

Com essas variáveis definidas, o servidor utilizará o `nodemailer` para enviar o e-mail de recuperação. Se qualquer variável estiver ausente, o envio é ignorado de forma segura e um log é impresso no console como fallback.

Dicas:
- Para Gmail, recomenda-se usar App Password (2FA habilitada) ou um provedor SMTP dedicado.
- Verifique a caixa de Spam/Lixo caso o e-mail não chegue.

---

## Dependências
- `nodemailer` para envio de e-mails (já declarado em `package.json`).

---

## Observações
- O campo de verificação (`DIGVERIFICADOR`) já existe no banco e é reutilizado. Não alteramos o schema.
- O código de verificação expira após 2 horas a partir da geração.
- E-mails são tratados de forma case-insensitive no login/cadastro/recuperação.
