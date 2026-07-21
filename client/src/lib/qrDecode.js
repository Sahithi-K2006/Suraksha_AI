import jsQR from 'jsqr';

export function decodeQrFromImageData(imageData) {
  const result = jsQR(imageData.data, imageData.width, imageData.height);
  return result ? result.data : null;
}

export function fileToImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve(img);
    };
    img.onerror = reject;
    img.src = url;
  });
}

export async function decodeQrFromFile(file) {
  const img = await fileToImage(file);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(img.src);
  return decodeQrFromImageData(imageData);
}
