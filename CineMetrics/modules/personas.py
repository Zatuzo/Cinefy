# modules/personas.py
import pandas as pd
from config import GENRE_PERSONAS

def get_cinematic_persona(monthly_df):
    """Calculates a Spotify-style Cinema Persona based on monthly viewing genres and decade."""
    if monthly_df.empty:
        return "Cinematic Explorer"
    
    all_genres = [
        g.strip() 
        for sublist in monthly_df['Genre'].dropna().str.split(',') 
        for g in sublist 
        if g.strip() and g.strip() != 'Cinema'
    ]
    top_genre = pd.Series(all_genres).mode()
    genre_str = top_genre[0] if not top_genre.empty else "Cinema"
    
    dec_mode = monthly_df['Decade'].mode()
    decade_str = dec_mode[0] if not dec_mode.empty else ""
    
    persona = GENRE_PERSONAS.get(genre_str, f"{genre_str} Connoisseur")
    if decade_str and decade_str not in ['N/As', 'nan', '']:
        return f"{decade_str} {persona}"
    return persona
