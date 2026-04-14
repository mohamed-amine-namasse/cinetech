"use strict";

interface Suggestion {
  title: string;
  type: string;
  year: string;
  value: string;
}

type TmdbItem = {
  title?: string;
  name?: string;
  media_type?: string;
  release_date?: string;
  first_air_date?: string;
};

const API_KEY: string = "2add3b68b231e4e8373050f53498e68f";
const BASE_URL: string = "https://api.themoviedb.org/3";
const IMAGE_BASE: string = "https://image.tmdb.org/t/p/w500";
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

function formatSuggestion(item: TmdbItem): Suggestion {
  const title = item.title || item.name || "Suggestion";
  const type =
    item.media_type === "movie"
      ? "Film"
      : item.media_type === "tv"
        ? "Série"
        : item.media_type === "person"
          ? "Star"
          : "Résultat";
  const year = item.release_date || item.first_air_date || "";
  const yearText = year ? year.slice(0, 4) : "";

  return {
    title,
    type,
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

function updateSuggestions(items: Suggestion[]): void {
  if (!suggestionsList || !searchInput) return;

  suggestionsList.innerHTML = "";
  if (!items.length) {
    clearSuggestions();
    return;
  }

  currentSuggestions = items;

  items.forEach((suggestion, index) => {
    const item = document.createElement("li");
    item.setAttribute("role", "option");
    item.setAttribute("aria-selected", "false");
    item.innerHTML = `${suggestion.title}<span class="suggestion-type">${suggestion.type}</span>${suggestion.year ? `<span class="suggestion-year">${suggestion.year}</span>` : ""}`;
    item.addEventListener("click", () => {
      selectSuggestion(index);
    });
    suggestionsList.appendChild(item);
  });

  suggestionsList.classList.add("active");
  searchInput.setAttribute("aria-expanded", "true");
}

function selectSuggestion(index: number): void {
  const suggestion = currentSuggestions[index];
  if (!suggestion || !searchInput) return;

  searchInput.value = suggestion.value;
  clearSuggestions();
}

async function fetchTmdbSuggestions(query: string): Promise<void> {
  if (!query || query.length < 2) {
    clearSuggestions();
    return;
  }

  if (!API_KEY || API_KEY === "VOTRE_API_KEY_TMDB") {
    clearSuggestions();
    console.warn("TMDB API key manquante ou invalide.");
    return;
  }

  const url = `${SEARCH_URL}?api_key=${API_KEY}&language=fr-FR&query=${encodeURIComponent(query)}&include_adult=false&page=1`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      clearSuggestions();
      return;
    }

    const data = await response.json();
    const items = (data.results || [])
      .filter((item: TmdbItem) =>
        ["movie", "tv", "person"].includes(item.media_type || ""),
      )
      .slice(0, 8)
      .map(formatSuggestion);

    updateSuggestions(items);
  } catch (error) {
    clearSuggestions();
    console.error("Erreur TMDB:", error);
  }
}

function highlightSuggestion(index: number): void {
  if (!suggestionsList) return;

  const itemNodes = Array.from(suggestionsList.children);
  itemNodes.forEach((node, idx) => {
    if (idx === index) {
      node.classList.add("active");
      node.setAttribute("aria-selected", "true");
      node.scrollIntoView({ block: "nearest" });
    } else {
      node.classList.remove("active");
      node.setAttribute("aria-selected", "false");
    }
  });
}

function onInput(event: Event): void {
  const target = event.target as HTMLInputElement | null;
  const value = target?.value.trim() ?? "";

  if (debounceTimer) {
    window.clearTimeout(debounceTimer);
  }

  debounceTimer = window.setTimeout(() => {
    fetchTmdbSuggestions(value);
  }, 220);
}

function onKeyDown(event: KeyboardEvent): void {
  if (!suggestionsList || !suggestionsList.classList.contains("active")) return;

  const itemCount = suggestionsList.children.length;
  if (!itemCount) return;

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
      } else {
        clearSuggestions();
      }
      break;
    case "Escape":
      clearSuggestions();
      break;
    default:
      break;
  }
}

if (searchInput) {
  searchInput.addEventListener("input", onInput);
  searchInput.addEventListener("keydown", onKeyDown);
  searchInput.addEventListener("blur", () => {
    window.setTimeout(() => {
      clearSuggestions();
    }, 120);
  });
}

document.addEventListener("click", (event: MouseEvent) => {
  const target = event.target as HTMLElement | null;
  if (!target?.closest || !target.closest(".search-autocomplete")) {
    clearSuggestions();
  }
});
