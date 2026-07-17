 const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
export async function searchPhotos(query, perPage = 9) {
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`;
  const res = await fetch(url, {
    headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` },
  });
  const data = await res.json();
  return data.results.map((photo) => ({
    id: photo.id,
    url: photo.urls.regular,
    thumb: photo.urls.thumb,
    alt: photo.alt_description,
    credit: photo.user.name,
  }));
}
