# views/habits_tab.py
import pandas as pd
import plotly.express as px
import streamlit as st
from config import DAY_ORDER

def render_habits_tab(df: pd.DataFrame):
    """Renders the Viewing Habits tab with weekly rhythm and monthly velocity charts."""
    st.subheader("Viewing Velocity & Weekly Rhythm")
    h_col1, h_col2 = st.columns(2)
    
    valid_dates = df.dropna(subset=['Date'])
    
    with h_col1:
        st.write("**Day-of-Week Distribution**")
        day_counts = valid_dates['Day_of_Week'].value_counts().reindex(DAY_ORDER).fillna(0).reset_index()
        day_counts.columns = ['Day', 'Count']
        fig_days = px.bar(day_counts, x='Day', y='Count', color_discrete_sequence=['#f59e0b'])
        fig_days.update_layout(height=320, margin=dict(l=10, r=10, t=20, b=10))
        st.plotly_chart(fig_days, use_container_width=True)
        
    with h_col2:
        st.write("**Monthly Watch Volume Trends**")
        month_counts = valid_dates['Month_Year'].value_counts().sort_index().reset_index()
        month_counts.columns = ['Month', 'Count']
        fig_m = px.line(month_counts, x='Month', y='Count', markers=True, color_discrete_sequence=['#10b981'])
        fig_m.update_layout(height=320, margin=dict(l=10, r=10, t=20, b=10))
        st.plotly_chart(fig_m, use_container_width=True)
