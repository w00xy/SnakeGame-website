from sqlalchemy import create_engine, Column, Integer, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy import func
from datetime import datetime

Base = declarative_base()


class BaseModel(Base):
    __abstract__ = (
        True  # Указывает, что этот класс не будет использоваться для создания таблиц
    )

    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())


# Модель пользователя
class User(BaseModel):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(100), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=True, default=None)
    hashed_pwd = Column(String, nullable=False)
