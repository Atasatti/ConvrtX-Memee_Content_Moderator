import io
from fastapi import APIRouter, HTTPException, Form
from ..services import analyze_text, check_number

text_router = APIRouter(prefix="/text", tags=["Text"])

@text_router.post("/analyze", response_model=None)
async def analyze_text_content(text: str= Form(...)):
    try:
        result = await analyze_text(text)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")

@text_router.post("/check_number", response_model=None)
async def check_number_route(text: str = Form(...)):
    try:
        result = await check_number(text)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
