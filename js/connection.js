const Firebird = require('node-firebird');

const options = {
  //186.251.15.201
  //192.168.2.150
  host: '192.168.2.150',
  port: 3050,
  database: 'C:\\CLIENTES_EXTERNO\\MERCADO_ONLINE\\APPVENDA.FDB',
  user: 'SYSDBA',
  password: 'masterkey',
  lowercase_keys: false,
  role: null,
  pageSize: 4096
};

function conectar(callback) {
  Firebird.attach(options, function(err, db) {
    if (err) {
      callback(err);
      return;
    }
    callback(null, db);
  });
}


module.exports = {
  conectar,
};
