from fastapi import FastAPI

app = FastAPI(title="SprintWheel API")

@app.get("/health")
def health():
    return {"status": "ok"}