import io, json
from typing import List
import numpy as np
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import tensorflow as tf
from tensorflow import keras
from settings import CONFIG

app = FastAPI(title="AAT Dog Breed Classifier API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

model = None
CLASSES: List[str] = []

@app.on_event("startup")
def load_artifacts():
    global model, CLASSES
    with open(CONFIG.classes_path, "r", encoding="utf-8") as f:
        CLASSES = json.load(f)
    model = keras.models.load_model(CONFIG.model_path)

def preprocess(img: Image.Image) -> np.ndarray:
    img = img.convert("RGB").resize((CONFIG.img_size, CONFIG.img_size))
    arr = np.array(img, dtype=np.float32)      # NOTE: no /255.0 to match your notebook
    arr = np.expand_dims(arr, axis=0)          # add batch dimension
    return arr

@app.get("/health")
def health():
    return {"status": "ok", "classes": len(CLASSES), "img_size": CONFIG.img_size}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    contents = await file.read()
    img = Image.open(io.BytesIO(contents))
    batch = preprocess(img)
    probs = model.predict(batch, verbose=0)[0].astype(float)

    # Top-K
    top_indices = np.argsort(probs)[-CONFIG.top_k:][::-1]
    top = [{"label": CLASSES[i], "prob": float(probs[i])} for i in top_indices]
    return {"top": top, "all_count": len(CLASSES)}
