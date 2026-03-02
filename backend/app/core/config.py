import os
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

JWT_SECRET = os.getenv("JWT_SECRET", "dev-only-change-me")
JWT_ALG = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID")