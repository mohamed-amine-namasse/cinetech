"use strict";
let modalLogin = false;
let token = null;
const btnLogin = document.querySelector(".btn-login");
if (btnLogin) {
    btnLogin.addEventListener("click", function () {
        toggleModale();
        validateConnexion();
    });
}
const disconect = function () {
    window.location.reload();
};
const headerCloser = document.querySelector("header");
if (headerCloser) {
    headerCloser.addEventListener("click", function (e) {
        if (!e.target.closest("button")) {
            modalLogin = false;
            document.querySelector("main").classList.remove("blured");
            const loginModal = document.querySelector(".loginModal");
            if (loginModal)
                loginModal.classList.remove("active");
            document
                .querySelectorAll(".btn-view")
                .forEach((btn) => {
                btn.setAttribute("tabindex", "0");
                btn.classList.add("active");
            });
            document.querySelector("body").classList.remove("fixed");
            document.querySelector("main").classList.remove("invisible");
        }
    });
}
const btnCloseModale = document.querySelector(".close-modal");
if (btnCloseModale) {
    btnCloseModale.addEventListener("click", function () {
        toggleModale();
    });
}
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
// --- Gestion Utilisateurs / Connexion ---
function validateConnexion() {
    const loginInput = document.querySelector(".login");
    const passwordInput = document.querySelector(".password");
    const btnInscription = document.querySelector(".btn-inscription");
    const btnConnexion = document.querySelector(".btn-connection");
    if (loginInput && passwordInput && btnInscription && btnConnexion) {
        if (loginInput.value.length > 2 && passwordInput.value.length > 2) {
            btnConnexion.setAttribute("tabindex", "0");
            btnConnexion.classList.add("active");
            btnInscription.setAttribute("tabindex", "0");
            btnInscription.classList.add("active");
            btnConnexion.addEventListener("click", connection);
            btnInscription.addEventListener("click", inscription);
        }
        else {
            btnConnexion.setAttribute("tabindex", "-1");
            btnConnexion.classList.remove("active");
            btnInscription.setAttribute("tabindex", "-1");
            btnInscription.classList.remove("active");
            btnConnexion.removeEventListener("click", connection);
            btnInscription.removeEventListener("click", inscription);
        }
    }
}
document.addEventListener("keyup", function () {
    validateConnexion();
});
async function inscription() {
    const username = document.querySelector(".login").value;
    const password = document.querySelector(".password").value;
    const response = await fetch("http://localhost:3000/users/sign_up", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            username: username,
            password: password,
        }),
    });
    const data = await response.json();
    if (response.ok) {
        token = data.token;
        toggleModale();
        document.querySelector("header").classList.add("connected");
    }
}
async function connection() {
    const username = document.querySelector(".login").value;
    const password = document.querySelector(".password").value;
    const response = await fetch("http://localhost:3000/users/log_in", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            username: username,
            password: password,
        }),
    });
    const data = await response.json();
    if (response.ok) {
        token = data.token;
        toggleModale();
        document.querySelector("header").classList.add("connected");
        if (data.user === "admin") {
            document.querySelector("header")?.classList.add("adminHeader");
        }
        displayUsers(token);
    }
}
const btnLogout = document.querySelector(".btn-logout");
if (btnLogout) {
    btnLogout.addEventListener("click", function () {
        token = null;
        const header = document.querySelector("header");
        if (header) {
            header.classList.remove("connected");
            header.classList.remove("adminHeader");
        }
        const userGrid = document.querySelector(".user-grid");
        if (userGrid) {
            userGrid.innerHTML = "";
        }
    });
}
function toggleModale() {
    modalLogin = !modalLogin;
    document.querySelector("main").classList.toggle("blured");
    const loginModal = document.querySelector(".loginModal");
    if (loginModal)
        loginModal.classList.toggle("active");
    document.querySelectorAll(".btn-view").forEach((btn) => {
        modalLogin
            ? btn.setAttribute("tabindex", "-1")
            : btn.setAttribute("tabindex", "0");
        btn.classList.toggle("active");
    });
}
const listener = function () {
    document.querySelectorAll(".btnAdmin").forEach((btn) => {
        btn.addEventListener("click", function () {
            promoteAdmin(Number(btn.value), token);
        });
    });
};
async function promoteAdmin(id, token) {
    const response = await fetch("http://localhost:3000/users/" + id, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
        },
    });
    if (response.ok) {
        displayUsers(token);
    }
}
async function displayUsers(token) {
    const response = await fetch("http://localhost:3000/users", {
        method: "GET",
        headers: { Authorization: "Bearer " + token },
    });
    const users = await response.json();
    const userGrid = document.querySelector(".user-grid");
    if (userGrid) {
        userGrid.innerHTML = "<h2>Utilisateurs</h2>";
        if (response.ok) {
            users.response.forEach((user) => {
                const card = document.createElement("article");
                card.classList.add("user-card");
                card.innerHTML = `<button value="${user.id}" class="${user.role} btn active btnAdmin"> ${user.username}${user.role === "admin" ? "<span>👑</span>" : ""} </button>`;
                userGrid.appendChild(card);
            });
            listener();
        }
    }
}
