// Configuração do endpoint da API no frontend
// Por padrão usa a mesma origem (""), mas pode ser sobrescrito antes dos scripts principais
// Exemplo em produção (HostGator):
// <script>window.__API_BASE__ = 'https://api.seu-dominio.com';</script>
// ou usando IP/porta: window.__API_BASE__ = 'http://SEU_IP_PUBLICO:3000';

(function () {
  if (!window.__API_BASE__) {
    window.__API_BASE__ = '';
  }
  window.apiUrl = function (path) {
    let p = String(path || '');
    if (!p.startsWith('/')) p = '/' + p;
    if (p.startsWith('/api/')) {
      return (window.__API_BASE__ || '') + p;
    }
    return p;
  };
})();
