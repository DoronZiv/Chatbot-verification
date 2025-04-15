// Import the S3 upload function
const { uploadFileToS3 } = require('./uploadFileS3');

export const ImageUploadExtension = {
    name: 'ImageUpload',
    type: 'response',
    match: ({ trace } = {}) =>
      trace?.type === 'ext_image_upload' || trace?.payload?.name === 'ext_image_upload',
    render: ({ trace, element }) => {
      const fileUploadContainer = document.createElement('div')
      fileUploadContainer.innerHTML = `
        <style>
          .my-file-upload {
            border: 2px dashed rgba(46, 110, 225, 0.3);
            padding: 20px;
            text-align: center;
            cursor: pointer;
          }
        </style>
        <div class='my-file-upload'>העלאת קובץ כאן</div>
        <input type='file' style='display: none;'>
      `
  
      const fileInput = fileUploadContainer.querySelector('input[type=file]')
      const fileUploadBox = fileUploadContainer.querySelector('.my-file-upload')
  
      fileUploadBox.addEventListener('click', function () {
        fileInput.click()
      })
  
      fileInput.addEventListener('change', async function () {
        const file = fileInput.files[0]
        console.log('File selected:', file)

        // Validate that the file is either an image or text
        if (!file.type.startsWith('image/') && !file.type.startsWith('text/')) {
          fileUploadContainer.innerHTML = `<div class="my-file-upload" style="color: red;">Please select an image or text file only</div>`
          return
        }
  
        // Show appropriate loading indicator based on file type
        if (file.type.startsWith('image/')) {
          fileUploadContainer.innerHTML = `<img src="https://s3.amazonaws.com/com.voiceflow.studio/share/upload/upload.gif" alt="Upload" width="50" height="50">`
        } else {
          fileUploadContainer.innerHTML = `<div class="my-file-upload">Uploading text file...</div>`
        }

        try {
          // Create FormData for the file upload
          const formData = new FormData();
          formData.append('file', file);
          formData.append('fileName', `${Date.now()}-${file.name}`);
          formData.append('contentType', file.type);

          // Send the file directly to your backend for S3 upload
          const response = await fetch('https://dbrkmoo6l1.execute-api.eu-north-1.amazonaws.com/production/upload', {
            method: 'POST',
            body: formData
          });

          if (!response.ok) {
            throw new Error('Upload failed');
          }

          const result = await response.json();
          
          if (result.url) {
            // Display the uploaded file
            if (file.type.startsWith('image/')) {
              fileUploadContainer.innerHTML = `<img src="${result.url}" alt="Uploaded image" style="max-width: 100%; max-height: 300px;">`;
            } else {
              fileUploadContainer.innerHTML = `<div class="my-file-upload">File uploaded successfully! <a href="${result.url}" target="_blank">View file</a></div>`;
            }
          } else {
            throw new Error('Upload failed');
          }
        } catch (error) {
          console.error('Error during upload:', error);
          fileUploadContainer.innerHTML = `<div class="my-file-upload">Upload failed. Please try again.</div>`;
        }
      })
  
      element.appendChild(fileUploadContainer)
    }
}