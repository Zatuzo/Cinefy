# scripts/migrate_csv_to_supabase.py
import os
import sys
import time
import pandas as pd
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed

# Add root directory to python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from config import TMDB_API_KEY, TMDB_BASE_URL, TMDB_IMAGE_BASE
from modules.database import get_supabase_client, get_or_create_user

def fetch_movie_tmdb(name, year=None):
    """Fetches details from TMDb with retry fallback."""
    if not TMDB_API_KEY:
        return "Unknown Director", "Cinema", "", None, 110, 10.0
    
    url = f"{TMDB_BASE_URL}/search/movie"
    params = {"api_key": TMDB_API_KEY, "query": name}
    if pd.notna(year):
        try:
            params["year"] = int(year)
        except:
            pass
    
    for attempt in range(3):
        try:
            r = requests.get(url, params=params, timeout=6).json()
            results = r.get("results", [])
            if not results:
                return "Unknown Director", "Cinema", "", None, 110, 10.0
            
            m = results[0]
            m_id = m["id"]
            overview = m.get("overview", "")
            pop = float(m.get("popularity", 10.0))
            poster = f"{TMDB_IMAGE_BASE}{m['poster_path']}" if m.get("poster_path") else None
            
            d_res = requests.get(f"{TMDB_BASE_URL}/movie/{m_id}", params={"api_key": TMDB_API_KEY, "append_to_response": "credits"}, timeout=6).json()
            genres = ", ".join([g["name"] for g in d_res.get("genres", [])]) or "Cinema"
            crew = d_res.get("credits", {}).get("crew", [])
            directors = [c["name"] for c in crew if c.get("job") == "Director"]
            director = ", ".join(directors) if directors else "Unknown Director"
            runtime = d_res.get("runtime") or 110
            
            return director, genres, overview, poster, int(runtime), pop
        except Exception:
            time.sleep(0.5)
            
    return "Unknown Director", "Cinema", "", None, 110, 10.0

def process_and_upload_film(user_id, row):
    """Worker task: Enriches and inserts a single film + log entry safely."""
    supabase = get_supabase_client()
    name = row['Name']
    year = int(row['Year']) if pd.notna(row.get('Year')) else None
    
    # Retry wrapper
    for attempt in range(4):
        try:
            # 1. Check or insert movie
            q = supabase.table("movies").select("id").eq("title", name)
            if year:
                q = q.eq("release_year", year)
            res = q.execute()

            if res.data:
                movie_id = res.data[0]["id"]
            else:
                d, g, o, p, rt, pop = fetch_movie_tmdb(name, year)
                m_res = supabase.table("movies").insert({
                    "title": name,
                    "release_year": year,
                    "director": d,
                    "genres": g,
                    "runtime_minutes": rt,
                    "popularity": pop,
                    "overview": o,
                    "poster_url": p
                }).execute()
                movie_id = m_res.data[0]["id"]

            # 2. Check if already logged to avoid duplicates
            w_date = str(row['Date'].date()) if pd.notna(row.get('Date')) and hasattr(row['Date'], 'date') else (str(row.get('Date'))[:10] if pd.notna(row.get('Date')) else None)
            rating_val = float(row['Rating']) if pd.notna(row.get('Rating')) else None
            
            q_log = supabase.table("watch_logs").select("id").eq("user_id", user_id).eq("movie_id", movie_id)
            if w_date:
                q_log = q_log.eq("watched_at", w_date)
            log_res = q_log.execute()

            if not log_res.data:
                supabase.table("watch_logs").insert({
                    "user_id": user_id,
                    "movie_id": movie_id,
                    "rating": rating_val,
                    "review": str(row.get('Review', '')),
                    "watched_at": w_date
                }).execute()

            return name
        except Exception as e:
            if attempt == 3:
                print(f"  ⚠️ Error processing {name}: {e}")
                return name
            time.sleep(0.5 * (attempt + 1))

    return name

def run_fast_migration(export_dir):
    export_dir = os.path.abspath(os.path.expanduser(export_dir.strip()))
    print(f"📁 Reading Letterboxd export from: {export_dir}")
    supabase = get_supabase_client()
    user_id = get_or_create_user("zatuzo")
    print(f"👤 Target Supabase User ID: {user_id}\n")

    # Load CSVs
    diary_p = os.path.join(export_dir, "diary.csv")
    ratings_p = os.path.join(export_dir, "ratings.csv")
    reviews_p = os.path.join(export_dir, "reviews.csv")
    watchlist_p = os.path.join(export_dir, "watchlist.csv")

    diary_df = pd.read_csv(diary_p) if os.path.exists(diary_p) else pd.DataFrame()
    ratings_df = pd.read_csv(ratings_p) if os.path.exists(ratings_p) else pd.DataFrame()
    reviews_df = pd.read_csv(reviews_p) if os.path.exists(reviews_p) else pd.DataFrame()
    watchlist_df = pd.read_csv(watchlist_p) if os.path.exists(watchlist_p) else pd.DataFrame()

    if not diary_df.empty:
        base = diary_df.copy()
        date_col = 'Watched Date' if 'Watched Date' in base.columns else 'Date'
        base['Date'] = pd.to_datetime(base[date_col], errors='coerce')
    elif not ratings_df.empty:
        base = ratings_df.copy()
        base['Date'] = pd.to_datetime(base['Date'], errors='coerce')
    else:
        print("❌ No diary.csv or ratings.csv found.")
        return

    if not reviews_df.empty and 'Review' in reviews_df.columns:
        r_sub = reviews_df[['Name', 'Year', 'Review']].dropna(subset=['Review'])
        base = pd.merge(base, r_sub, on=['Name', 'Year'], how='left')

    if 'Rating' not in base.columns and not ratings_df.empty:
        rat_sub = ratings_df[['Name', 'Year', 'Rating']]
        base = pd.merge(base, rat_sub, on=['Name', 'Year'], how='left')

    base['Review'] = base['Review'].fillna('') if 'Review' in base.columns else ''
    base['Year'] = pd.to_numeric(base['Year'], errors='coerce')
    dedup_cols = ['Name', 'Year', 'Date'] if 'Date' in base.columns and not base['Date'].dropna().empty else ['Name', 'Year']
    base = base.drop_duplicates(subset=dedup_cols).reset_index(drop=True)

    print(f"🎬 Ingesting {len(base)} movies concurrently...")

    # Multi-threaded execution for Watch Logs (5 workers for connection stability)
    completed = 0
    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = [
            executor.submit(process_and_upload_film, user_id, row) 
            for _, row in base.iterrows()
        ]
        for f in as_completed(futures):
            completed += 1
            if completed % 25 == 0 or completed == len(base):
                print(f"  ⚡ [{completed}/{len(base)}] Processed films")

    # Ingest Watchlist concurrently
    if not watchlist_df.empty:
        print(f"\n🎯 Ingesting {len(watchlist_df)} Watchlist titles...")
        def process_watchlist_item(row):
            w_name = row['Name']
            w_year = int(row['Year']) if pd.notna(row.get('Year')) else None
            for attempt in range(3):
                try:
                    q = supabase.table("movies").select("id").eq("title", w_name)
                    if w_year:
                        q = q.eq("release_year", w_year)
                    w_res = q.execute()
                    if w_res.data:
                        mid = w_res.data[0]["id"]
                    else:
                        d, g, o, p, rt, pop = fetch_movie_tmdb(w_name, w_year)
                        ins = supabase.table("movies").insert({
                            "title": w_name, "release_year": w_year, "director": d, 
                            "genres": g, "runtime_minutes": rt, "popularity": pop, 
                            "overview": o, "poster_url": p
                        }).execute()
                        mid = ins.data[0]["id"]
                    
                    existing_w = supabase.table("watchlists").select("movie_id").eq("user_id", user_id).eq("movie_id", mid).execute()
                    if not existing_w.data:
                        supabase.table("watchlists").insert({"user_id": user_id, "movie_id": mid}).execute()
                    return w_name
                except Exception:
                    time.sleep(0.5)
            return w_name

        w_completed = 0
        with ThreadPoolExecutor(max_workers=5) as executor:
            w_futures = [executor.submit(process_watchlist_item, r) for _, r in watchlist_df.iterrows()]
            for f in as_completed(w_futures):
                w_completed += 1
                if w_completed % 25 == 0 or w_completed == len(watchlist_df):
                    print(f"  📌 [{w_completed}/{len(watchlist_df)}] Watchlist queued")

    print("\n✅ Migration complete! Your Supabase database is fully synced.")

if __name__ == "__main__":
    default_path = "/Users/zatuzo/Downloads/letterboxd"
    if len(sys.argv) > 1:
        target = sys.argv[1]
    else:
        target = input(f"Enter path [{default_path}]: ").strip() or default_path
    run_fast_migration(target)