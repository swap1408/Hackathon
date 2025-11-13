import redis, json, hashlib, inspect, logging
from functools import wraps
from app.core.config import REDIS_HOST, REDIS_PORT
from pydantic import BaseModel  #  add this import

logger = logging.getLogger("cache")
logging.basicConfig(level=logging.INFO)

# Initialize Redis
try:
    r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)
    r.ping()
    logger.info("Redis connected successfully.")
except redis.ConnectionError:
    r = None
    logger.warning("Redis not running — caching disabled.")

def _serialize_kwargs(kwargs: dict):
    """Convert kwargs to JSON-safe dict for caching."""
    safe_kwargs = {}
    for k, v in kwargs.items():
        if isinstance(v, BaseModel):  #  handles Pydantic objects
            safe_kwargs[k] = v.dict()
        else:
            safe_kwargs[k] = v
    return safe_kwargs

def make_cache_key(func_name, kwargs):
    """Generate unique key for Redis."""
    safe_kwargs = _serialize_kwargs(kwargs)
    raw_key = f"{func_name}:{json.dumps(safe_kwargs, sort_keys=True)}"
    return hashlib.md5(raw_key.encode()).hexdigest()

def cache_result(ttl=300):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            if not r:
                return func(*args, **kwargs)
            try:
                key = make_cache_key(func.__name__, kwargs)
                if cached := r.get(key):
                    return json.loads(cached)
                result = func(*args, **kwargs)
                r.setex(key, ttl, json.dumps(result))
                return result
            except Exception as e:
                logger.error(f"Cache error: {e}")
                return func(*args, **kwargs)
        return wrapper
    return decorator
