from fastapi import APIRouter, HTTPException
from fastapi.responses import Response, StreamingResponse
from app.db import get_conn
import io

router = APIRouter()

@router.get("/images")
def get_images(page: int = 1):

    if page < 1:
        raise HTTPException(status_code=400, detail="Page must be 1 or greater")

    limit = 6
    offset = (page - 1) * limit

    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        SELECT dv.id, imgs.num, dv.day, dv.reference
        FROM daily_verses dv
        CROSS JOIN LATERAL (
            VALUES (1, dv.img1), (2, dv.img2)
        ) AS imgs(num, img_data)
        WHERE imgs.img_data IS NOT NULL
        ORDER BY dv.day DESC, dv.id DESC, imgs.num ASC
        LIMIT %s OFFSET %s
    """, (limit, offset))

    rows = cur.fetchall()

    return [
        {
            "id": r[0],
            "num": r[1],
            "day": str(r[2]) if r[2] else None,
            "reference": str(r[3]) if r[3] else None
        }
        for r in rows
    ]


@router.get("/image/{id}/{num}")
def get_image(id: int, num: int):

    if num not in (1, 2):
        raise HTTPException(status_code=400, detail="Image number must be 1 or 2")

    column = "img1" if num == 1 else "img2"

    conn = get_conn()
    cur = conn.cursor()

    cur.execute(
        f"SELECT {column} FROM daily_verses WHERE id=%s",
        (id,)
    )

    row = cur.fetchone()
    if not row or row[0] is None:
        raise HTTPException(status_code=404, detail="Image not found")

    img = row[0]

    return Response(
        content=img,
        media_type="image/png"
    )


@router.delete("/image/{id}")
def delete_image(id: int):

    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute("DELETE FROM daily_verses WHERE id=%s", (id,))
        if cur.rowcount == 0:
            conn.rollback()
            raise HTTPException(status_code=404, detail="Record not found")
        conn.commit()
    finally:
        conn.close()

    return {"deleted": True}


@router.get("/download/{id}/{num}")
def download(id: int, num: int):

    if num not in (1, 2):
        raise HTTPException(status_code=400, detail="Image number must be 1 or 2")

    column = "img1" if num == 1 else "img2"

    conn = get_conn()
    cur = conn.cursor()

    cur.execute(
        f"SELECT {column} FROM daily_verses WHERE id=%s",
        (id,)
    )

    row = cur.fetchone()
    if not row or row[0] is None:
        raise HTTPException(status_code=404, detail="Image not found")

    img = row[0]

    return StreamingResponse(
        io.BytesIO(img),
        media_type="image/png",
        headers={
            "Content-Disposition":
            f"attachment; filename=verse_{id}_{num}.png"
        }
    )
