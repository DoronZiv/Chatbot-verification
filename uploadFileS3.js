// Import AWS SDK v3
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configure AWS
const s3Client = new S3Client({
    region: process.env.S3_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

/**
 * Uploads a file to S3
 * @param {string} filePath - Path to the file to upload
 * @param {string} bucketName - S3 bucket name
 * @param {string} [contentType='application/octet-stream'] - Content type of the file
 * @returns {Promise<string>} - URL of the uploaded file
 */
async function uploadFileToS3(filePath, bucketName, contentType = 'application/octet-stream') {
    try {
        // Get the filename from the path
        const fileName = path.basename(filePath);
        console.log('Uploading file:', fileName);
        console.log('Content type:', contentType);

        // Read the file
        const fileStream = fs.createReadStream(filePath);

        // Upload parameters
        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: fileName,
            Body: fileStream,
            ContentType: contentType,
            ACL: 'public-read'
        });

        // Upload to S3
        await s3Client.send(command);
        
        // Construct the URL
        const fileUrl = `https://${bucketName}.s3.${process.env.S3_REGION || 'us-east-1'}.amazonaws.com/${fileName}`;
        
        console.log('File uploaded successfully!');
        console.log('File URL:', fileUrl);
        return fileUrl;
    } catch (error) {
        console.error('An error occurred while uploading to S3:');
        console.error(error);
        return null;
    }
}

/**
 * Main function to handle file upload
 */
async function main() {
    const filePath = 'C:/Code/UploadFile/file.txt';
    const bucketName = process.env.S3_BUCKET_NAME;

    if (!bucketName) {
        console.error('S3_BUCKET_NAME environment variable is not set');
        return;
    }

    try {
        const fileUrl = await uploadFileToS3(filePath, bucketName);
        if (fileUrl) {
            console.log('File uploaded successfully!');
            console.log('File URL:', fileUrl);
        } else {
            console.log('File upload failed!');
        }
    } catch (error) {
        console.error('Error in main function:', error);
    }
}

// Run the main function if this file is executed directly
if (require.main === module) {
    main();
}

// Export the upload function for use in other modules
module.exports = {
    uploadFileToS3
}; 