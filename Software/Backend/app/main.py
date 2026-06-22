# pyrefly: ignore [missing-import]
from fastapi import FastAPI

app = FastAPI(
    title = "Shared Reasoning API",
    version = "0.1.0"
)

@app.get("/")
def root():
    return {
        "status" : "ok",
        "message" : "backend running"
    }