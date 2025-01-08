export const ImageUploadExtension = {
  name: 'ImageUpload',
  type: 'response',
  match: ({ trace }) => {
    console.log('Trace received in match:', {
      type: trace.type,
      payload: trace.payload,
      full: trace
    });
    
    // More specific matching logic
    const isMatch = 
      trace.type === 'ext_image_upload' || 
      trace.type === 'component' ||
      (trace.payload && 
       (trace.payload.name === 'ext_image_upload' || 
        trace.payload.type === 'ext_image_upload'));
    
    console.log('Match result:', isMatch);
    return isMatch;
  },
  render: ({ trace, element }) => {
    console.log('Rendering image upload component');
    const uploadContainer = document.createElement('div');
    
    uploadContainer.innerHTML = `
      <style>
        .image-upload-container {
          padding: 10px;
          text-align: center;
          border: 2px dashed #2e6ee1;
          border-radius: 8px;
          margin: 10px 0;
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
          font-weight: bold;
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
          margin-top: 5px;
        }
      </style>
      
      <div class="image-upload-container">
        <input type="file" class="upload-input" accept="image/*">
        <button class="upload-button">📸 Upload Image</button>
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
      console.log('Upload button clicked');
      fileInput.click();
    });

    fileInput.addEventListener('change', (event) => {
      console.log('File selected');
      const file = event.target.files[0];
      
      if (!file) return;

      console.log('File details:', {
        name: file.name,
        type: file.type,
        size: file.size
      });

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
        console.log('File loaded successfully');
        previewImage.src = e.target.result;
        previewImage.style.display = 'block';
        
        // Send image data to Voiceflow
        try {
          window.voiceflow.chat.interact({
            type: 'complete',
            payload: {
              fileName: file.name,
              fileType: file.type,
              fileSize: file.size,
              imageData: e.target.result // base64 encoded image
            },
          });
          console.log('Image data sent to Voiceflow');
        } catch (error) {
          console.error('Error sending image to Voiceflow:', error);
          errorMessage.textContent = 'Error uploading image';
          errorMessage.style.display = 'block';
        }
      };
      
      reader.onerror = (error) => {
        console.error('Error reading file:', error);
        errorMessage.textContent = 'Error reading file';
        errorMessage.style.display = 'block';
      };
      
      reader.readAsDataURL(file);
    });

    console.log('Appending upload container to element');
    element.appendChild(uploadContainer);
  },
};

// Debug logs for initialization
console.log('Image Upload Extension loaded');

// Register extension when Voiceflow is ready
window.addEventListener('voiceflow:ready', function() {
  console.log('Voiceflow ready event triggered');
  try {
    window.voiceflow.chat.addExtension(ImageUploadExtension);
    console.log('Extension added successfully');
  } catch (error) {
    console.error('Error adding extension:', error);
  }
}); 