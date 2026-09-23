# views/mixes_tab.py
import pandas as pd
import streamlit as st
from modules.mixes import build_cinema_mixes

def render_mixes_tab(df: pd.DataFrame):
    """Renders the Cinema Mixes (Spotify Daily Mix Style) tab."""
    st.subheader("🎧 Your Cinema Mixes")
    st.caption("Personalized algorithmic playlists blending your top genres and director signatures.")
    
    mixes = build_cinema_mixes(df)
    if not mixes:
        st.info("Log more films across diverse genres to unlock Cinema Mixes.")
    else:
        for mix in mixes:
            st.markdown(f"### {mix['title']}")
            st.caption(mix['description'])
            
            m_cols = st.columns(4)
            for idx, (_, movie) in enumerate(mix['films'].iterrows()):
                with m_cols[idx]:
                    if movie.get('Poster'):
                        st.image(movie['Poster'], use_container_width=True)
                    st.markdown(f"**{movie['Name']}** ({int(movie['Year']) if pd.notna(movie.get('Year')) else 'N/A'})")
                    r_val = f"★ {movie['Rating']:.1f}" if pd.notna(movie.get('Rating')) else "Logged"
                    st.caption(f"{r_val} • {movie.get('Director', 'Auteur')}")
            st.markdown("---")
