from fastapi import APIRouter, File, UploadFile, HTTPException
from app.ml.model_image import classify_image
from app.core.cache import cache_result
import logging, uuid, time

router = APIRouter()
logger = logging.getLogger("image")
logging.basicConfig(level=logging.INFO)

@router.post("/predict")
async def classify_issue(image: UploadFile = File(...)):
    try:
        start = time.time()
        content = await image.read()
        result = classify_image(content)
        latency = round(time.time() - start, 3)
        logger.info(f"Image processed: {image.filename}, latency={latency}s")

        return {
            "prediction_id": f"img-{uuid.uuid4().hex[:8]}",
            "filename": image.filename,
            **result,
            "meta": {"model": "image-v1", "latency": latency}
        }
    except Exception as e:
        logger.error(f"Error processing image: {e}")
        raise HTTPException(status_code=500, detail="Image classification failed")
