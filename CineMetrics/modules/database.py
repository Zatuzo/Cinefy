# modules/database.py
import os
import json
import pandas as pd
from datetime import datetime
from supabase import create_client, Client
from config import SUPABASE_URL, SUPABASE_KEY
from textblob import TextBlob

_supabase: Client = None

DEFAULT_COLUMNS = [
    'Name', 'Year', 'Date', 'Rating', 'Review', 
    'Director', 'Genre', 'Runtime', 'Popularity', 'Overview', 'Poster',
    'Decade', 'Day_of_Week', 'Month_Year', 'Sentiment_Polarity'
]

def get_supabase_client() -> Client:
    global _supabase
    if _supabase is None:
        if not SUPABASE_URL or not SUPABASE_KEY:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in config.py")
        _supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    return _supabase

def get_or_create_user(username: str = "zatuzo") -> str:
    supabase = get_supabase_client()
    try:
        res = supabase.table("profiles").select("*").eq("username", username).execute()
        if res.data and len(res.data) > 0:
            return res.data[0]["id"]
        
        insert_res = supabase.table("profiles").insert({"username": username}).execute()
        if insert_res.data and len(insert_res.data) > 0:
            return insert_res.data[0]["id"]
    except Exception as e:
        print(f"Warning checking profiles table: {e}")

    return "f37896a8-190e-4ae6-b441-3c0faebd3570"

def upsert_movie_record(movie_dict: dict):
    supabase = get_supabase_client()
    title = str(movie_dict.get("Name") or movie_dict.get("title") or "Untitled").strip()
    
    release_year = movie_dict.get("Year") or movie_dict.get("year") or movie_dict.get("release_year")
    if pd.notna(release_year):
        try:
            release_year = int(release_year)
        except:
            release_year = None
    else:
        release_year = None

    director = movie_dict.get("Director") or movie_dict.get("director")
    director = str(director).strip() if pd.notna(director) and str(director).strip() not in ['Unknown Director', 'Auteur', 'Unknown', 'None'] else None

    genres_val = movie_dict.get("Genre") or movie_dict.get("genre") or movie_dict.get("genres")
    if isinstance(genres_val, list):
        genres = [str(g).strip() for g in genres_val if str(g).strip()]
    elif pd.notna(genres_val) and str(genres_val).strip():
        genres = [g.strip() for g in str(genres_val).split(',') if g.strip()]
    else:
        genres = ["Cinema"]

    overview = movie_dict.get("Overview") or movie_dict.get("overview")
    overview = str(overview).strip() if pd.notna(overview) else ""

    poster_url = movie_dict.get("Poster") or movie_dict.get("poster") or movie_dict.get("poster_url")
    poster_url = str(poster_url).strip() if pd.notna(poster_url) and poster_url else None

    runtime = movie_dict.get("Runtime") or movie_dict.get("runtime") or movie_dict.get("runtime_minutes")
    if pd.notna(runtime):
        try:
            runtime_minutes = int(runtime)
        except:
            runtime_minutes = 110
    else:
        runtime_minutes = 110

    movie_payload = {
        "title": title,
        "release_year": release_year,
        "director": director,
        "genres": genres,
        "overview": overview,
        "poster_url": poster_url,
        "runtime_minutes": runtime_minutes
    }

    try:
        query = supabase.table("movies").select("id").eq("title", title)
        if release_year:
            query = query.eq("release_year", release_year)
        existing = query.execute()

        if existing.data and len(existing.data) > 0:
            movie_id = existing.data[0]["id"]
            supabase.table("movies").update(movie_payload).eq("id", movie_id).execute()
            return movie_id
        else:
            insert_res = supabase.table("movies").insert(movie_payload).execute()
            if insert_res.data and len(insert_res.data) > 0:
                return insert_res.data[0]["id"]
    except Exception as e:
        print(f"Error in upsert_movie_record for {title}: {e}")
        raise e

    return None

def fetch_user_watch_logs(username="zatuzo"):
    """Fetches all viewing logs and joins movie metadata into a Pandas DataFrame."""
    supabase = get_supabase_client()
    user_id = get_or_create_user(username)
    
    # Query watch_logs and embed the related movies record
    res = supabase.table("watch_logs").select(
        "rating, watched_at, review, movies(*)"
    ).eq("user_id", user_id).order("watched_at", desc=True).execute()
    
    if not res.data:
        return pd.DataFrame()
        
    records = []
    for r in res.data:
        m = r.get("movies") or {}
        genres_raw = m.get("genres")
        if isinstance(genres_raw, list):
            genre_str = ", ".join(genres_raw)
        elif isinstance(genres_raw, str):
            try:
                parsed = json.loads(genres_raw)
                genre_str = ", ".join(parsed) if isinstance(parsed, list) else genres_raw
            except:
                genre_str = genres_raw
        else:
            genre_str = "Cinema"

        rev_text = r.get("review") or ""
        polarity = TextBlob(str(rev_text)).sentiment.polarity if str(rev_text).strip() else 0.0

        records.append({
            "Name": m.get("title"),
            "Year": m.get("release_year"),
            "Date": pd.to_datetime(r.get("watched_at")),
            "Watched Date": str(r.get("watched_at") or ""),
            "Rating": r.get("rating"),
            "Review": rev_text,
            "Director": m.get("director", "Unknown Director") or "Unknown Director",
            "Genre": genre_str,
            "Runtime": m.get("runtime_minutes", 110) or 110,
            "Popularity": float(m.get("popularity", 10.0)) if m.get("popularity") is not None else 10.0,
            "Overview": m.get("overview", "") or "",
            "Poster": m.get("poster_url"),
            "Sentiment_Polarity": polarity
        })
        
    df = pd.DataFrame(records)
    if not df.empty and "Date" in df.columns:
        df["Year"] = pd.to_numeric(df["Year"], errors="coerce")
        df["Rating"] = pd.to_numeric(df["Rating"], errors="coerce")
        df["Decade"] = (df["Year"] // 10 * 10).dropna().astype(int).astype(str) + "s"
        df["Day_of_Week"] = df["Date"].dt.day_name()
        df["Month_Year"] = df["Date"].dt.to_period("M").astype(str)
        
    return df

def fetch_user_watchlist(username="zatuzo"):
    """Fetches all watchlist items from Supabase with joined movie metadata."""
    try:
        supabase = get_supabase_client()
        user_id = get_or_create_user(username)
        
        res = supabase.table("watchlists").select(
            "user_id, movie_id, movies(title, release_year, director, genres, runtime_minutes, popularity, overview, poster_url)"
        ).eq("user_id", user_id).execute()
        
        if not res.data:
            return pd.DataFrame(columns=['Name', 'Year', 'Director', 'Genre', 'Runtime', 'Popularity', 'Overview', 'Poster'])
            
        records = []
        for r in res.data:
            m = r.get("movies") or {}
            genres_raw = m.get("genres")
            if isinstance(genres_raw, list):
                genre_str = ", ".join(genres_raw)
            elif isinstance(genres_raw, str):
                try:
                    parsed = json.loads(genres_raw)
                    genre_str = ", ".join(parsed) if isinstance(parsed, list) else genres_raw
                except:
                    genre_str = genres_raw
            else:
                genre_str = "Cinema"

            records.append({
                "Name": m.get("title") or "Untitled",
                "Year": m.get("release_year"),
                "Director": m.get("director") or "Unknown",
                "Genre": genre_str,
                "Runtime": m.get("runtime_minutes", 110) or 110,
                "Popularity": float(m.get("popularity", 10.0)) if m.get("popularity") is not None else 10.0,
                "Overview": m.get("overview", "") or "",
                "Poster": m.get("poster_url")
            })
            
        df = pd.DataFrame(records)
        df["Year"] = pd.to_numeric(df["Year"], errors="coerce")
        return df
    except Exception as e:
        print(f"Error fetching watchlist from Supabase: {e}")
        return pd.DataFrame(columns=['Name', 'Year', 'Director', 'Genre', 'Runtime', 'Popularity', 'Overview', 'Poster'])

def save_watch_log(username: str = "zatuzo", movie_data: dict = None, rating: float = None, review: str = "", watched_at: str = None) -> bool:
    """Saves or quick-logs a film to Supabase."""
    try:
        supabase = get_supabase_client()
        user_id = get_or_create_user(username)
        movie_id = upsert_movie_record(movie_data)
        
        if not movie_id:
            return False

        if not watched_at:
            watched_at = datetime.now().strftime("%Y-%m-%d")

        log_payload = {
            "user_id": user_id,
            "movie_id": movie_id,
            "rating": rating,
            "review": review or "",
            "watched_at": watched_at
        }
        supabase.table("watch_logs").insert(log_payload).execute()
        return True
    except Exception as e:
        print(f"Error saving watch log to Supabase: {e}")
        return False
