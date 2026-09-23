// src/services/storyCard.js

export async function generateStoryCardBlob({
  monthYear,
  persona,
  totalFilms,
  totalHours,
  topDirector,
  topGenres = [],
  posterUrl = null
}) {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext('2d');

  const safeMonthYear = String(monthYear || 'Month').toUpperCase();
  const safeDirector = String(topDirector || 'Various Auteurs');
  const safePersona = String(persona || 'Cinephile');

  // Matte Black Background
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, 1080, 1920);

  // Soft Red Accent Top Bar
  ctx.fillStyle = '#e05260';
  ctx.fillRect(0, 0, 1080, 16);

  // Top Header Branding
  ctx.fillStyle = '#e05260';
  ctx.font = 'bold 32px "Plus Jakarta Sans", -apple-system, sans-serif';
  ctx.fillText(`CINEMETRICS // ${safeMonthYear} REWIND`, 80, 150);

  ctx.fillStyle = '#f2f2f2';
  ctx.font = 'bold 46px "Plus Jakarta Sans", -apple-system, sans-serif';
  ctx.fillText('Monthly Film Capsule', 80, 220);

  // Persona Card
  drawRoundedRect(ctx, 80, 310, 920, 250, 14, '#181818', '#2a2a2a', 2);
  ctx.fillStyle = '#999999';
  ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('CINEMATIC PERSONA', 120, 370);

  ctx.fillStyle = '#f2f2f2';
  ctx.font = 'bold 44px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(safePersona, 120, 460);

  // Watch Time Box
  drawRoundedRect(ctx, 80, 600, 440, 280, 14, '#181818', '#2a2a2a', 1);
  ctx.fillStyle = '#e05260';
  ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('WATCH TIME', 120, 660);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 60px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`${totalHours.toFixed(1)} hrs`, 120, 750);

  ctx.fillStyle = '#777777';
  ctx.font = '24px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`${totalFilms} films logged`, 120, 820);

  // Top Director Box
  drawRoundedRect(ctx, 560, 600, 440, 280, 14, '#181818', '#2a2a2a', 1);
  ctx.fillStyle = '#eab308';
  ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('TOP DIRECTOR', 600, 660);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 42px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(safeDirector.slice(0, 16), 600, 750);

  ctx.fillStyle = '#777777';
  ctx.font = '24px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Most watched auteur', 600, 820);

  // Top Genres Box
  drawRoundedRect(ctx, 80, 920, 920, 260, 14, '#181818', '#2a2a2a', 1);
  ctx.fillStyle = '#999999';
  ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('TOP GENRES', 120, 980);

  ctx.fillStyle = '#f2f2f2';
  ctx.font = 'bold 38px "Plus Jakarta Sans", sans-serif';
  const genreStr = topGenres.slice(0, 3).join(' • ') || 'Cinema';
  ctx.fillText(genreStr.slice(0, 40), 120, 1070);

  // Lead Poster
  if (posterUrl) {
    try {
      const img = await loadImage(posterUrl);
      ctx.save();
      roundRectPath(ctx, 420, 1240, 240, 360, 12);
      ctx.clip();
      ctx.drawImage(img, 420, 1240, 240, 360);
      ctx.restore();
    } catch {
      // ignore
    }
  }

  // Footer branding
  ctx.fillStyle = '#555555';
  ctx.font = 'bold 24px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Cinefy // Personal Film Engine', 80, 1800);

  return new Promise(resolve => {
    canvas.toBlob(blob => resolve(blob), 'image/png');
  });
}

function drawRoundedRect(ctx, x, y, width, height, radius, fill, stroke = null, lineWidth = 1) {
  ctx.save();
  ctx.beginPath();
  roundRectPath(ctx, x, y, width, height, radius);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
  ctx.restore();
}

function roundRectPath(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
