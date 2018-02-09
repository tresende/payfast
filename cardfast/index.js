var app = require('./config/custom-express')();

app.listen(3001, function(){
  console.log('Servidor de cartoes rodando na porta 3001.');
});


//curl http://localhost:3001/cartoes/autoriza -X POST -v -H "Content-type: application/json" -d @/Users/thiago/Desktop/Estudos/node/payfast/cardfast/files/cartao.json | json_pp