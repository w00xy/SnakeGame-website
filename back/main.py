from fastapi import FastAPI, Depends, HTTPException, status, Response, Cookie
from fastapi.concurrency import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from fastapi.openapi.utils import get_openapi
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.responses import JSONResponse

import uvicorn

from database.engine import init_db, session_maker, get_db
from database.models import User
import config

# Security
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Используем секретный ключ из конфигурации
SECRET_KEY = config.JWT_SECRET_KEY
ALGORITHM = config.JWT_ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = config.JWT_ACCESS_TOKEN_EXPIRE_MINUTES

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Создаем lifespan для инициализации базы данных
@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


# Создаем экземпляр FastAPI
app = FastAPI(
    title="Snake Game API",
    description="API для игры Snake",
    version="1.0.0",
    # Отключаем автоматическую генерацию OpenAPI схемы
    openapi_url=None,
    lifespan=lifespan,
)


# Определяем кастомную функцию для генерации OpenAPI схемы
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title="Snake Game API",
        description="API для игры Snake",
        version="1.0.0",
        routes=app.routes,
    )

    # Явно указываем версию OpenAPI
    openapi_schema["openapi"] = "3.0.2"

    app.openapi_schema = openapi_schema
    return app.openapi_schema


# Устанавливаем кастомную схему OpenAPI
app.openapi = custom_openapi

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ALLOW_ORIGINS,
    allow_credentials=config.CORS_ALLOW_CREDENTIALS,
    allow_methods=config.CORS_ALLOW_METHODS,
    allow_headers=config.CORS_ALLOW_HEADERS,
)

print("Allowed origins:", config.CORS_ALLOW_ORIGINS)

# Хранение refresh токенов
refresh_tokens_db = {}


# Token creation
def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


class UserLoginSchema(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    password: str


# Login endpoint
@app.post("/api/token")
async def login(
    response: Response, form_data: UserLoginSchema, db: AsyncSession = Depends(get_db)
):
    user = None

    if form_data.email:
        # Получаем результат запроса
        result = await db.execute(select(User).where(User.email == form_data.email))
        # Получаем первую запись из результата
        user = result.scalar_one_or_none()
        print("get user from db by email")
        print(user)

    if not user and form_data.username:
        # Если пользователь не найден по email, ищем по username
        result = await db.execute(
            select(User).where(User.username == form_data.username)
        )
        user = result.scalar_one_or_none()
        print("get user from db by username")
        print(user)

    if not user or not pwd_context.verify(form_data.password, user.hashed_pwd):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "email": user.email, "id": user.id},
        expires_delta=access_token_expires,
    )

    # Создание refresh токена
    refresh_token = jwt.encode(
        {
            "sub": user.username,
            "email": user.email,
            "id": user.id,
            "exp": datetime.utcnow() + timedelta(days=7),
        },
        SECRET_KEY,
        algorithm=ALGORITHM,
    )

    # Сохраняем refresh токен
    refresh_tokens_db[refresh_token] = user.username

    response.set_cookie(key="access_token", value=access_token, httponly=True)
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


# Обновление токена
@app.post("/api/token/refresh")
async def refresh_token(refresh_token: str):
    if refresh_token not in refresh_tokens_db:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    username = refresh_tokens_db[refresh_token]
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    new_access_token = create_access_token(
        data={"sub": username}, expires_delta=access_token_expires
    )

    return {"access_token": new_access_token, "token_type": "bearer"}


class UserCreate(BaseModel):
    username: str
    email: str
    password: str


class UserUpdate(BaseModel):
    email: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str

    class Config:
        orm_mode = True  # This allows Pydantic to read data from SQLAlchemy models


class TokensResponce(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str


@app.post("/api/users/", response_model=TokensResponce)
async def create_user(user: UserCreate, db: AsyncSession = Depends(get_db)):
    # Check if the username already exists
    existing_user = await db.execute(select(User).where(User.username == user.username))
    if existing_user.scalars().first():
        raise HTTPException(status_code=400, detail="Username already registered")

    # Check if the email already exists
    existing_email = await db.execute(select(User).where(User.email == user.email))
    if existing_email.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hash the password
    hashed_password = pwd_context.hash(user.password)

    # Create a new user instance
    new_user = User(
        username=user.username, email=user.email, hashed_pwd=hashed_password
    )

    # Add the new user to the session and commit
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": new_user.username, "email": new_user.email, "id": new_user.id},
        expires_delta=access_token_expires,
    )

    # Создание refresh токена
    refresh_token = jwt.encode(
        {
            "sub": new_user.username,
            "email": new_user.email,
            "id": new_user.id,
            "exp": datetime.utcnow() + timedelta(days=7),
        },
        SECRET_KEY,
        algorithm=ALGORITHM,
    )
    refresh_tokens_db[refresh_token] = user.username  # Сохраняем refresh токен

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


@app.get("/api/users/{user_id}", response_model=UserResponse)
async def read_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    token: str = Depends(oauth2_scheme),
):
    # Извлечение информации о пользователе из токена
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    current_user_id = payload.get(
        "id"
    )  # Предполагается, что "sub" содержит идентификатор пользователя

    # Проверка, соответствует ли запрашиваемый user_id текущему пользователю
    if str(user_id) != str(current_user_id):
        raise HTTPException(
            status_code=403, detail="Not authorized to access this user"
        )

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()

    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    return {"id": user.id, "username": user.username, "email": user.email}


@app.put("/api/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int, user_update: UserUpdate, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    user.email = user_update.email
    await db.commit()
    await db.refresh(user)
    return user


@app.get("/api/check-username")
async def check_username(username: str, db: AsyncSession = Depends(get_db)):
    existing_user = await db.execute(select(User).where(User.username == username))
    user = existing_user.scalars().first()
    return {
        "available": user is None
    }  # Возвращаем true, если имя пользователя доступно


@app.get("/api/check-email")
async def check_email(email: str, db: AsyncSession = Depends(get_db)):
    existing_email = await db.execute(select(User).where(User.email == email))
    user = existing_email.scalars().first()
    return {
        "available": user is None
    }  # Возвращаем true, если email доступен


# Добавляем эндпоинт для OpenAPI схемы
@app.get("/api/openapi.json", include_in_schema=False)
async def get_openapi_schema():
    return JSONResponse(content=app.openapi())


@app.get("/api/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    return get_swagger_ui_html(
        openapi_url="/api/openapi.json",
        title=app.title + " - Swagger UI",
        oauth2_redirect_url=None,
        swagger_js_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js",
        swagger_css_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css",
    )


@app.get("/api/test")
async def test():
    return {"message": "Test route is working!"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
