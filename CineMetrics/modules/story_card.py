# modules/story_card.py
import io
import requests
from PIL import Image, ImageDraw

def generate_rewind_story_card(month_year, persona, total_films, total_hours, top_director, top_genres, poster_url=None):
    """Renders a sleek 1080x1920 Instagram Story Card for the Monthly Rewind."""
    card = Image.new('RGB', (1080, 1920), color=(15, 23, 42))
    draw = ImageDraw.Draw(card)
    
    # Accent top banner
    draw.rectangle([(0, 0), (1080, 24)], fill="#38bdf8")
    
    # Header Branding
    draw.text((80, 140), f"CINEMETRICS // {month_year} REWIND", fill="#38bdf8")
    draw.text((80, 200), "Monthly Taste Capsule", fill="#f8fafc")
    
    # Persona Card
    draw.rounded_rectangle([(80, 320), (1000, 580)], radius=20, fill=(30, 41, 59), outline="#38bdf8", width=2)
    draw.text((120, 360), "YOUR CINEMATIC PERSONA", fill="#94a3b8")
    draw.text((120, 420), f"{persona}", fill="#f59e0b")
    
    # Metric 1: Hours & Films
    draw.rounded_rectangle([(80, 620), (520, 920)], radius=20, fill=(30, 41, 59))
    draw.text((120, 660), "WATCH TIME", fill="#38bdf8")
    draw.text((120, 720), f"{total_hours:.1f} hrs", fill="#ffffff")
    draw.text((120, 820), f"{total_films} films logged", fill="#94a3b8")
    
    # Metric 2: Top Director
    draw.rounded_rectangle([(560, 620), (1000, 920)], radius=20, fill=(30, 41, 59))
    draw.text((600, 660), "TOP AUTEUR", fill="#a855f7")
    draw.text((600, 720), f"{top_director[:18]}", fill="#ffffff")
    draw.text((600, 820), "Most watched director", fill="#94a3b8")

    # Metric 3: Top Genres
    draw.rounded_rectangle([(80, 960), (1000, 1260)], radius=20, fill=(30, 41, 59))
    draw.text((120, 1000), "FREQUENT VIBES & GENRES", fill="#10b981")
    genres_str = " • ".join(top_genres[:4]) if top_genres else "Cinema"
    draw.text((120, 1070), genres_str[:45], fill="#ffffff")

    # Optional Highlight Poster
    if poster_url:
        try:
            res = requests.get(poster_url, timeout=3)
            p_img = Image.open(io.BytesIO(res.content)).convert('RGB')
            p_img = p_img.resize((240, 360), Image.Resampling.LANCZOS)
            card.paste(p_img, (420, 1320))
        except Exception:
            pass

    # Footer
    draw.text((80, 1800), "Created with CineMetrics", fill="#64748b")
    
    buf = io.BytesIO()
    card.save(buf, format="PNG")
    return buf.getvalue()
