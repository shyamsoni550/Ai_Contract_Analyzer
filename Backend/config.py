from dotenv import load_dotenv
import os
load_dotenv()
MONGODB_URI = os.getenv("MONGODB_URI")
ALLOWD_EXTENSIONS=[".txt",".pdf"]
MAX_FILE_SIZE_MB=10
UPLOAD_DIR="uploads"

GEMINI_API_KEY=os.getenv("GEMINI_API_KEY")
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]
