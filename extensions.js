// Import AWS SDK v3 modules
import { S3Client } from "@aws-sdk/client-s3";
import { CognitoIdentityClient } from "@aws-sdk/client-cognito-identity";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-provider-cognito-identity";

// Configure AWS with Cognito
const s3Client = new S3Client({
    region: "eu-north-1",
    credentials: fromCognitoIdentityPool({
        client: new CognitoIdentityClient({ region: "eu-north-1" }),
        identityPoolId: "eu-north-1:YOUR_IDENTITY_POOL_ID" // Replace with your actual identity pool ID
    })
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
          const command = new PutObjectCommand({
            Bucket: "dozi-incidentreport-test", // Your S3 bucket name
            Key: fileName,
            Body: file,
            ContentType: file.type,
            ACL: 'public-read'
          });

          await s3Client.send(command);
          
          // Construct the public URL
          const fileUrl = `https://dozi-incidentreport-test.s3.eu-north-1.amazonaws.com/${fileName}`;
          
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