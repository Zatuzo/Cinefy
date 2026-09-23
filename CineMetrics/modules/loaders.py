# modules/loaders.py
import pandas as pd
import streamlit as st
from textblob import TextBlob
from config import TMDB_API_KEY
from modules.tmdb import fetch_tmdb_metadata


def safe_read_csv(file_obj):
    """Safely reads a Letterboxd CSV file by resolving seek position and skipping metadata headers."""
    try:
        file_obj.seek(0)
        content_bytes = file_obj.read()
        file_obj.seek(0)
        
        content = content_bytes.decode('utf-8-sig', errors='ignore')
        lines = content.splitlines()
        
        skip_rows = 0
        for i, line in enumerate(lines[:10]):
            cols = [c.strip().lower() for c in line.split(',')]
            # Look for headers
            if any(h in cols for h in ['name', 'watched date', 'date', 'rating', 'uri']):
                skip_rows = i
                break
                
        file_obj.seek(0)
        return pd.read_csv(file_obj, skiprows=skip_rows)
    except Exception:
        try:
            file_obj.seek(0)
            return pd.read_csv(file_obj)
        except Exception:
            return pd.DataFrame()


@st.cache_data(show_spinner="Processing Letterboxd logs...")
def load_letterboxd_bundle(uploaded_files=None):
    """Parses and enriches diary, ratings, and reviews CSVs uploaded from Letterboxd."""
    if not uploaded_files:
        return pd.DataFrame()
    
    file_map = {}
    for f in uploaded_files:
        name = f.name.lower()
        if 'diary' in name:
            file_map['diary'] = safe_read_csv(f)
        elif 'rating' in name:
            file_map['ratings'] = safe_read_csv(f)
        elif 'review' in name:
            file_map['reviews'] = safe_read_csv(f)
        else:
            file_map[name] = safe_read_csv(f)

    if 'diary' in file_map:
        base_df = file_map['diary']
    elif 'ratings' in file_map:
        base_df = file_map['ratings']
    elif 'reviews' in file_map:
        base_df = file_map['reviews']
    else:
        base_df = list(file_map.values())[0]

    # Date normalization
    if 'Watched Date' in base_df.columns:
        base_df['Date'] = pd.to_datetime(base_df['Watched Date'], errors='coerce')
    elif 'Date' in base_df.columns:
        base_df['Date'] = pd.to_datetime(base_df['Date'], errors='coerce')
    else:
        base_df['Date'] = pd.NaT

    # Merge Reviews & Ratings
    if 'reviews' in file_map and file_map['reviews'] is not base_df:
        rev_df = file_map['reviews'][['Name', 'Year', 'Review']].dropna(subset=['Review'])
        base_df = pd.merge(base_df, rev_df, on=['Name', 'Year'], how='left')

    if 'ratings' in file_map and 'Rating' not in base_df.columns:
        rat_df = file_map['ratings'][['Name', 'Year', 'Rating']]
        base_df = pd.merge(base_df, rat_df, on=['Name', 'Year'], how='left')

    base_df['Year'] = pd.to_numeric(base_df['Year'], errors='coerce')
    base_df['Decade'] = (base_df['Year'] // 10 * 10).dropna().astype(int).astype(str) + 's'
    base_df['Rating'] = pd.to_numeric(base_df['Rating'], errors='coerce')
    
    # Deduplicate while preserving multiple screenings/rewatches on distinct dates
    dedup_cols = ['Name', 'Year', 'Date'] if 'Date' in base_df.columns and not base_df['Date'].dropna().empty else ['Name', 'Year']
    base_df = base_df.drop_duplicates(subset=dedup_cols).reset_index(drop=True)

    # Feature Engineering for Habits
    base_df['Day_of_Week'] = base_df['Date'].dt.day_name()
    base_df['Month_Year'] = base_df['Date'].dt.to_period('M').astype(str)

    # Enrich metadata
    if TMDB_API_KEY:
        directors, genres, overviews, posters, runtimes = [], [], [], [], []
        prog = st.progress(0, text="Syncing metadata, runtimes & synopses from TMDb...")
        total = len(base_df)
        
        for i, row in base_df.iterrows():
            d, g, o, p, r = fetch_tmdb_metadata(row['Name'], row.get('Year'))
            directors.append(d)
            genres.append(g)
            overviews.append(o)
            posters.append(p)
            runtimes.append(r)
            prog.progress((i + 1) / total)
            
        prog.empty()
        base_df['Director'] = directors
        base_df['Genre'] = genres
        base_df['Overview'] = overviews
        base_df['Poster'] = posters
        base_df['Runtime'] = runtimes
    else:
        base_df['Director'] = 'Unknown Director'
        base_df['Genre'] = 'Cinema'
        base_df['Overview'] = ''
        base_df['Poster'] = None
        base_df['Runtime'] = 110

    if 'Review' not in base_df.columns:
        base_df['Review'] = ''
    base_df['Review'] = base_df['Review'].fillna('')

    # Review NLP Sentiment Score
    base_df['Sentiment_Polarity'] = base_df['Review'].apply(
        lambda x: TextBlob(str(x)).sentiment.polarity if str(x).strip() else 0.0
    )

    return base_df


@st.cache_data(show_spinner="Processing Letterboxd watchlist...")
def load_watchlist_data(uploaded_files=None):
    """Parses and enriches watchlist CSV uploaded from Letterboxd."""
    if not uploaded_files:
        return pd.DataFrame()
    
    watchlist_file = next((f for f in uploaded_files if 'watchlist' in f.name.lower()), None)
    if not watchlist_file:
        return pd.DataFrame()
        
    df_watch = safe_read_csv(watchlist_file)
    if df_watch.empty:
        return pd.DataFrame()
    df_watch['Year'] = pd.to_numeric(df_watch['Year'], errors='coerce')
    
    if TMDB_API_KEY:
        directors, genres, overviews, posters = [], [], [], []
        for _, row in df_watch.iterrows():
            d, g, o, p, _ = fetch_tmdb_metadata(row['Name'], row.get('Year'))
            directors.append(d)
            genres.append(g)
            overviews.append(o)
            posters.append(p)
            
        df_watch['Director'] = directors
        df_watch['Genre'] = genres
        df_watch['Overview'] = overviews
        df_watch['Poster'] = posters
    else:
        df_watch['Director'] = 'Unknown'
        df_watch['Genre'] = 'Cinema'
        df_watch['Overview'] = ''
        df_watch['Poster'] = None
        
    return df_watch
