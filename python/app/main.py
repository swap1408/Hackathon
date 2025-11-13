import logging
logging.basicConfig(level=logging.DEBUG)
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import generate_latest, Counter
from app.api import routes_alerts, routes_routes, routes_image, routes_outage
from app.core.cache import r

app = FastAPI(
    title="CityAssist Python Service",
    description="FastAPI-based backend service for ML model serving, routing, and personalization.",
    version="2.0.0"
)

# CORS (dev-friendly defaults; tighten for production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Routers
app.include_router(routes_alerts.router, prefix="/api/alerts", tags=["Personalized Alerts"])
app.include_router(routes_routes.router, prefix="/api/routes", tags=["Route Recommender"])
app.include_router(routes_image.router, prefix="/api/image", tags=["Image Classifier"])
app.include_router(routes_outage.router, prefix="/api/outage", tags=["Outage Predictor"])


# Metrics Counter
REQUEST_COUNT = Counter("request_count", "Total API requests", ["endpoint"])

@app.get("/")
def root():
    REQUEST_COUNT.labels(endpoint="/").inc()
    return {"message": "CityAssist Python API is running successfully!"}

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.get("/ready")
def ready():
    status = "connected" if r else "not_connected"
    return {"status": status}

@app.get("/metrics")
def metrics():
    return generate_latest().decode("utf-8")
