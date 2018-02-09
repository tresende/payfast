var fs = require('fs');
fs.createReadStream("image.jpg")
    .pipe(fs.createWriteStream("image2.jpg"))
    .on('finish', function () {
        console.log('Arquivo Escrito!');
    });