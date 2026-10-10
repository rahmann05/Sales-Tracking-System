/**
 * nativeFileCaptureService
 * Single Responsibility: Read selected image file from input element via FileReader as DataURL.
 */
import {imageFileError} from '../../../shared/camera-input-policy.mjs';
export const nativeFileCaptureService = {
  readFileAsDataUrl: (file) => {
    return new Promise((resolve, reject) => {
      if (!file) {
        resolve(null);
        return;
      }
      const error=imageFileError(file);
      if(error){reject(new Error(error));return;}
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  },
};
