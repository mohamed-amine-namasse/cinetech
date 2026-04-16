declare var API_KEY: string;
declare var BASE_URL: string;
declare var IMAGE_BASE: string;
// On informe TypeScript que cette fonction existe ailleurs (dans list.ts)
declare function renderCard(item: any): string;

// --- Sélection du conteneur DOM ---
const favoritesGrid: HTMLElement | null =
  document.getElementById("favorites-grid");

// Interface correspondant à ce qu'on a sauvegardé dans details.ts
interface FavoriteItem {
  id: string;
  type: string;
  title: string;
  poster_path: string | null;
}

// Récupère la clé exacte de l'utilisateur connecté
function getFavoritesStorageKey(): string {
  const username = localStorage.getItem("username");
  return username ? `favorites_${username}` : "favorites_anonymous";
}

// Fonction principale de chargement
function loadFavorites(): void {
  if (!favoritesGrid) return;

  const hasToken = localStorage.getItem("user_token") !== null;

  if (!hasToken) {
    favoritesGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: #eee; border-radius: 8px; color: #333;">
        <h2>Vous n'êtes pas connecté</h2>
        <p>Connectez-vous via le bouton en haut pour voir vos favoris.</p>
      </div>
    `;
    return;
  }

  const key = getFavoritesStorageKey();
  const favsStr = localStorage.getItem(key);
  const favs: FavoriteItem[] = favsStr ? JSON.parse(favsStr) : [];

  if (favs.length === 0) {
    favoritesGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: rgba(255,255,255,0.05); border-radius: 8px;">
        <h2 style="color: #fff;">Aucun favori pour le moment</h2>
        <p style="color: #aaa;">Explorez les films et séries pour les ajouter à votre liste !</p>
      </div>
    `;
    return;
  }

  // --- MAGIE ICI ---
  // On utilise renderCard de list.ts pour afficher chaque favori !
  favoritesGrid.innerHTML = favs.map(renderCard).join("");
}

// --- Initialisation ---
document.addEventListener("DOMContentLoaded", loadFavorites);
window.addEventListener("authStateChanged", loadFavorites);
