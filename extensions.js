// Import dotenv
import 'dotenv/config';

// Debug AWS object
console.log('AWS Object:', AWS);
console.log('AWS.CognitoIdentityCredentials:', AWS.CognitoIdentityCredentials);

// Initialize AWS SDK
AWS.config.update({
    region: process.env.AWS_REGION || "eu-north-1"
});

// Configure AWS with Cognito
const s3 = new AWS.S3({
    credentials: new AWS.CognitoIdentityCredentials({
        IdentityPoolId: process.env.AWS_COGNITO_IDENTITY_POOL_ID || "eu-north-1:6b7fe3b6-ecfb-49bd-abfd-b3ec9ca872e3"
    })
});

// Debug credentials
console.log('S3 Client:', s3);
console.log('Credentials:', s3.config.credentials);

// Ensure credentials are loaded
s3.config.credentials.get(function(err) {
    if (err) {
        console.error('Error loading credentials:', err);
    } else {
        console.log('Credentials loaded successfully');
    }
});

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
          // Create a unique filename
          const fileName = `${Date.now()}-${file.name}`;
          
          // Upload directly to S3 using Cognito credentials
          const params = {
            Bucket: process.env.AWS_S3_BUCKET || "dozi-incidentreport-test",
            Key: fileName,
            Body: file,
            ContentType: file.type,
            ACL: 'public-read'
          };

          console.log('Uploading with params:', params);
          await s3.upload(params).promise();
          
          // Construct the public URL
          const fileUrl = `https://${process.env.AWS_S3_BUCKET || "dozi-incidentreport-test"}.s3.${process.env.AWS_REGION || "eu-north-1"}.amazonaws.com/${fileName}`;
          
          // Display the uploaded file
          if (file.type.startsWith('image/')) {
            fileUploadContainer.innerHTML = `<img src="${fileUrl}" alt="Uploaded image" style="max-width: 100%; max-height: 300px;">`;
          } else {
            fileUploadContainer.innerHTML = `<div class="my-file-upload">File uploaded successfully! <a href="${fileUrl}" target="_blank">View file</a></div>`;
          }
        } catch (error) {
          console.error('Error during upload:', error);
          fileUploadContainer.innerHTML = `<div class="my-file-upload">Upload failed. Please try again.</div>`;
        }
      })
  
      element.appendChild(fileUploadContainer)
    }
}  