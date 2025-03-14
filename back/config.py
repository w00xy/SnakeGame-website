import os
from dotenv import load_dotenv, find_dotenv

# Загружаем переменные окружения из .env файла
load_dotenv()

# Настройки базы данных
DB_URL = os.getenv("DB_URL")

# Настройки JWT
JWT_SECRET_KEY = os.getenv(
    "JWT_SECRET_KEY",
)
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM")
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES"))

# Настройки CORS
CORS_ALLOW_ORIGINS = os.getenv("CORS_ALLOW_ORIGINS").split(",")
CORS_ALLOW_CREDENTIALS = os.getenv("CORS_ALLOW_CREDENTIALS").lower() in (
    "true",
    "1",
    "t",
)
CORS_ALLOW_METHODS = os.getenv("CORS_ALLOW_METHODS").split(",")
CORS_ALLOW_HEADERS = os.getenv("CORS_ALLOW_HEADERS").split(",")

print(CORS_ALLOW_ORIGINS)
print(JWT_SECRET_KEY)
print(os.getenv("CORS_ALLOW_ORIGINS"))
