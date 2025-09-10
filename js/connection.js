const Firebird = require('node-firebird');

const options = {
  //186.251.15.201
  //192.168.2.150
  host: '186.251.15.201',
  port: 3050,
  database: 'C:\\CLIENTES_EXTERNO\\MERCADO_ONLINE\\BASE_MERCADO.FDB',
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

function testarQuery(callback) {
  conectar(function(err, db) {
    if (err) {
      callback(err);
      return;
    }
    db.query('SELECT FIRST 10 * FROM PESSOAS', function(err, result) {
      db.detach();
      if (err) {
        callback(err);
      } else {
        callback(null, result);
      }
    });
  });
}

module.exports = {
  conectar,
  testarQuery
};
