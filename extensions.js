export const ImageUploadExtension = {
  name: 'ImageUpload',
  type: 'response',
  match: ({ trace }) =>
    trace.type === 'ext_image_upload' || trace.payload.name === 'ext_image_upload',
  render: ({ trace, element }) => {
    const uploadContainer = document.createElement('div');
    
    uploadContainer.innerHTML = `
      <style>
        .image-upload-container {
          padding: 10px;
          text-align: center;
        }
        
        .upload-input {
          display: none;
        }
        
        .upload-button {
          background: linear-gradient(to right, #2e6ee1, #2e7ff1);
          border: none;
          color: white;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          margin-bottom: 10px;
        }
        
        .preview-image {
          max-width: 200px;
          max-height: 200px;
          margin-top: 10px;
          display: none;
        }
        
        .error-message {
          color: red;
          font-size: 12px;
          display: none;
        }
      </style>
      
      <div class="image-upload-container">
        <input type="file" class="upload-input" accept="image/*">
        <button class="upload-button">Upload Image</button>
        <img class="preview-image">
        <div class="error-message"></div>
      </div>
    `;

    const fileInput = uploadContainer.querySelector('.upload-input');
    const uploadButton = uploadContainer.querySelector('.upload-button');
    const previewImage = uploadContainer.querySelector('.preview-image');
    const errorMessage = uploadContainer.querySelector('.error-message');

    // Maximum file size (5MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024;

    uploadButton.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', (event) => {
      const file = event.target.files[0];
      
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith('image/')) {
        errorMessage.textContent = 'Please select an image file';
        errorMessage.style.display = 'block';
        return;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        errorMessage.textContent = 'File size must be less than 5MB';
        errorMessage.style.display = 'block';
        return;
      }

      // Reset error message
      errorMessage.style.display = 'none';

      // Show preview
      const reader = new FileReader();
      reader.onload = (e) => {
        previewImage.src = e.target.result;
        previewImage.style.display = 'block';
        
        // Send image data to Voiceflow
        window.voiceflow.chat.interact({
          type: 'complete',
          payload: {
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            imageData: e.target.result // base64 encoded image
          },
        });
      };
      
      reader.readAsDataURL(file);
    });

    element.appendChild(uploadContainer);
  },
};

// Register extension when Voiceflow is ready
window.addEventListener('voiceflow:ready', function() {
  window.voiceflow.chat.addExtension(ImageUploadExtension);
}); 