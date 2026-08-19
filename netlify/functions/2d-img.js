const nodeCanvas = require('canvas');
const { JSDOM } = require('jsdom');
const QRCodeStyling = require('qr-code-styling');
const lib = require('./_lib');

// /2d/img/{14-digit} -> GS1 2D barcode PNG (QR @ level H + centered GS1 logo)
// Supports ?domain= (default id.gs1mo.org)
// Uses the same library (qr-code-styling) and the same options as 2d.html so
// the image output matches the interactive page exactly. Keep them in sync.
exports.handler = async (event) => {
  // Strip the query string first so its digits (e.g. the "1" in id.gs1mo.org)
  // never leak into the GTIN — the interactive page reads location.pathname only.
  const raw = lib.afterPrefix(event, '/2d/img/').split('?')[0];
  const gtin = lib.onlyDigits(decodeURIComponent(raw));
  if (!gtin) {
    return lib.textResponse(400, 'Missing GTIN. Usage: /2d/img/{14-digit}');
  }
  const params = event.queryStringParameters || {};
  const domain = params.domain || 'id.gs1mo.org';
  const targetUrl = 'https://' + domain + '/01/' + gtin;
  try {
    const logoBuffer = lib.getLogoBuffer();
    const qrCode = new QRCodeStyling({
      jsdom: JSDOM,           // required in Node: qr-code-styling needs a DOM
      nodeCanvas: nodeCanvas, // required in Node: canvas backend for PNG output
      width: 400,
      height: 400,
      type: 'canvas',
      data: targetUrl,
      // Passed so hideBackgroundDots clears the logo area, but see below: the
      // logo pixels are drawn manually.
      image: logoBuffer,
      qrOptions: { errorCorrectionLevel: 'H' },
      dotsOptions: { color: '#000000', type: 'square' },
      backgroundOptions: { color: '#ffffff' },
      cornersSquareOptions: { type: 'square' },
      cornersDotOptions: { type: 'square' },
      imageOptions: {
        margin: 8,
        imageSize: 0.25,
        hideBackgroundDots: true,
        saveAsBlob: true
      }
    });
    await qrCode.getRawData('png'); // waits for the internal drawing promise
    const canvas = qrCode._nodeCanvas;

    // node-canvas does not rasterize <image> elements nested inside the SVG
    // that qr-code-styling renders from, so the logo never reaches the canvas.
    // Draw it manually, centered and scaled like qr-code-styling does
    // (imageSize fraction of the smaller dimension). The logo SVG is
    // transparent, so fill an explicit white backing behind it first —
    // same visual result as the browser, where hideBackgroundDots clears the
    // dots over the white background (logo rect + imageOptions.margin).
    const logo = await nodeCanvas.loadImage(logoBuffer);
    const target = Math.min(canvas.width, canvas.height) * 0.25;
    const scale = target / Math.max(logo.width, logo.height);
    const lw = Math.round(logo.width * scale);
    const lh = Math.round(logo.height * scale);
    // node-canvas rasterizes an SVG at its intrinsic size (72x61 here) on
    // load, so upscaling that tiny bitmap made the logo blurry. Setting
    // width/height on an SVG-backed image re-rasterizes the vector at that
    // resolution instead — set them to the exact draw size and blit 1:1.
    logo.width = lw;
    logo.height = lh;
    const lx = (canvas.width - lw) / 2;
    const ly = (canvas.height - lh) / 2;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(lx - 8, ly - 8, lw + 16, lh + 16);
    ctx.drawImage(logo, lx, ly, lw, lh);

    return lib.pngResponse(canvas.toBuffer('image/png'));
  } catch (err) {
    return lib.textResponse(400, 'Could not generate 2D barcode: ' + err.message);
  }
};
