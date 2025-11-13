def predict_outage_eta(area, weather, load):
    """Estimate outage restoration ETA using simple rules."""
    eta = 2
    if "rain" in weather.lower():
        eta += 2
    elif "storm" in weather.lower():
        eta += 4
    if "high" in load.lower():
        eta += 1

    return {
        "eta_hours": eta,
        "message": f"Estimated restoration time for {area}: {eta} hours"
    }
