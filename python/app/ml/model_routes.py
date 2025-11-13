def recommend_route(location, time_of_day):
    """Simple rule-based route recommender."""
    location = location.lower()
    if "hyderabad" in location:
        if "morning" in time_of_day.lower():
            route = "Use Necklace Road — light traffic in the morning."
        elif "evening" in time_of_day.lower():
            route = "Avoid Begumpet — heavy traffic after 6 PM."
        else:
            route = "Take Inner Ring Road — average congestion."
    else:
        route = "No traffic data for this area. Use default main road."

    return {"recommended_route": route, "eta": "25 mins"}
