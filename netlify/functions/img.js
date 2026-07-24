const QRCode = require('qrcode');
const lib = require('./_lib');

// /img/{any url} -> QR code PNG (image/png)
exports.handler = async (event) => {
  const target = lib.afterPrefix(event, '/img/');
  if (!target) {
    return lib.textResponse(400, 'Missing URL. Usage: /img/{url}');
  }
  try {
    const png = await QRCode.toBuffer(target, {
      errorCorrectionLevel: 'M',
      width: 512,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' }
    });
    return lib.pngResponse(png);
  } catch (err) {
    return lib.textResponse(400, 'Could not generate QR code: ' + err.message);
  }
};
