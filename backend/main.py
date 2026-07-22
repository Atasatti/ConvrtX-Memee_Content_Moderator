import uvicorn
from app import app
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        # workers=4,
        reload=True,  # Enable auto-reload during development
    )