from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from io import BytesIO
import numpy as np
from analyze import analyze_visual_traits, is_human_handwriting

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for dev; restrict in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.post("/analyze/")
async def analyze_image(file: UploadFile = File(...)):
    img_bytes = await file.read()
    img = Image.open(BytesIO(img_bytes)).convert("L")
    img_np = np.array(img)

    if is_human_handwriting(img_np):
        return {
        "traits": [],
        "error": "❌ This image does not appear to be handwritten. Please upload a pen-written handwriting or signature on paper."
    }

    traits = analyze_visual_traits(img_np)
    return {"traits": traits}