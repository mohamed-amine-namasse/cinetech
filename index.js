"use strict";
const SEARCH_URL = "https://api.themoviedb.org/3/search/multi";
const searchInput = document.querySelector(".header-search-input");
const suggestionsList = document.querySelector(".search-suggestions");
let activeSuggestion = -1;
let currentSuggestions = [];
let debounceTimer = null;
function formatSuggestion(item) {
    if (item.media_type === "person")
        return null;
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
function clearSuggestions() {
    if (!suggestionsList || !searchInput)
        return;
    suggestionsList.innerHTML = "";
    suggestionsList.classList.remove("active");
    searchInput.setAttribute("aria-expanded", "false");
    activeSuggestion = -1;
    currentSuggestions = [];
}
function updateSuggestions(items) {
    if (!suggestionsList || !searchInput)
        return;
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
        li.addEventListener("click", () => {
            selectSuggestion(index);
        });
        suggestionsList.appendChild(li);
    });
    suggestionsList.classList.add("active");
    searchInput.setAttribute("aria-expanded", "true");
}
function highlightSuggestion(index) {
    if (!suggestionsList)
        return;
    Array.from(suggestionsList.children).forEach((child, i) => {
        child.classList.toggle("focused", i === index);
    });
    if (index >= 0) {
        searchInput?.setAttribute("aria-activedescendant", `suggestion-${index}`);
    }
}
function selectSuggestion(index) {
    const suggestion = currentSuggestions[index];
    if (!suggestion)
        return;
    window.location.href = `./details.html?type=${suggestion.mediaType}&id=${suggestion.id}`;
}
async function fetchTmdbSuggestions(query) {
    if (!query.trim()) {
        clearSuggestions();
        return;
    }
    try {
        const url = `${SEARCH_URL}?api_key=${API_KEY}&query=${encodeURIComponent(query)}&language=fr-FR`;
        const response = await fetch(url);
        const data = await response.json();
        const suggestions = (data.results || [])
            .map(formatSuggestion)
            .filter((item) => item !== null)
            .slice(0, 8);
        updateSuggestions(suggestions);
    }
    catch (error) {
        console.error("Erreur suggestions:", error);
    }
}
function onInput(event) {
    const value = event.target.value;
    if (debounceTimer)
        window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(() => {
        fetchTmdbSuggestions(value);
    }, 250);
}
function onKeyDown(event) {
    if (!suggestionsList || !suggestionsList.classList.contains("active"))
        return;
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
    searchInput.addEventListener("blur", () => {
        setTimeout(clearSuggestions, 200);
    });
}
document.addEventListener("click", (event) => {
    const target = event.target;
    if (!target.closest(".search-autocomplete")) {
        clearSuggestions();
    }
});
// --- GESTION DE L'AFFICHAGE (SWIPER & GRILLES) ---
async function fetchHeroMovies() {
    const wrapper = document.getElementById("hero-wrapper");
    if (!wrapper)
        return;
    const url = `${BASE_URL}/trending/movie/week?api_key=${API_KEY}&language=fr-FR`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        const movies = (data.results || []).slice(0, 5);
        wrapper.innerHTML = movies
            .map((movie) => `
      <div class="swiper-slide" style="background-image: url('https://image.tmdb.org/t/p/original${movie.backdrop_path}')">
      </div>
    `)
            .join("");
        new Swiper(".hero-swiper", {
            effect: "fade",
            loop: true,
            autoplay: {
                delay: 5000,
                disableOnInteraction: false,
            },
            pagination: {
                el: ".swiper-pagination",
                clickable: true,
            },
            navigation: {
                nextEl: ".swiper-button-next",
                prevEl: ".swiper-button-prev",
            },
        });
    }
    catch (error) {
        console.error("Erreur Hero Swiper:", error);
    }
}
fetchHeroMovies();
async function fetchHomeSelection(type, containerSelector, limit = 6) {
    const container = document.querySelector(containerSelector);
    if (!container)
        return;
    const url = `${BASE_URL}/${type}/popular?api_key=${API_KEY}&language=fr-FR&page=1`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        const items = (data.results || []).slice(0, limit);
        container.innerHTML = items.map(renderCard).join("");
    }
    catch (error) {
        console.error("Erreur chargement films:", error);
    }
}
fetchHomeSelection("movie", "#films .cards-grid");
fetchHomeSelection("tv", "#series .cards-grid");
const btnLogin = document.querySelector(".btn-login");
// Fonction pour simuler la connexion
function simulateLogin() {
    const username = prompt("Entrez votre pseudo  :");
    const password = prompt("Entrez votre mot de passe  :");
    if (username && password) {
        localStorage.setItem("user_token", "connected_as_" + username);
        localStorage.setItem("username", username);
        window.location.reload(); // On recharge pour mettre à jour l'affichage
    }
}
// Fonction pour se déconnecter
function simulateLogout() {
    localStorage.removeItem("user_token");
    localStorage.removeItem("username");
    window.location.reload();
}
if (btnLogin) {
    const token = localStorage.getItem("user_token");
    if (token) {
        btnLogin.textContent = "Déconnexion";
        btnLogin.addEventListener("click", simulateLogout);
    }
    else {
        btnLogin.textContent = "Se connecter";
        btnLogin.addEventListener("click", simulateLogin);
    }
}
