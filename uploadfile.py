from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
from flask import Flask, request, jsonify, redirect, session
from flask_cors import CORS
import os
import io
import json

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
app.secret_key = os.urandom(24)  # Required for session management

# Configure Google OAuth2
CLIENT_SECRETS_FILE = "client_secrets.json"
SCOPES = ['https://www.googleapis.com/auth/drive.file']

@app.route('/oauth2callback')
def oauth2callback():
    """Handle the OAuth 2.0 callback from Google."""
    flow = Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE,
        scopes=SCOPES,
        state=session['state']
    )
    flow.redirect_uri = 'http://localhost:8080'

    # Get the authorization code from the callback
    authorization_response = request.url
    flow.fetch_token(authorization_response=authorization_response)

    # Store credentials
    credentials = flow.credentials
    with open('token.json', 'w') as token:
        token.write(credentials.to_json())

    return 'Authorization successful! You can close this window.'

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
            return jsonify({'error': 'File too large'}), 400
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

        return jsonify({
            'url': view_url,
            'name': file.filename,
            'type': file.content_type
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

def get_credentials():
    """Gets valid credentials from storage or initiates OAuth2 flow."""
    if os.path.exists('token.json'):
        try:
            return Credentials.from_authorized_user_file('token.json', SCOPES)
        except Exception:
            # If token is invalid, remove it and re-authenticate
            os.remove('token.json')
    
    flow = Flow.from_client_secrets_file(CLIENT_SECRETS_FILE, SCOPES)
    flow.redirect_uri = 'http://localhost:8080'
    
    # Store the state in the session for later validation
    authorization_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true'
    )
    session['state'] = state
    
    # Redirect user to authorization URL
    return redirect(authorization_url)

if __name__ == '__main__':
    os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'  # For development only
    app.run(port=8080, debug=True)  # Changed port to 8080 to match OAuth config
