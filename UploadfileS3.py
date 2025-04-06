import os
from flask import Flask, request, jsonify, redirect, flash
import boto3
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
from flask_cors import CORS

# Load the environment variables from the .env file
load_dotenv()

# Now your environment variables are accessible via os.environ.get()
AWS_ACCESS_KEY_ID = os.environ.get("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY")
S3_BUCKET_NAME = os.environ.get("S3_BUCKET_NAME")
S3_REGION = os.environ.get("S3_REGION", "us-east-1")


app = Flask(__name__)
CORS(app)  # Enable CORS so requests from your chatbot are accepted
app.secret_key = "your_secret_key"  # Replace with a random secret for production

# Initialize the boto3 S3 client with your access keys
s3_client = boto3.client(
    "s3",
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=S3_REGION
)

def upload_file_to_s3(file, bucket_name, acl="public-read"):
    """
    Uploads a file object to S3 using boto3.
    Returns the public URL of the uploaded file.
    """
    # Secure the filename to prevent directory traversal attacks
    filename = secure_filename(file.filename)
    
    try:
        # Use upload_fileobj to stream the file to S3
        s3_client.upload_fileobj(
            file,
            bucket_name,
            filename,
            ExtraArgs={
                "ACL": acl,
                "ContentType": file.content_type
            }
        )
    except Exception as e:
        print("An error occurred while uploading to S3:", e)
        return None

    # Construct the public URL (adjust if your bucket policy is different)
    return f"https://{bucket_name}.s3.{S3_REGION}.amazonaws.com/{filename}"

@app.route("/upload", methods=["POST"])
def upload_file():
    # Check for the file in the request
    if "file" not in request.files:
        flash("No file part in the request.")
        return jsonify({"error": "No file part in the request"}), 400
    
    file = request.files["file"]
    
    # If no file is selected
    if file.filename == "":
        flash("No file selected.")
        return jsonify({"error": "No file selected"}), 400

    # If a file is selected, attempt the upload to S3
    file_url = upload_file_to_s3(file, S3_BUCKET_NAME)
    if file_url:
        flash("File uploaded successfully!")
        return jsonify({"url": file_url})
    else:
        flash("File upload failed!")
        return jsonify({"error": "File upload failed"}), 500

if __name__ == "__main__":
    app.run(debug=True, port=8080)
