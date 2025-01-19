export const ImageUploadExtension = {
    name: 'ImageUpload',
    type: 'response',
    match: ({ trace }) =>
      trace.type === 'ext_image_upload' || trace.payload.name === 'ext_image_upload',
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
  
        fileUploadContainer.innerHTML = `<img src="https://s3.amazonaws.com/com.voiceflow.studio/share/upload/upload.gif" alt="Upload" width="50" height="50">`
  
        var data = new FormData()
        data.append('file', file)

        // Send file to Python backend
        fetch('http://localhost:8080/upload', {
          method: 'POST',
          body: data,
          headers: {
            'Accept': 'application/json'
          },
          mode: 'cors',
          credentials: 'include'
        })
        .then(response => response.json())
        .then(result => {
          console.log('Upload successful:', result);
          // Update UI with uploaded image
          fileUploadContainer.innerHTML = `<img src="${result.url}" alt="Uploaded image" style="max-width: 100%; max-height: 300px;">`;
        })
        .catch(error => {
          console.error('Upload failed:', error);
          fileUploadContainer.innerHTML = `<div class="my-file-upload">Upload failed. Please try again.</div>`;
        });
      })
  
      element.appendChild(fileUploadContainer)
    },
  }