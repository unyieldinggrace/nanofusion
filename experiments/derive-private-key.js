const NanoCurrency = require('nanocurrency');

console.log(NanoCurrency.deriveSecretKey('42B6E48F67470FBA286B4A2D3D13CA85A3A24BBFB70DFAD329D089D5A294BBED', 0));
console.log(NanoCurrency.deriveSecretKey('42B6E48F67470FBA286B4A2D3D13CA85A3A24BBFB70DFAD329D089D5A294BBED', 1));
console.log(NanoCurrency.deriveSecretKey('42B6E48F67470FBA286B4A2D3D13CA85A3A24BBFB70DFAD329D089D5A294BBED', 2));
console.log(NanoCurrency.deriveSecretKey('42B6E48F67470FBA286B4A2D3D13CA85A3A24BBFB70DFAD329D089D5A294BBED', 3));

console.log(NanoCurrency.deriveSecretKey('194B244C86E7E8F653BCC610D353958FE8ED61D4B7BA2FB6B12FEBD38EE4E3A5', 0));
console.log(NanoCurrency.deriveSecretKey('194B244C86E7E8F653BCC610D353958FE8ED61D4B7BA2FB6B12FEBD38EE4E3A5', 1));
console.log(NanoCurrency.deriveSecretKey('194B244C86E7E8F653BCC610D353958FE8ED61D4B7BA2FB6B12FEBD38EE4E3A5', 2));
console.log(NanoCurrency.deriveSecretKey('194B244C86E7E8F653BCC610D353958FE8ED61D4B7BA2FB6B12FEBD38EE4E3A5', 3));
