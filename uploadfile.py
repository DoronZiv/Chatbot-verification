from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload, MediaIoBaseUpload
from flask import Flask, request, jsonify, redirect, session, make_response
from googleapiclient.http import MediaFileUpload, MediaIoBaseUpload
from flask import Flask, request, jsonify, redirect, session, make_response
from flask_cors import CORS
import os
import io
import json

app = Flask(__name__)
CORS(app,
    supports_credentials=True,  # Enable credentials mode
    resources={r"/*": {"origins": ["https://doronziv.github.io", "http://localhost:3000"]}})  # Allow multiple origins
app.secret_key = os.urandom(24)  # Required for session management

# Configure Google OAuth2
CLIENT_SECRETS_FILE = "client_secrets.json"
SCOPES = ['https://www.googleapis.com/auth/drive.file']

def get_credentials():
    """Gets valid credentials from storage or initiates OAuth2 flow."""
    if os.path.exists('credentials.json'):
        try:
            return Credentials.from_authorized_user_file('credentials.json', SCOPES)
        except Exception as e:
            print(f"Invalid credentials.json: {e}")
            os.remove('credentials.json')  # Remove invalid token and reauthenticate

    # Initialize OAuth flow using InstalledAppFlow
    flow = InstalledAppFlow.from_client_secrets_file(CLIENT_SECRETS_FILE, SCOPES)
    creds = flow.run_local_server(port=8080)
    
    # Save credentials for future use
    with open('token.json', 'w') as token:
        token.write(creds.to_json())
    
    return creds
        token.write(creds.to_json())
    
    return creds

@app.route('/upload', methods=['POST'])
def upload_file():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']
        
        # Validate file type
        allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if file.content_type not in allowed_types:
            return jsonify({'error': 'Invalid file type'}), 400

        # Validate file size (5MB limit)
        if len(file.read()) > 5 * 1024 * 1024:  # 5MB in bytes
            return jsonify({'error': 'File too large, 5MB limit'}), 400
            return jsonify({'error': 'File too large, 5MB limit'}), 400
        file.seek(0)  # Reset file pointer after reading

        # Initialize Google Drive service
        creds = get_credentials()
        service = build('drive', 'v3', credentials=creds)

        # Prepare the file metadata
        file_metadata = {
            'name': file.filename,
            'mimeType': file.content_type
        }

        # Create file stream
        file_stream = io.BytesIO(file.read())
        media = MediaIoBaseUpload(
            file_stream,
            mimetype=file.content_type,
            resumable=True
        )

        # Upload file to Google Drive
        file = service.files().create(
            body=file_metadata,
            media_body=media,
            fields='id'
        ).execute()

        # Set file permissions to be publicly accessible
        permission = {
            'type': 'anyone',
            'role': 'reader'
        }
        service.permissions().create(
            fileId=file.get('id'),
            body=permission
        ).execute()

        # Generate direct view URL
        view_url = f"https://drive.google.com/uc?id={file.get('id')}"

        return create_success_response({
            'url': view_url,
            'name': file.filename,
            'type': file.content_type
        })

    except Exception as e:
        return create_error_response(str(e), 500)

def create_error_response(message, status_code):
    """Create an error response with proper CORS headers."""
    response = make_response(jsonify({'error': message}), status_code)
    response.headers.add("Access-Control-Allow-Origin", "https://doronziv.github.io")
    response.headers.add("Access-Control-Allow-Credentials", "true")
    return response

def create_success_response(data):
    """Create a success response with proper CORS headers."""
    response = make_response(jsonify(data), 200)
    response.headers.add("Access-Control-Allow-Origin", "https://doronziv.github.io")
    response.headers.add("Access-Control-Allow-Credentials", "true")
    return response

if __name__ == '__main__':
    os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'  # For development only
    app.run(port=8080, debug=True)  # Changed port to 8080 to match OAuth config
