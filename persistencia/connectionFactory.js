var mysql = require('mysql');

function createDBConnection() {
    return mysql.createConnection({
        host: '172.17.0.1',
        user: 'root',
        password: 'root',
        database: 'PAYFAST'
    });
}

module.exports = function () {
    return createDBConnection;
}