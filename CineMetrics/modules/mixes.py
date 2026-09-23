# modules/mixes.py
import pandas as pd

def build_cinema_mixes(df, num_mixes=3):
    """Groups user history into Spotify Daily Mix–style thematic bundles."""
    if df.empty:
        return []
    
    # Extract dominant non-generic genres
    all_genres = [
        g.strip() 
        for sublist in df['Genre'].dropna().str.split(',') 
        for g in sublist 
        if g.strip() and g.strip() != 'Cinema'
    ]
    top_genres = pd.Series(all_genres).value_counts().head(num_mixes).index.tolist()
    
    mixes = []
    for g in top_genres:
        matched = df[df['Genre'].str.contains(g, na=False)].sort_values(by='Rating', ascending=False)
        if len(matched) >= 2:
            mixes.append({
                'title': f"{g} Mix",
                'description': f"A custom blend of your favorite {g.lower()} films and auteur staples.",
                'films': matched.head(4)
            })
    return mixes
