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
    # NOTE: reload only watches *.py. The OpenAI clients are constructed at
    # import time from settings, so after editing .env you must stop and restart
    # this process — the running server keeps the key it started with.
    # (`reload_includes=[".env"]` does not help: watchfiles skips dotfiles.)