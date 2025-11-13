from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.ml.model_alerts import get_personalized_alert
from app.core.cache import cache_result
import logging, uuid, time

router = APIRouter()
logger = logging.getLogger("alerts")
logging.basicConfig(level=logging.INFO)

class AlertRequest(BaseModel):
    age: int
    aqi: float
    health_flag: str

@router.post("/predict")
@cache_result(ttl=180)
def predict_alert(req: AlertRequest):
    try:
        start_time = time.time()
        result = get_personalized_alert(req.age, req.aqi, req.health_flag)
        latency = round(time.time() - start_time, 3)
        logger.info(f"Alert generated | latency={latency}s")

        return {
            "prediction_id": f"alert-{uuid.uuid4().hex[:8]}",
            **result,
            "meta": {"model": "alert-v1", "latency": latency}
        }
    except Exception as e:
        logger.error(f"Error generating alert: {e}")
        raise HTTPException(status_code=500, detail="Internal model error")
