# inqrcode.com
Source for inQRCode.com

## Routes

| Route | Description |
|-------|-------------|
| `/{url}` | Generate a QR code for any URL (e.g. `inqrcode.com/https://makzan.net`) |
| `/img/{url}` | QR code only — image-only output, no UI |
| `/gtin/{code}` | EAN-13 / ITF-14 barcode for a GTIN-13 or GTIN-14 number |
| `/gtin/img/{code}` | Barcode only — image-only output, no UI |
| `/2d/{14-digit}` | GS1 2D barcode linking to `https://{domain}/01/{14-digit}` with GS1 logo |
| `/2d/{14-digit}?domain=id.gs1mo.org` | Same, using a custom domain |

### GTIN barcodes

13-digit numbers render as **EAN-13**; 14-digit numbers render as **ITF-14** (GTIN-14),
powered by [JsBarcode](https://github.com/lindell/JsBarcode).

### GS1 2D barcodes

Defaults to `https://id.gs1.org/01/{gtin}`. The QR code is styled with the GS1 logo
centered, using [qr-code-styling](https://github.com/kozakdenys/qr-code-styling) and
high error-correction (level H).
