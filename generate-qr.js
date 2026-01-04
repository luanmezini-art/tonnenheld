const QRCode = require('qrcode');
const fs = require('fs');

const url = 'https://tonnenheld.vercel.app';
const outputPath = 'tonnenheld-qr.png';

QRCode.toFile(outputPath, url, {
    color: {
        dark: '#000000',  // Black dots
        light: '#ffffff'  // White background
    },
    scale: 10,
    margin: 1
}, function (err) {
    if (err) throw err;
    console.log('QR code saved to ' + outputPath);
});
