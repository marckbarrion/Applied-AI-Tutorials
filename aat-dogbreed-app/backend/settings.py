# backend/settings.py
from pydantic import BaseModel
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

class AppConfig(BaseModel):
    # Use absolute paths based on the settings.py directory
    model_path: str = str(BASE_DIR / "best_model_fine_tuned.keras")
    classes_path: str = str(BASE_DIR / "classes.json")
    img_size: int = 300
    top_k: int = 5

    # Silence the Pydantic "model_" protected namespace warning
    model_config = {
        "protected_namespaces": (),
    }

CONFIG = AppConfig()
