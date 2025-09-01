export const resizeImage = async (file: File, targetWidth: number = 1200): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Calculate new dimensions
        const aspectRatio = img.height / img.width;
        const targetHeight = Math.round(targetWidth * aspectRatio);

        // Set canvas dimensions
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        // Draw resized image
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        // Convert canvas to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Could not create blob from canvas'));
              return;
            }
            
            // Create new file from blob
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: file.lastModified,
            });
            
            resolve(resizedFile);
          },
          file.type,
          0.9  // Quality parameter
        );
      };

      img.onerror = () => {
        reject(new Error('Error loading image'));
      };
    };

    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };

    reader.readAsDataURL(file);
  });
}; 