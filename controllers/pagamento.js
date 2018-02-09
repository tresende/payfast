var logger = require('../servicos/logger.js');

module.exports = function (app) {
    app.get('/pagamentos', function (req, res) {
        res.send('Ok!');
    })

    //curl -X DELETE http://localhost:3000/pagamentos/pagamento/10 -v
    app.delete('/pagamentos/pagamento/:id', function (req, res) {
        var pagamento = {};
        var id = req.params.id;
        pagamento.id = id;
        pagamento.status = 'CANCELADO'
        var connection = app.persistencia.connectionFactory();
        var pagamentoDao = new app.persistencia.pagamentoDao(connection);
        pagamentoDao.atualiza(pagamento, function (erro) {
            if (erro) {
                res.status(204).send(erro);
                return;
            }
            res.send(pagamento);
        });
    });

    //curl -X PUT http://localhost:3000/pagamentos/pagamento/10 -v
    app.get('/pagamentos/pagamento/:id', function (req, res) {
        logger.info('Log: ' + id);
        var id = req.params.id;
        var memcachedClient = new app.servicos.memcachedClient();
        memcachedClient.get('pagamento-' + id, function (erro, retorno) {
            if (erro || !retorno) {
                console.log('Miss!');
            }
            else {
                console.log('Hit!');
                console.log(retorno);
            }
        });

        var connection = app.persistencia.connectionFactory();
        var pagamentoDao = new app.persistencia.pagamentoDao(connection);
        pagamentoDao.buscaPorId(id, function (erro, resultado) {
            if (erro) {
                console.log('Erro: ' + erro);
                res.status(400).send(erro);
                return;
            }
            res.send(resultado);
        });
    })

    //curl -X PUT http://localhost:3000/pagamentos/pagamento/10 -v
    app.put('/pagamentos/pagamento/:id', function (req, res) {
        var pagamento = {};
        var id = req.params.id;
        pagamento.id = id;
        pagamento.status = 'CONFIRMADO'
        var connection = app.persistencia.connectionFactory();
        var pagamentoDao = new app.persistencia.pagamentoDao(connection);


        pagamentoDao.atualiza(pagamento, function (erro) {
            if (erro) {
                res.status(400).send(erro);
                return;
            }
            res.send(pagamento);
        });
    });


    //curl http://localhost:3000/pagamentos/pagamento -X POST -v -H "Content-type: application/json" -d @/Users/thiago/Desktop/Estudos/node/payfast/files/pagamento.json | json_pp
    app.post('/pagamentos/pagamento', function (req, res) {

        req.assert('pagamento.forma_de_pagamento', "Forma de pagamento é obrigatória").notEmpty();
        req.assert('pagamento.valor', "Valor inválido").notEmpty().isFloat();

        var errors = req.validationErrors();
        if (errors) {
            res.status(400).json(errors);
            return;
        }
        var pagamento = req.body.pagamento;

        pagamento.status = 'CRIADO';
        pagamento.data = new Date;

        var connection = app.persistencia.connectionFactory();
        var pagamentoDao = new app.persistencia.pagamentoDao(connection);

        pagamentoDao.salva(pagamento, function (erro, resultado) {
            if (erro) {
                res.status(500).json(erro);
            }
            else {
                pagamento.id = resultado.insertId;
                res.location('/Pagamentos/Pagamento/' + pagamento.id);
                if (pagamento.forma_de_pagamento == 'cartao') {
                    var cartao = req.body.cartao;
                    var clienteCartoes = new app.servicos.clienteCartoes();
                    clienteCartoes.autoriza(cartao,
                        function (exception, request, response, retorno) {
                            if (exception) {
                                console.log(exception);
                                res.status(400).send(exception);
                                return;
                            }

                            res.location('/pagamentos/pagamento/' +  pagamento.id);

                            var memcachedClient = new app.servicos.memcachedClient();
                            memcachedClient.set('pagamento-' + pagamento.id, pagamento, 60000, function () {
                                console.log('Nova Chave Adicionada');
                            });

                            var response = {
                                dados_do_pagamanto: pagamento,
                                cartao: retorno,
                                links: [
                                    {
                                        href: "http://localhost:3000/pagamentos/pagamento/"
                                            + pagamento.id,
                                        rel: "confirmar",
                                        method: "PUT"
                                    },
                                    {
                                        href: "http://localhost:3000/pagamentos/pagamento/"
                                            + pagamento.id,
                                        rel: "cancelar",
                                        method: "DELETE"
                                    }
                                ]
                            }

                            res.status(201).json(response);
                            return;
                        });
                } else {
                    var response = {
                        dados_do_pagamento: pagamento,

                        links: [
                            {
                                href: 'http://localhost:3000/pagamentos/pagamento/' + pagamento.id,
                                rel: "confirmar",
                                method: "PUT"
                            },
                            {
                                href: 'http://localhost:3000/pagamentos/pagamento/' + pagamento.id,
                                rel: "cancelar",
                                method: "DELETE"
                            }
                        ]
                    };

                    res.status(201).json(response);
                }
            }
        });
    });
}