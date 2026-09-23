# config.py
import os
from dotenv import load_dotenv

load_dotenv()

TMDB_API_KEY = os.getenv("TMDB_API_KEY", "76a327a724de6563297b5a4d68a6fcc4")
TMDB_BASE_URL = "https://api.themoviedb.org/3"
TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500"

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://shjoilhuulutvgblzoyc.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

# Mapping from dominant genres to persona titles
GENRE_PERSONAS = {
    'Crime': 'Gritty Crime Specialist',
    'Thriller': 'Psychological Thriller Devotee',
    'Drama': 'Introspective Drama Purist',
    'Science Fiction': 'Futuristic Visionary',
    'Sci-Fi': 'Futuristic Visionary',
    'Horror': 'Midnight Macabre Explorer',
    'Romance': 'Hopeless Romantic',
    'Comedy': 'Feel-Good Comedy Buff',
    'Animation': 'Whimsical Animation Enthusiast',
    'Action': 'Adrenaline Action Junkie',
    'Mystery': 'Enigmatic Mystery Sleuth',
    'Documentary': 'Inquisitive Non-Fiction Scholar',
    'Adventure': 'Epic Adventure Voyager',
    'Fantasy': 'High Fantasy Dreamer',
    'Music': 'Harmonic Cine-Music Aficionado',
    'Western': 'Dusty Frontier Pioneer',
    'War': 'Historical Conflict Analyst',
    'History': 'Period Piece Chronicler'
}

DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
