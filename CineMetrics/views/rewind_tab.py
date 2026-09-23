# views/rewind_tab.py
import pandas as pd
import plotly.express as px
import streamlit as st
from modules.personas import get_cinematic_persona
from modules.story_card import generate_rewind_story_card

def render_rewind_tab(df: pd.DataFrame):
    """Renders the Monthly Rewind (Spotify Wrapped Style) tab and story card export."""
    st.subheader("📼 Monthly Rewind")
    st.caption("A Spotify Wrapped–style monthly retrospective of your cinema diary, top directors, and watch time.")

    valid_months = df.dropna(subset=['Month_Year'])
    all_months = sorted(valid_months['Month_Year'].unique(), reverse=True)

    if not all_months:
        st.warning("No dated watch logs found in your diary export. Upload a `diary.csv` with dates to view monthly rewinds.")
        return

    c_sel1, c_sel2 = st.columns([1, 2])
    with c_sel1:
        selected_month = st.selectbox("Select Month to Rewind:", all_months, index=0)
        
    m_df = df[df['Month_Year'] == selected_month].copy()
    
    if m_df.empty:
        st.info("No films logged for the selected month.")
        return

    persona = get_cinematic_persona(m_df)
    
    # Spotify Wrapped Persona Banner
    st.markdown(
        f"""
        <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); 
                    border-radius: 16px; padding: 22px; margin: 15px 0 25px 0; border: 1px solid #38bdf8;">
            <span style="background: #38bdf8; color: #0f172a; padding: 4px 12px; border-radius: 12px; font-weight: bold; font-size: 12px;">
                CINEMATIC PERSONA
            </span>
            <h2 style="color: #f59e0b; margin: 10px 0 4px 0;">✨ {persona}</h2>
            <p style="color: #94a3b8; margin: 0; font-size: 14px;">Your dominant taste & viewing character for <b>{selected_month}</b>.</p>
        </div>
        """,
        unsafe_allow_html=True
    )
    
    # Monthly KPIs
    mk1, mk2, mk3, mk4 = st.columns(4)
    total_mins = m_df['Runtime'].sum() if 'Runtime' in m_df.columns else len(m_df) * 110
    total_hours = total_mins / 60.0
    
    mk1.metric("⏱️ Watch Time", f"{total_hours:.1f} hrs", help=f"Total: ~{int(total_mins):,} minutes")
    mk2.metric("🍿 Films Logged", f"{len(m_df)} films")
    m_rating = m_df['Rating'].mean()
    mk3.metric("★ Mean Rating", f"{m_rating:.2f}" if pd.notna(m_rating) else "N/A")
    top_day = m_df['Day_of_Week'].mode()
    mk4.metric("📅 Peak Day", top_day[0] if not top_day.empty else "N/A")
    
    st.markdown("---")
    
    # Visual Breakdown Columns
    col_films, col_directors = st.columns([3, 2])
    
    with col_films:
        st.subheader(f"👑 Top Films of {selected_month}")
        top_3 = m_df.sort_values(by=['Rating', 'Name'], ascending=[False, True]).head(3)
        
        spot_cols = st.columns(3)
        for idx, (_, mov) in enumerate(top_3.iterrows()):
            with spot_cols[idx]:
                if mov.get('Poster'):
                    st.image(mov['Poster'], use_container_width=True)
                st.markdown(f"**{mov['Name']}** ({int(mov['Year']) if pd.notna(mov.get('Year')) else 'N/A'})")
                r_star = f"★ {mov['Rating']:.1f}" if pd.notna(mov.get('Rating')) else "Watched"
                st.markdown(f"<span style='color: #f59e0b; font-weight: bold;'>{r_star}</span>", unsafe_allow_html=True)
                st.caption(f"🎬 {mov['Director']}\n\n🏷️ {mov['Genre']}")
                
    with col_directors:
        st.subheader("🏆 Top Directors & Genres")
        m_dirs = m_df[m_df['Director'] != 'Unknown Director']['Director'].value_counts().head(4).reset_index()
        m_dirs.columns = ['Director', 'Watched']
        if not m_dirs.empty:
            fig_md = px.bar(m_dirs, x='Watched', y='Director', orientation='h', color_discrete_sequence=['#38bdf8'])
            fig_md.update_layout(height=220, margin=dict(l=10, r=10, t=10, b=10), yaxis={'autorange': 'reversed'})
            st.plotly_chart(fig_md, use_container_width=True)
        else:
            st.caption("No director breakdown available.")

        all_g = [g.strip() for sublist in m_df['Genre'].dropna().str.split(',') for g in sublist if g.strip() and g.strip() != 'Cinema']
        m_genres = pd.Series(all_g).value_counts().head(4).reset_index()
        m_genres.columns = ['Genre', 'Count']
        if not m_genres.empty:
            fig_mg = px.bar(m_genres, x='Count', y='Genre', orientation='h', color_discrete_sequence=['#10b981'])
            fig_mg.update_layout(height=220, margin=dict(l=10, r=10, t=10, b=10), yaxis={'autorange': 'reversed'})
            st.plotly_chart(fig_mg, use_container_width=True)

    st.markdown("---")
    st.write("📲 **Export Monthly Story Card**")
    
    # Prepare metadata for story card
    all_m_genres = [g.strip() for sublist in m_df['Genre'].dropna().str.split(',') for g in sublist if g.strip() and g.strip() != 'Cinema']
    top_g_list = pd.Series(all_m_genres).value_counts().head(3).index.tolist()
    top_dir_name = m_dirs.iloc[0]['Director'] if not m_dirs.empty else "Various"
    lead_poster = top_3.iloc[0].get('Poster') if not top_3.empty else None

    if st.button("🎨 Render 9:16 Story Card"):
        with st.spinner("Generating card..."):
            story_bytes = generate_rewind_story_card(
                month_year=selected_month,
                persona=persona,
                total_films=len(m_df),
                total_hours=total_hours,
                top_director=top_dir_name,
                top_genres=top_g_list,
                poster_url=lead_poster
            )
            st.download_button(
                label="⬇️ Download Story Card (PNG)",
                data=story_bytes,
                file_name=f"cinemetrics_{selected_month}_story.png",
                mime="image/png"
            )
