from fastapi import APIRouter, HTTPException
from app.ml.model_routes import recommend_route
from app.core.cache import cache_result
import logging, time, uuid

router = APIRouter()
logger = logging.getLogger("routes")
logging.basicConfig(level=logging.INFO)

@router.get("/predict")
@cache_result(ttl=300)
def get_route(location: str, time_of_day: str):
    try:
        start = time.time()
        result = recommend_route(location, time_of_day)
        latency = round(time.time() - start, 3)
        return {
            "prediction_id": f"route-{uuid.uuid4().hex[:8]}",
            **result,
            "meta": {"model": "route-v1", "latency": latency}
        }
    except Exception as e:
        logger.error(f"Route error: {e}")
        raise HTTPException(status_code=500, detail="Route recommendation failed")
