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
  
      fileInput.addEventListener('change', function () {
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
  
      // Get file details
      let fileName = file.name;
      const contentType = file.type;  // This will be either image/* or text/*
      // Optionally, modify fileName to ensure uniqueness:
      fileName = `${Date.now()}-${fileName}`;
  
      // Replace with your actual API Gateway endpoint URL
      const presignedUrlEndpoint = 'https://dbrkmoo6l1.execute-api.eu-north-1.amazonaws.com/production';
  
      // Construct URL with query parameters
      const urlWithParams = `${presignedUrlEndpoint}?fileName=${encodeURIComponent(fileName)}&content-Type=${encodeURIComponent(contentType)}`;
  
      // Step 1: Request the pre-signed URL
      fetch(urlWithParams, { method: 'GET' })
        .then(response => response.json())
        .then(data => {
          console.log('Received presigned URL:', data.url);
          // Step 2: Use the presigned URL to upload the file via PUT
          return fetch( data.url, {
            method: 'PUT',
            headers: { 'Content-Type': contentType },
            body: file
          });
        })
        .then(uploadResponse => {
          if (uploadResponse.ok) {
            console.log('File successfully uploaded to S3!');
            // Optionally, update the UI with the final image URL:
            // e.g., publicUrl = `https://YOUR_BUCKET_NAME.s3.YOUR_REGION.amazonaws.com/${fileName}`;
            fileUploadContainer.innerHTML = `<img src="https://dozi-incidentreport-test.s3.eu-north-1.amazonaws.com/${fileName}" alt="Uploaded image" style="max-width: 100%; max-height: 300px;">`;
          } else {
            console.error('Upload failed:', uploadResponse.statusText);
            fileUploadContainer.innerHTML = `<div class="my-file-upload">Upload failed. Please try again.</div>`;
          }
        })
        .catch(error => {
          console.error('Error during upload:', error);
          fileUploadContainer.innerHTML = `<div class="my-file-upload">Upload failed. Please try again.</div>`;
        });
    });
  
    element.appendChild(fileUploadContainer);
  },
};
