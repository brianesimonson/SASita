# Bundled syntax coloring

PrismJS 1.30.0, MIT license, from the authoritative npm release:
https://www.npmjs.com/package/prismjs/v/1.30.0
https://github.com/PrismJS/prism/blob/v1.30.0/components/prism-sas.js

Files: components/prism-core.min.js, components/prism-sas.min.js, LICENSE.
The downloaded release tarball was verified against npm's SHA-512 integrity:
sha512-DEvV2ZF2r2/63V+tK8hQvrR2ZGn10srHbXviTlcv7Kpzw8jWiNTqbVgjO3IY8RxrrOUF8VPMQQFysYYYv0YZxw==

These files are stored locally and embedded by build-offline.py. No CDN or runtime npm installation is used. The upstream grammar supports SAS syntax coloring; it does not determine engine compatibility. No additional language grammars are bundled for unsupported embedded SQL/Groovy/Lua procedures. The complete license is embedded in the standalone HTML and included in the ZIP.

## Chart.js plotting renderer

Chart.js 4.5.1, MIT license, from https://www.npmjs.com/package/chart.js/v/4.5.1 .
The release tarball was verified against npm integrity:
sha512-GIjfiT9dbmHRiYi6Nl2yFCq7kkwdkp1W/lp2J99rX0yo9tgJGn3lKQATztIjb5tVtevcBtIdICNWqlq5+E8/Pw==

Files: dist/chart.umd.min.js and LICENSE.md. The UMD build includes its color helper and attribution. Chart.js and its license are embedded in the standalone HTML; no CDN, internet connection, or runtime npm install is needed. The modular app loads the locally vendored script. Histogram binning and the supported SAS-style parser are implemented by Sassy, not Chart.js.
