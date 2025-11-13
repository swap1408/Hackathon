from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.ml.model_outage import predict_outage_eta
from app.core.cache import cache_result
import logging, uuid, time

router = APIRouter()
logger = logging.getLogger("outage")
logging.basicConfig(level=logging.INFO)

class OutageRequest(BaseModel):
    area: str
    weather: str
    load: str

@router.post("/predict")
@cache_result(ttl=300)
def get_outage_eta(req: OutageRequest):
    """
    Predict expected outage restoration time (ETA) based on area, weather, and grid load.
    """
    try:
        start = time.time()
        result = predict_outage_eta(req.area, req.weather, req.load)
        latency = round(time.time() - start, 3)

        logger.info(f"Outage ETA predicted for area={req.area}, weather={req.weather}, latency={latency}s")

        return {
            "prediction_id": f"outage-{uuid.uuid4().hex[:8]}",
            "area": req.area,
            **result,
            "meta": {"model": "outage-v1", "latency": latency}
        }

    except Exception as e:
        logger.error(f"Error predicting outage ETA: {e}")
        raise HTTPException(status_code=500, detail="Outage ETA prediction failed")
