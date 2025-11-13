import random

def classify_image(image_bytes):
    """Mock image classifier (rule-based or random) — for demo only."""
    labels = ["pothole", "garbage", "tree fall", "water leak"]
    chosen = random.choice(labels)
    confidence = round(random.uniform(0.7, 0.98), 2)
    return {
        "label": chosen,
        "confidence": confidence,
        "priority": "high" if confidence > 0.85 else "medium"
    }
