const bwipjs = require('bwip-js');
const lib = require('./_lib');

// /gtin/img/{code} -> EAN-13 (13 digits) or ITF-14 (14 digits) PNG (image/png)
exports.handler = async (event) => {
  const code = lib.onlyDigits(decodeURIComponent(lib.afterPrefix(event, '/gtin/img/')));
  if (!code) {
    return lib.textResponse(400, 'Missing GTIN. Usage: /gtin/img/{code}');
  }
  const bcid = code.length >= 14 ? 'itf14' : 'ean13';
  try {
    const png = await bwipjs.toBuffer({
      bcid: bcid,
      text: code,
      scale: 4,
      height: 12,
      includetext: true,
      textxalign: 'center',
      paddingwidth: 5
    });
    return lib.pngResponse(png);
  } catch (err) {
    return lib.textResponse(400, 'Invalid barcode (' + bcid + '): ' + err.message);
  }
};
