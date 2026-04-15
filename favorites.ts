async function fetchMyFavorites() {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "./index.html"; // Redirige si non connecté
    return;
  }

  try {
    // 1. Récupérer les ID favoris depuis TON backend
    const response = await fetch("http://localhost:3000/favorites", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const myFavorites = await response.json(); // ex: [{ tmdb_id: 123, type: "movie" }, ...]

    const grid = document.querySelector(".favorites-grid");
    if (!grid) return;

    // 2. Pour chaque favori, interroger TMDB pour afficher la carte
    for (const fav of myFavorites) {
      const tmdbRes = await fetch(
        `${BASE_URL}/${fav.type}/${fav.tmdb_id}?api_key=${API_KEY}&language=fr-FR`,
      );
      const media = await tmdbRes.json();

      // Utilise ta fonction renderCard existante
      grid.innerHTML += renderCard(media);
    }
  } catch (error) {
    console.error("Erreur chargement favoris :", error);
  }
}

fetchMyFavorites();
