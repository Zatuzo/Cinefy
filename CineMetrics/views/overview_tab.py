# views/overview_tab.py
import pandas as pd
import plotly.express as px
import streamlit as st

def render_overview_tab(df: pd.DataFrame):
    """Renders the Profile Overview tab with decade and director breakdowns."""
    c_left, c_right = st.columns(2)
    with c_left:
        st.subheader("Decade Breakdown")
        dec_df = df['Decade'].value_counts().sort_index().reset_index()
        dec_df.columns = ['Decade', 'Count']
        fig_dec = px.bar(dec_df, x='Decade', y='Count', color_discrete_sequence=['#38bdf8'])
        fig_dec.update_layout(height=350, margin=dict(l=10, r=10, t=20, b=10))
        st.plotly_chart(fig_dec, use_container_width=True)
        
    with c_right:
        st.subheader("Top Directors by Volume & Rating")
        dir_summary = df[df['Director'] != 'Unknown Director'].groupby('Director').agg(
            Film_Count=('Name', 'count'),
            Avg_Rating=('Rating', 'mean')
        ).reset_index().query('Film_Count >= 2').sort_values(by='Film_Count', ascending=False).head(10)
        
        fig_dir = px.bar(
            dir_summary, x='Director', y='Film_Count', color='Avg_Rating',
            color_continuous_scale='Viridis', labels={'Avg_Rating': 'Mean ★'}
        )
        fig_dir.update_layout(height=350, margin=dict(l=10, r=10, t=20, b=10))
        st.plotly_chart(fig_dir, use_container_width=True)
