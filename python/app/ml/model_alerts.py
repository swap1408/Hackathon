def get_personalized_alert(age, aqi, health_flag):
    if aqi < 50:
        msg = "Air quality is good. Enjoy your day!"
    elif 50 <= aqi < 100:
        msg = "Moderate air quality. Sensitive groups take precautions."
    else:
        msg = "Unhealthy air quality. Avoid outdoor activities."

    if health_flag.lower() in ["asthma", "elderly", "heart"]:
        msg += " Extra caution advised due to health condition."

    severity = "high" if aqi >= 100 else "moderate" if aqi >= 50 else "low"

    return {
        "alert_message": msg,
        "severity": severity
    }
