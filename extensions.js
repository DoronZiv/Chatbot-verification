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
      })
  
      element.appendChild(fileUploadContainer)
    },
  
    async fetch(file) {
      // File type restrictions
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('ניתן להעלות קבצים מסוג JPEG, PNG, GIF ו-WEBP בלבד');
      }
  
      // File size restriction (5MB = 5 * 1024 * 1024 bytes)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        throw new Error('גודל הקובץ חייב להיות פחות מ-5MB');
      }
  
      // Initialize Google Drive API
      await this.loadGoogleAPI();
      
      try {
        // Get auth instance
        const auth = gapi.auth2.getAuthInstance();
        if (!auth.isSignedIn.get()) {
          await auth.signIn();
        }
  
        // Create file metadata
        const metadata = {
          name: file.name,
          mimeType: file.type,
        };
  
        // Create multipart request for file upload
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', file);
  
        // Upload file to Google Drive
        const accessToken = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token;
        const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: form,
        });
  
        const result = await response.json();
  
        // Create sharable link
        await gapi.client.drive.permissions.create({
          fileId: result.id,
          requestBody: {
            role: 'reader',
            type: 'anyone',
          },
        });
  
        // Get direct viewing URL
        const viewUrl = `https://drive.google.com/uc?id=${result.id}`;
  
        // Return metadata including file information and view URL
        return {
          name: file.name,
          type: file.type,
          size: file.size,
          url: viewUrl,
        };
      } catch (error) {
        console.error('שגיאה בהעלאת הקובץ ל-Google Drive:', error);
        throw error;
      }
    },
  
    async loadGoogleAPI() {
      return new Promise((resolve, reject) => {
        gapi.load('client:auth2', async () => {
          try {
            // Generate random state string for security
            const state = Math.random().toString(36).substring(7);
            
            const authConfig = {
              clientId: process.env.GOOGLE_CLIENT_ID,
              scope: 'https://www.googleapis.com/auth/drive.file',
              redirect_uri: process.env.REDIRECT_URI,
              response_type: 'code',
              state: state,
              auth_uri: 'https://auth-server.com/authorize'
            };

            // Handle authorization callback
            if (window.location.pathname === '/callback') {
              const urlParams = new URLSearchParams(window.location.search);
              const code = urlParams.get('code');
              const returnedState = urlParams.get('state');

              // Verify state to prevent CSRF attacks
              if (returnedState !== state) {
                throw new Error('Invalid state parameter');
              }

              // Handle the authorization code
              if (code) {
                // Store the authorization code or exchange it for tokens
                await this.handleAuthorizationCode(code);
              }
            }

            await gapi.client.init(authConfig);
            resolve();
          } catch (error) {
            reject(error);
          }
        });
      });
    },
  
    async handleAuthorizationCode(code) {
      // Handle the authorization code
      // This is where you would typically exchange the code for access tokens
      try {
        const response = await fetch('/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            redirect_uri: process.env.REDIRECT_URI,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to exchange authorization code');
        }

        const tokens = await response.json();
        // Store tokens securely or handle as needed
        return tokens;
      } catch (error) {
        console.error('Error exchanging authorization code:', error);
        throw error;
      }
    }
  }