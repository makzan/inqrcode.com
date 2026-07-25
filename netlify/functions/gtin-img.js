const { createCanvas } = require('canvas');
const JsBarcode = require('jsbarcode');
const lib = require('./_lib');

// /gtin/img/{code} -> EAN-13 (13 digits) or ITF-14 (14 digits) PNG (image/png)
// Uses the same library (JsBarcode) and the same options as gtin.html so the
// image output matches the interactive page exactly. Keep the options in sync.
exports.handler = async (event) => {
  // Strip any query string so stray digits never leak into the code.
  const raw = lib.afterPrefix(event, '/gtin/img/').split('?')[0];
  const code = lib.onlyDigits(decodeURIComponent(raw));
  if (!code) {
    return lib.textResponse(400, 'Missing GTIN. Usage: /gtin/img/{code}');
  }
  const format = code.length >= 14 ? 'ITF14' : 'EAN13';
  try {
    const canvas = createCanvas(1, 1); // JsBarcode resizes it
    JsBarcode(canvas, code, {
      format: format,
      width: 3,
      height: 120,
      fontSize: 20,
      margin: 10,
      textMargin: 6
    });
    return lib.pngResponse(canvas.toBuffer('image/png'));
  } catch (err) {
    // JsBarcode throws plain objects (not Error) on invalid input/check digit.
    const message = (err && err.message) || 'invalid input or check digit';
    return lib.textResponse(400, 'Invalid barcode (' + format + '): ' + message);
  }
};
