export const uploadImageToCloudCDN = async (file: File, maxDim = 2000, quality = 0.82): Promise<string> => {
  try {
    // Compress client-side before upload. Uploading the original camera-resolution file
    // as-is meant every visitor — mobile included — downloaded the same multi-MB image
    // even though it's rendered far smaller on their screen, making the hero banner load
    // noticeably slower on mobile connections.
    let uploadFile: File | Blob = file;
    try {
      const compressedBase64 = await compressImage(file, maxDim, maxDim, quality);
      const compressedBlob = await (await fetch(compressedBase64)).blob();
      if (compressedBlob.size < file.size) {
        uploadFile = compressedBlob;
      }
    } catch (compressErr) {
      console.warn('Pre-upload compression skipped, uploading original file:', compressErr);
    }

    // Firebase Storage (same project as the site's Firestore data) instead of a free
    // third-party image host — imgbb's own reliability and speed are outside our control
    // and have repeatedly degraded (and gone fully down) without any change on our side.
    const { storage } = await import('../firebase');
    const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
    const path = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, uploadFile, { contentType: uploadFile.type || file.type });
    return await getDownloadURL(storageRef);
  } catch (err) {
    console.warn('Firebase Storage upload failed, falling back to compressed base64:', err);
  }

  // Fallback if Storage is unreachable (or its rules reject the write): compress conservatively
  // and always re-encode as JPEG (forceJpeg), since PNG re-encoding is lossless and barely
  // shrinks a photo at all — a "700KB" source PNG could still balloon past 1MiB as base64.
  // This becomes a base64 string stored directly on the Firestore settings document, which
  // shares its 1MiB total size with every other field on that doc.
  return compressImage(file, 1280, 1280, 0.65, true);
};

export const compressImage = (file: File, maxWidth = 3840, maxHeight = 3840, quality = 0.98, forceJpeg = false): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          
          const isPng = !forceJpeg && (file.type?.includes('png') || file.name?.toLowerCase().endsWith('.png'));
          if (isPng) {
            resolve(canvas.toDataURL('image/png'));
          } else {
            resolve(canvas.toDataURL('image/jpeg', quality));
          }
        } else {
          resolve(event.target?.result as string);
        }
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const compressBase64String = (base64Str: string, maxDim = 3840, quality = 0.98): Promise<string> => {
  if (!base64Str || !base64Str.startsWith('data:image')) return Promise.resolve(base64Str);
  if (base64Str.length < 150000) return Promise.resolve(base64Str);

  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          const isPngStr = base64Str.startsWith('data:image/png');
          resolve(canvas.toDataURL(isPngStr ? 'image/png' : 'image/jpeg', quality));
        } else {
          resolve(base64Str);
        }
      } catch (e) {
        resolve(base64Str);
      }
    };
    img.onerror = () => resolve(base64Str);
  });
};

export const parseFontFamilyStyle = (fontName?: string): { fontFamily: string; fontWeight?: number } => {
  if (!fontName) return { fontFamily: 'Pretendard, sans-serif' };
  if (fontName.startsWith('Pretendard-')) {
    const weightMap: Record<string, number> = {
      'Pretendard-Light': 300,
      'Pretendard-Medium': 500,
      'Pretendard-SemiBold': 600,
      'Pretendard-Bold': 700,
      'Pretendard-Black': 900,
    };
    return {
      fontFamily: 'Pretendard, sans-serif',
      fontWeight: weightMap[fontName] || 400
    };
  }
  return { fontFamily: fontName };
};

export const compressImageToBlob = (file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.7): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const mime = getMimeType(file);
          if (mime === 'image/png') {
            canvas.toBlob((blob) => {
              if (blob) resolve(blob);
              else reject(new Error('Canvas to Blob failed'));
            }, 'image/png');
          } else {
            canvas.toBlob((blob) => {
              if (blob) resolve(blob);
              else reject(new Error('Canvas to Blob failed'));
            }, mime, quality);
          }
        } else {
          reject(new Error('Canvas context failed'));
        }
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};
