from typing import Any

from fastapi import FastAPI, Security
from schemas import User
from verify import get_current_user, verify_access_token

app = FastAPI()


@app.get("/")
def get_hello():
    return {"message": "Hello, world!"}


@app.get("/verify")
def verify(payload: Any = Security(verify_access_token)):
    return payload


@app.get("/users")
def get_users(user: User = Security(get_current_user)):
    return user
