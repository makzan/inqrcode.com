const QRCode = require('qrcode');
const lib = require('./_lib');

// /2d/img/{14-digit} -> GS1 2D barcode PNG (QR @ level H + centered GS1 logo)
// Supports ?domain= (default id.gs1.org)
exports.handler = async (event) => {
  const gtin = lib.onlyDigits(decodeURIComponent(lib.afterPrefix(event, '/2d/img/')));
  if (!gtin) {
    return lib.textResponse(400, 'Missing GTIN. Usage: /2d/img/{14-digit}');
  }
  const params = event.queryStringParameters || {};
  const domain = params.domain || 'id.gs1.org';
  const targetUrl = 'https://' + domain + '/01/' + gtin;
  try {
    const qr = await QRCode.toBuffer(targetUrl, {
      errorCorrectionLevel: 'H',
      width: 512,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' }
    });
    const png = lib.compositeLogo(qr, lib.getLogoBuffer(), 0.4);
    return lib.pngResponse(png);
  } catch (err) {
    return lib.textResponse(400, 'Could not generate 2D barcode: ' + err.message);
  }
};
