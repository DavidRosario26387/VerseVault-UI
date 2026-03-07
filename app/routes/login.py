from fastapi import APIRouter, Form
from fastapi.responses import RedirectResponse
from app.db import get_conn
from app.auth import verify_password

router = APIRouter()

@router.post("/login")
def login(username: str = Form(...), password: str = Form(...)):

    conn = get_conn()
    cur = conn.cursor()

    cur.execute(
        "SELECT password_hash FROM users WHERE username=%s",
        (username,)
    )

    row = cur.fetchone()

    if not row:
        return {"error": "Invalid credentials"}

    verify_password(password, row[0])

    response = RedirectResponse(
        url="/gallery",
        status_code=303
    )

    response.set_cookie("user", username)

    return response