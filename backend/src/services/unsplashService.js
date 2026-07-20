import dotenv from 'dotenv';
dotenv.config();

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

export async function searchPhotos(query, perPage = 9) {
  if (!UNSPLASH_ACCESS_KEY) {
    throw new Error('UNSPLASH_ACCESS_KEY is missing in environment variables');
  }

  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`;
  const res = await fetch(url, {
    headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` },
  });

  const data = await res.json();

  if (!res.ok) {
    console.error('Unsplash API error:', data);
    throw new Error(data?.errors?.[0] || `Unsplash error ${res.status}`);
  }

  if (!data.results) {
    console.error('Unsplash unexpected response:', data);
    throw new Error('Unexpected response from Unsplash API');
  }

  return data.results.map((photo) => ({
    id: photo.id,
    url: photo.urls.regular,
    thumb: photo.urls.thumb,
    alt: photo.alt_description,
    credit: photo.user.name,
  }));
}