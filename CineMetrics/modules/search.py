# modules/search.py
import requests
import streamlit as st
from config import TMDB_API_KEY, TMDB_BASE_URL, TMDB_IMAGE_BASE

@st.cache_data(show_spinner=False)
def search_tmdb_movies(query: str, page: int = 1):
    """Performs an instant TMDb movie search returning structured movie objects."""
    if not TMDB_API_KEY or not query or not query.strip():
        return []
    
    url = f"{TMDB_BASE_URL}/search/movie"
    params = {
        "api_key": TMDB_API_KEY,
        "query": query.strip(),
        "page": page,
        "include_adult": False
    }
    
    try:
        response = requests.get(url, params=params, timeout=5)
        response.raise_for_status()
        data = response.json()
        raw_results = data.get("results", [])
        
        movies = []
        for item in raw_results:
            release_date = item.get("release_date", "")
            year = release_date.split("-")[0] if release_date else "N/A"
            poster_path = item.get("poster_path")
            poster_url = f"{TMDB_IMAGE_BASE}{poster_path}" if poster_path else None
            
            movies.append({
                "id": item.get("id"),
                "title": item.get("title") or item.get("original_title") or "Unknown Title",
                "year": year,
                "release_date": release_date,
                "overview": item.get("overview", "No synopsis available."),
                "rating": item.get("vote_average", 0.0),
                "vote_count": item.get("vote_count", 0),
                "poster_url": poster_url,
                "popularity": item.get("popularity", 0.0)
            })
        return movies
    except Exception:
        return []
