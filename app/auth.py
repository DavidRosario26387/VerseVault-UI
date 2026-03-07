import bcrypt
from fastapi import HTTPException

def verify_password(password, password_hash):

    if not bcrypt.checkpw(
        password.encode(),
        password_hash.encode()
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
        )