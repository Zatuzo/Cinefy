# modules/tmdb.py
import requests
import pandas as pd
import streamlit as st
from config import TMDB_API_KEY, TMDB_BASE_URL, TMDB_IMAGE_BASE

@st.cache_data(show_spinner=False)
def fetch_tmdb_metadata(movie_name, year=None):
    """Fetches Director, Genres, Overview Synopsis, Poster URL, and Runtime from TMDb."""
    if not TMDB_API_KEY:
        return "Unknown Director", "Cinema", "", None, 110
    
    search_url = f"{TMDB_BASE_URL}/search/movie"
    params = {"api_key": TMDB_API_KEY, "query": movie_name}
    if pd.notna(year):
        params["year"] = int(year)
        
    try:
        r = requests.get(search_url, params=params, timeout=5).json()
        results = r.get("results", [])
        if not results:
            return "Unknown Director", "Cinema", "", None, 110
            
        movie_id = results[0]["id"]
        overview = results[0].get("overview", "")
        poster_path = results[0].get("poster_path")
        poster_url = f"{TMDB_IMAGE_BASE}{poster_path}" if poster_path else None
        
        detail_url = f"{TMDB_BASE_URL}/movie/{movie_id}"
        detail_res = requests.get(
            detail_url, 
            params={"api_key": TMDB_API_KEY, "append_to_response": "credits"}, 
            timeout=5
        ).json()
        
        genres = ", ".join([g["name"] for g in detail_res.get("genres", [])]) or "Cinema"
        crew = detail_res.get("credits", {}).get("crew", [])
        directors = [m["name"] for m in crew if m.get("job") == "Director"]
        director = ", ".join(directors) if directors else "Unknown Director"
        runtime = detail_res.get("runtime") or 110
        
        return director, genres, overview, poster_url, int(runtime)
    except Exception:
        return "Unknown Director", "Cinema", "", None, 110
