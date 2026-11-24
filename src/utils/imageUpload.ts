export function readCompressedImageFile(
  file: File,
  onSuccess: (dataUrl: string) => void,
  onError?: (msg: string) => void
) {
  if (!file.type.startsWith('image/')) {
    onError?.('Please select a valid image file (JPG, PNG, WEBP, or HEIC).');
    return;
  }

  const reader = new FileReader();
  reader.onerror = () => {
    onError?.('Could not read the selected image file.');
  };
  reader.onload = () => {
    const rawResult = typeof reader.result === 'string' ? reader.result : '';
    if (!rawResult) {
      onError?.('Image file could not be processed.');
      return;
    }

    // Compress large photos cleanly so they persist smoothly in backend JSON & localStorage
    const img = new Image();
    img.onload = () => {
      try {
        const maxDim = 1200;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width >= height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          onSuccess(rawResult);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', 0.82);
        onSuccess(compressed || rawResult);
      } catch {
        onSuccess(rawResult);
      }
    };
    img.onerror = () => {
      onSuccess(rawResult);
    };
    img.src = rawResult;
  };
  reader.readAsDataURL(file);
}
