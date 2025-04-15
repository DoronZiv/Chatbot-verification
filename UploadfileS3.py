import os
from flask import Flask, request, jsonify, redirect, flash
import boto3
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
from flask_cors import CORS
from werkzeug.datastructures import FileStorage

# Load the environment variables from the .env file
load_dotenv()
print("AWS_ACCESS_KEY_ID:", os.environ.get("AWS_ACCESS_KEY_ID"))
print("S3_BUCKET_NAME:", os.environ.get("S3_BUCKET_NAME"))

# Now your environment variables are accessible via os.environ.get()
AWS_ACCESS_KEY_ID = os.environ.get("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY")
S3_BUCKET_NAME = os.environ.get("S3_BUCKET_NAME")
S3_REGION = os.environ.get("S3_REGION", "us-east-1")

app = Flask(__name__)
# Enable CORS and allow credentials
CORS(app, supports_credentials=True)
app.secret_key = "your_secret_key"  # Replace with a random secret for production

# Initialize the boto3 S3 client
s3_client = boto3.client(
    "s3",
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=S3_REGION
)

def upload_file_to_s3(file, bucket_name, filename, content_type):
    """
    Uploads a file object to S3 using boto3.
    Returns the public URL of the uploaded file.
    """
    try:
        # Upload the file to S3
        s3_client.upload_fileobj(
            file,
            bucket_name,
            filename,
            ExtraArgs={
                "ContentType": content_type,
                "ACL": "public-read"
            }
        )
        
        # Construct the public URL
        file_url = f"https://{bucket_name}.s3.{S3_REGION}.amazonaws.com/{filename}"
        return file_url
    except Exception as e:
        print(f"Error uploading file to S3: {str(e)}")
        return None

@app.route("/upload", methods=["POST"])
def upload_file():
    try:
        # Check if file is present in the request
        if 'file' not in request.files:
            return jsonify({"error": "No file part"}), 400
            
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400
            
        # Get additional parameters
        filename = request.form.get('fileName', secure_filename(file.filename))
        content_type = request.form.get('contentType', 'application/octet-stream')
        
        # Upload the file to S3
        file_url = upload_file_to_s3(file, S3_BUCKET_NAME, filename, content_type)
        
        if file_url:
            return jsonify({"url": file_url})
        else:
            return jsonify({"error": "Failed to upload file"}), 500
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)


   