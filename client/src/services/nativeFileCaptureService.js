/**
 * nativeFileCaptureService
 * Single Responsibility: Read selected image file from input element via FileReader as DataURL.
 */
export const nativeFileCaptureService = {
  readFileAsDataUrl: (file) => {
    return new Promise((resolve, reject) => {
      if (!file) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  },
};
