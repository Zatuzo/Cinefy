# app.py
import streamlit as st
import pandas as pd
from datetime import datetime

from modules.database import fetch_user_watch_logs, fetch_user_watchlist, save_watch_log
from modules.loaders import load_letterboxd_bundle, load_watchlist_data
from modules.search import search_tmdb_movies
from modules.tmdb import fetch_tmdb_metadata
from views.rewind_tab import render_rewind_tab
from views.mixes_tab import render_mixes_tab
from views.overview_tab import render_overview_tab
from views.habits_tab import render_habits_tab
from views.semantic_tab import render_semantic_tab

st.set_page_config(page_title="CineMetrics | Film Diary Engine", layout="wide", page_icon="🎬")

# Title & Subheader
st.title("🎬 CineMetrics — Personal Film Diary & Taste Engine")
st.caption("Deep analytical breakdown of personal viewing logs, director distributions, and monthly rewind summaries.")

# Sidebar for quick logger and optional fresh CSV imports
with st.sidebar:
    st.header("⚡ Quick Movie Logger")
    st.caption("Search TMDb and log screenings directly to Supabase.")
    quick_query = st.text_input("Search movie title:", placeholder="e.g. Inception, Dune...", key="quick_search")
    
    if quick_query:
        with st.spinner("Searching TMDb..."):
            search_results = search_tmdb_movies(quick_query)
            
        if not search_results:
            st.info("No matching films found.")
        else:
            for m in search_results[:3]:
                st.markdown("---")
                if m.get("poster_url"):
                    st.image(m["poster_url"], width=100)
                st.markdown(f"**{m['title']}** ({m['year']})")
                st.caption(f"★ {m['rating']:.1f} • {m['vote_count']} votes")
                with st.expander("Synopsis"):
                    st.write(m["overview"])
                log_rating = st.slider(f"Rate '{m['title']}':", 0.5, 5.0, 4.0, 0.5, key=f"rate_{m['id']}")
                if st.button(f"➕ Log Film", key=f"btn_{m['id']}"):
                    d, g, o, p, r = fetch_tmdb_metadata(m['title'], m.get('year'))
                    movie_payload = {
                        "Name": m['title'],
                        "Year": m.get('year'),
                        "Director": d,
                        "Genre": g,
                        "Overview": o or m.get("overview", ""),
                        "Poster": p or m.get("poster_url"),
                        "Runtime": r
                    }
                    success = save_watch_log(username="zatuzo", movie_data=movie_payload, rating=log_rating)
                    if success:
                        st.success(f"Logged **{m['title']}** (★ {log_rating}) to Supabase!")
                        st.rerun()
                    else:
                        st.warning("Failed to save log to Supabase.")

    st.markdown("---")
    st.header("⚙️ Data Settings")
    uploaded_files = st.file_uploader(
        "Upload new Letterboxd export (optional)", 
        type=['csv'], 
        accept_multiple_files=True
    )

# 1. Fallback directly to Supabase if no CSV is actively dropped
if uploaded_files:
    df = load_letterboxd_bundle(uploaded_files)
    df_watch = load_watchlist_data(uploaded_files)
else:
    df = fetch_user_watch_logs(username="zatuzo")
    df_watch = fetch_user_watchlist(username="zatuzo")

# 2. Guard clause
if df.empty:
    st.info("No movie logs found. Run the migration script or upload a Letterboxd export.")
    st.stop()

# Header KPIs
k1, k2, k3, k4 = st.columns(4)
k1.metric("Total Films Logged", len(df))
k2.metric("Mean Rating", f"★ {df['Rating'].mean():.2f}" if 'Rating' in df.columns and not df['Rating'].dropna().empty else "N/A")
k3.metric("Top Decade", df['Decade'].mode()[0] if 'Decade' in df.columns and not df['Decade'].dropna().empty else "N/A")
top_dir = df[df['Director'] != 'Unknown Director']['Director'].mode() if 'Director' in df.columns else pd.Series()
k4.metric("Top Director", top_dir[0] if not top_dir.empty else "N/A")

st.markdown("---")

# Feature Tabs
tab_rewind, tab_mixes, tab_overview, tab_habits, tab_semantic = st.tabs([
    "📼 Monthly Rewind (Wrapped)",
    "🎧 Cinema Mixes",
    "📊 Profile Overview",
    "📅 Viewing Habits",
    "🔍 Semantic Mood Search"
])

with tab_rewind:
    render_rewind_tab(df)

with tab_mixes:
    render_mixes_tab(df)

with tab_overview:
    render_overview_tab(df)

with tab_habits:
    render_habits_tab(df)

with tab_semantic:
    render_semantic_tab(df_watch)
