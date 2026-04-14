"use strict";

interface Suggestion {
  id: number;
  title: string;
  type: string;
  mediaType: string;
  year: string;
  value: string;
}

type TmdbItem = {
  id: number;
  title?: string;
  name?: string;
  media_type?: string;
  release_date?: string;
  first_air_date?: string;
};

const SEARCH_URL = "https://api.themoviedb.org/3/search/multi";
const searchInput = document.querySelector<HTMLInputElement>(
  ".header-search-input",
);
const suggestionsList = document.querySelector<HTMLUListElement>(
  ".search-suggestions",
);

let activeSuggestion = -1;
let currentSuggestions: Suggestion[] = [];
let debounceTimer: number | null = null;

/**
 * Formate un item de l'API en objet Suggestion (sans les Stars)
 */
function formatSuggestion(item: TmdbItem): Suggestion | null {
  // On ignore les personnes (stars)
  if (item.media_type === "person") return null;

  const title = item.title || item.name || "Suggestion";
  const isMovie = item.media_type === "movie" || !!item.title;

  const typeLabel = isMovie ? "Film" : "Série";
  const mediaType = isMovie ? "movie" : "tv";

  const year = item.release_date || item.first_air_date || "";
  const yearText = year ? year.slice(0, 4) : "";

  return {
    id: item.id,
    title,
    type: typeLabel,
    mediaType: mediaType,
    year: yearText,
    value: title,
  };
}

function clearSuggestions(): void {
  if (!suggestionsList || !searchInput) return;
  suggestionsList.innerHTML = "";
  suggestionsList.classList.remove("active");
  searchInput.setAttribute("aria-expanded", "false");
  activeSuggestion = -1;
  currentSuggestions = [];
}

/**
 * Met à jour le DOM de la liste de suggestions
 */
function updateSuggestions(items: Suggestion[]): void {
  if (!suggestionsList || !searchInput) return;
  suggestionsList.innerHTML = "";

  if (!items.length) {
    clearSuggestions();
    return;
  }

  currentSuggestions = items;

  items.forEach((suggestion, index) => {
    const li = document.createElement("li");
    li.setAttribute("role", "option");
    li.id = `suggestion-${index}`;
    li.innerHTML = `
      <div class="suggestion-info">
        <span class="suggestion-title">${suggestion.title}</span>
        <span class="suggestion-meta">${suggestion.year} • ${suggestion.type}</span>
      </div>
    `;

    // Événement de clic pour la redirection
    li.addEventListener("click", () => {
      selectSuggestion(index);
    });

    suggestionsList.appendChild(li);
  });

  suggestionsList.classList.add("active");
  searchInput.setAttribute("aria-expanded", "true");
}

function highlightSuggestion(index: number): void {
  if (!suggestionsList) return;
  Array.from(suggestionsList.children).forEach((child, i) => {
    child.classList.toggle("focused", i === index);
  });
  if (index >= 0) {
    searchInput?.setAttribute("aria-activedescendant", `suggestion-${index}`);
  }
}

/**
 * Redirige vers la page de détails
 */
function selectSuggestion(index: number): void {
  const suggestion = currentSuggestions[index];
  if (!suggestion) return;

  // Redirection vers details.html avec les bons paramètres
  window.location.href = `./details.html?type=${suggestion.mediaType}&id=${suggestion.id}`;
}

async function fetchTmdbSuggestions(query: string): Promise<void> {
  if (!query.trim()) {
    clearSuggestions();
    return;
  }

  try {
    const url = `${SEARCH_URL}?api_key=${API_KEY}&query=${encodeURIComponent(query)}&language=fr-FR`;
    const response = await fetch(url);
    const data = await response.json();

    // On formate et on filtre les null (les stars supprimées)
    const suggestions = (data.results || [])
      .map(formatSuggestion)
      .filter((item: Suggestion | null): item is Suggestion => item !== null)
      .slice(0, 8);

    updateSuggestions(suggestions);
  } catch (error) {
    console.error("Erreur suggestions:", error);
  }
}

// --- Événements ---

function onInput(event: Event): void {
  const value = (event.target as HTMLInputElement).value;
  if (debounceTimer) window.clearTimeout(debounceTimer);

  debounceTimer = window.setTimeout(() => {
    fetchTmdbSuggestions(value);
  }, 250);
}

function onKeyDown(event: KeyboardEvent): void {
  if (!suggestionsList || !suggestionsList.classList.contains("active")) return;

  const itemCount = suggestionsList.children.length;

  switch (event.key) {
    case "ArrowDown":
      event.preventDefault();
      activeSuggestion = Math.min(activeSuggestion + 1, itemCount - 1);
      highlightSuggestion(activeSuggestion);
      break;
    case "ArrowUp":
      event.preventDefault();
      activeSuggestion = Math.max(activeSuggestion - 1, 0);
      highlightSuggestion(activeSuggestion);
      break;
    case "Enter":
      event.preventDefault();
      if (activeSuggestion >= 0) {
        selectSuggestion(activeSuggestion);
      }
      break;
    case "Escape":
      clearSuggestions();
      break;
  }
}

if (searchInput) {
  searchInput.addEventListener("input", onInput);
  searchInput.addEventListener("keydown", onKeyDown);
  // Délai sur le blur pour permettre au clic sur la suggestion de passer avant la fermeture
  searchInput.addEventListener("blur", () => {
    setTimeout(clearSuggestions, 200);
  });
}

// Fermer si on clique ailleurs
document.addEventListener("click", (event) => {
  const target = event.target as HTMLElement;
  if (!target.closest(".search-autocomplete")) {
    clearSuggestions();
  }
});

// --- Fonctions pour l'affichage des sections (Films/Séries populaires) ---

async function fetchHomeSelection(
  type: string,
  containerSelector: string,
  limit: number = 6,
) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  const url = `${BASE_URL}/${type}/popular?api_key=${API_KEY}&language=fr-FR&page=1`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    const items = (data.results || []).slice(0, limit);
    container.innerHTML = items.map(renderCard).join("");
  } catch (error) {
    console.error("Erreur chargement films:", error);
  }
}

// Initialisation des listes de la page d'accueil
fetchHomeSelection("movie", "#films .cards-grid");
fetchHomeSelection("tv", "#series .cards-grid");
