from pydantic import BaseModel, EmailStr


class User(BaseModel):
    sub: str
    email_verified: bool
    email: EmailStr
    username: str
