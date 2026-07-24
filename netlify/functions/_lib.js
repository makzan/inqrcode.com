const PNG = require('pngjs').PNG;

// GS1 logo embedded as base64 so the function has no file-system dependency.
const LOGO_B64 = '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';

function getRawUrl(event) {
  if (event.rawUrl) return event.rawUrl;
  const headers = event.headers || {};
  const proto = headers['x-forwarded-proto'] || 'https';
  const host = headers.host || headers.Host || '';
  return proto + '://' + host + (event.path || '') + (event.rawQuery ? '?' + event.rawQuery : '');
}

// Everything in the URL after the first occurrence of `prefix`. Preserves the
// target's own query string and percent-encoding (e.g. for /img/{any url}).
function afterPrefix(event, prefix) {
  const url = getRawUrl(event);
  const idx = url.indexOf(prefix);
  return idx >= 0 ? url.slice(idx + prefix.length) : '';
}

function onlyDigits(s) {
  return s.replace(/\D/g, '');
}

function pngResponse(buffer) {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400, immutable',
      'Access-Control-Allow-Origin': '*'
    },
    body: buffer.toString('base64'),
    isBase64Encoded: true
  };
}

function textResponse(statusCode, message) {
  return {
    statusCode: statusCode,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    body: message
  };
}

function getLogoBuffer() {
  return Buffer.from(LOGO_B64, 'base64');
}

// Composite a logo PNG onto the center of a QR PNG, scaled to `imageSize`
// (fraction of the QR's smaller dimension). Alpha-blended, nearest-neighbor.
function compositeLogo(qrBuffer, logoBuffer, imageSize) {
  const qr = PNG.sync.read(qrBuffer);
  const logo = PNG.sync.read(logoBuffer);
  const target = Math.floor(Math.min(qr.width, qr.height) * imageSize);
  const scale = target / Math.max(logo.width, logo.height);
  const lw = Math.max(1, Math.round(logo.width * scale));
  const lh = Math.max(1, Math.round(logo.height * scale));
  const ox = Math.floor((qr.width - lw) / 2);
  const oy = Math.floor((qr.height - lh) / 2);
  for (let y = 0; y < lh; y++) {
    const sy = Math.floor(y / scale);
    for (let x = 0; x < lw; x++) {
      const sx = Math.floor(x / scale);
      const si = (sy * logo.width + sx) * 4;
      const la = logo.data[si + 3] / 255;
      if (la === 0) continue;
      const dx = ox + x, dy = oy + y;
      if (dy < 0 || dy >= qr.height || dx < 0 || dx >= qr.width) continue;
      const di = (dy * qr.width + dx) * 4;
      if (la >= 1) {
        qr.data[di] = logo.data[si];
        qr.data[di + 1] = logo.data[si + 1];
        qr.data[di + 2] = logo.data[si + 2];
        qr.data[di + 3] = 255;
      } else {
        qr.data[di] = Math.round(logo.data[si] * la + qr.data[di] * (1 - la));
        qr.data[di + 1] = Math.round(logo.data[si + 1] * la + qr.data[di + 1] * (1 - la));
        qr.data[di + 2] = Math.round(logo.data[si + 2] * la + qr.data[di + 2] * (1 - la));
        qr.data[di + 3] = 255;
      }
    }
  }
  return PNG.sync.write(qr);
}

module.exports = {
  getRawUrl: getRawUrl,
  afterPrefix: afterPrefix,
  onlyDigits: onlyDigits,
  pngResponse: pngResponse,
  textResponse: textResponse,
  getLogoBuffer: getLogoBuffer,
  compositeLogo: compositeLogo
};
