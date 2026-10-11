// Resolve evidence before building a file so a failed attachment is never silently omitted.
export async function documentImages(blueprint) {
  const images = [];
  for (const attachment of blueprint.images || []) {
    let dataUrl = attachment.dataUrl || attachment.url;
    try {
      if (!dataUrl?.startsWith('data:')) {
        const response = await fetch(dataUrl, {signal: AbortSignal.timeout(15000), credentials: 'same-origin'});
        if (!response.ok) throw new Error('Image unavailable');
        const blob = await response.blob();
        if (blob.size > 8_000_000) throw new Error('Image too large');
        dataUrl = `data:${blob.type};base64,${bytesToBase64(new Uint8Array(await blob.arrayBuffer()))}`;
      }
      if (!/^data:image\/(png|jpeg|webp);base64,/i.test(dataUrl) || dataUrl.length > 12_000_000) throw new Error('Invalid image');
      let bytes = Uint8Array.from(atob(dataUrl.split(',')[1]), c => c.charCodeAt(0));
      let type = dataUrl.match(/^data:image\/(\w+)/i)[1].toLowerCase();
      let width, height;
      if (typeof Image !== 'undefined') {
        const img = new Image();
        img.src = dataUrl;
        await img.decode();
        width = img.naturalWidth; height = img.naturalHeight;
        if (type === 'webp') {
          const canvas = document.createElement('canvas');
          canvas.width = width; canvas.height = height;
          canvas.getContext('2d').drawImage(img, 0, 0);
          dataUrl = canvas.toDataURL('image/png'); type = 'png';
          bytes = Uint8Array.from(atob(dataUrl.split(',')[1]), c => c.charCodeAt(0));
        }
      } else {
        const {jsPDF} = await import('jspdf');
        const props = new jsPDF().getImageProperties(dataUrl);
        width = props.width; height = props.height;
      }
      if (!(width > 0 && height > 0) || width * height > 40_000_000) throw new Error('Invalid dimensions');
      images.push({...attachment, dataUrl, bytes, type: type === 'jpeg' ? 'jpg' : type, width, height});
    } catch (cause) {
      throw new Error(`Foto ${attachment.caption || 'dokumen'} gagal dimuat. Periksa lampiran sebelum mengekspor ulang.`, {cause});
    }
  }
  return images;
}

function bytesToBase64(bytes) {
  let binary = '';
  for (let start = 0; start < bytes.length; start += 32768) binary += String.fromCharCode(...bytes.subarray(start, start + 32768));
  return btoa(binary);
}

export function fitImage(image, maxWidth, maxHeight) {
  const scale = Math.min(maxWidth / image.width, maxHeight / image.height);
  return {width: image.width * scale, height: image.height * scale};
}
