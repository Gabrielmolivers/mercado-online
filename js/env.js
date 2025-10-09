// Base pública da API (reverse proxy HTTPS)
// Altere o DNS para que api.controlpowerapp.com.br aponte para 186.251.15.201
// e configure o proxy (Caddy) para TLS automático
window.__API_BASE__ = window.__API_BASE__ || 'https://api.controlpowerapp.com.br';
