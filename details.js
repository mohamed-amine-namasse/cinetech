"use strict";
// --- Sélection des éléments du DOM ---
const detailPoster = document.getElementById("detail-poster");
const detailKind = document.getElementById("detail-kind");
const detailTitle = document.getElementById("detail-title");
const detailSubtitle = document.getElementById("detail-subtitle");
const detailTags = document.getElementById("detail-tags");
const detailOverview = document.getElementById("detail-overview");
const detailExtra = document.getElementById("detail-extra");
const castList = document.getElementById("cast-list");
const similarGrid = document.getElementById("similar-grid");
// Conteneurs pour les commentaires et boutons
const localCommentFormContainer = document.getElementById("local-comment-form");
const allReviewsContainer = document.getElementById("all-reviews-container");
const btnFavorite = document.getElementById("btn-favorite");
// --- Paramètres de l'URL ---
const params = new URLSearchParams(window.location.search);
const mediaType = params.get("type") === "tv" ? "tv" : "movie";
const id = params.get("id");
// Clé unique pour stocker les commentaires de ce média spécifique
const storageKey = `comments_${mediaType}_${id}`;
// Variables globales pour stocker les données du média en cours
let currentTmdbReviews = [];
let currentMediaDetail = null; // <-- Pour sauvegarder les infos pour les favoris
// --- Fonctions Utilitaires ---
function createTag(text) {
    return `<span class="chip">${text}</span>`;
}
function buildPoster(path) {
    if (!path) {
        return "https://via.placeholder.com/500x750?text=Pas+d'affiche";
    }
    // @ts-ignore : IMAGE_BASE est défini dans config.js
    return `${IMAGE_BASE}${path}`;
}
function getYear(value) {
    return value ? value.slice(0, 4) : "";
}
function getDirector(credits) {
    return (credits.crew?.find((member) => member.job === "Director")?.name ||
        credits.crew?.find((member) => member.job === "Créateur")?.name ||
        "Inconnu");
}
// --- Fonctions de Rendu (Affichage) ---
function renderCast(cast) {
    if (!cast?.length)
        return "<p>Aucun acteur trouvé.</p>";
    return cast
        .slice(0, 8)
        .map((member) => `
    <article class="cast-card">
      <p class="cast-name">${member.name}</p>
      <p class="cast-role">${member.character || member.job || "Rôle inconnu"}</p>
    </article>
  `)
        .join("");
}
function renderSimilar(items) {
    if (!items?.length)
        return "<p>Aucune suggestion similaire.</p>";
    return items
        .slice(0, 6)
        .map((item) => {
        const title = item.title || item.name || "Titre inconnu";
        // @ts-ignore
        const poster = item.poster_path
            ? `${IMAGE_BASE}${item.poster_path}`
            : "https://via.placeholder.com/300x450?text=Pas+d'affiche";
        return `
      <article class="card card-small">
        <a href="./details.html?type=${mediaType}&id=${item.id}">
          <div class="card-image" style="background-image:url('${poster}')"></div>
          <div class="card-body">
            <h3>${title}</h3>
          </div>
        </a>
      </article>
    `;
    })
        .join("");
}
// Récupère la clé de sauvegarde spécifique à l'utilisateur
function getFavoritesStorageKey() {
    const username = localStorage.getItem("username");
    return username ? `favorites_${username}` : "favorites_anonymous";
}
function getFavorites() {
    const key = getFavoritesStorageKey();
    const favs = localStorage.getItem(key);
    return favs ? JSON.parse(favs) : [];
}
function isCurrentlyFavorite() {
    if (!id)
        return false;
    const favs = getFavorites();
    return favs.some((fav) => fav.id === id && fav.type === mediaType);
}
function updateFavoriteButtonUI() {
    if (!btnFavorite)
        return;
    const hasToken = localStorage.getItem("user_token") !== null;
    // Si pas connecté, on cache le bouton
    if (!hasToken) {
        btnFavorite.style.display = "none";
        return;
    }
    // Sinon on l'affiche et on ajuste le style selon s'il est favori ou non
    btnFavorite.style.display = "inline-block";
    btnFavorite.style.width = "200px";
    if (isCurrentlyFavorite()) {
        btnFavorite.innerHTML = `<i class="fa fa-heart"></i> Retirer des favoris`;
        btnFavorite.style.backgroundColor = "#555"; // Gris foncé quand c'est déjà ajouté
        btnFavorite.style.color = "white";
    }
    else {
        btnFavorite.innerHTML = `<i class="fa fa-heart-o"></i> Ajouter aux favoris`;
        btnFavorite.style.backgroundColor = "#e50914"; // Rouge Cinetech
        btnFavorite.style.color = "white";
    }
}
function toggleFavorite() {
    if (!id || !currentMediaDetail)
        return;
    const key = getFavoritesStorageKey();
    let favs = getFavorites();
    if (isCurrentlyFavorite()) {
        // Si c'est déjà un favori, on le retire
        favs = favs.filter((fav) => !(fav.id === id && fav.type === mediaType));
    }
    else {
        // Sinon on l'ajoute
        const title = currentMediaDetail.title || currentMediaDetail.name || "Titre inconnu";
        favs.push({
            id: id,
            type: mediaType,
            title: title,
            poster_path: currentMediaDetail.poster_path,
        });
    }
    // On sauvegarde et on met à jour l'interface
    localStorage.setItem(key, JSON.stringify(favs));
    updateFavoriteButtonUI();
}
// Écouteur d'événement pour le clic sur le bouton Favoris
if (btnFavorite) {
    btnFavorite.addEventListener("click", toggleFavorite);
}
function getLocalComments() {
    const commentsStr = localStorage.getItem(storageKey);
    if (!commentsStr)
        return [];
    let parsedComments = JSON.parse(commentsStr);
    let needsSave = false;
    const fixedComments = parsedComments.map((c) => {
        if (!c.id || !c.replies) {
            needsSave = true;
            return {
                ...c,
                id: c.id || Math.random().toString(36).substr(2, 9),
                replies: c.replies || [],
            };
        }
        return c;
    });
    if (needsSave) {
        localStorage.setItem(storageKey, JSON.stringify(fixedComments));
    }
    return fixedComments;
}
function renderAllReviews() {
    if (!allReviewsContainer)
        return;
    const localComments = getLocalComments();
    const hasToken = localStorage.getItem("user_token") !== null;
    let html = "";
    if (localComments.length > 0) {
        html += localComments
            .map((comment) => {
            let repliesHtml = "";
            if (comment.replies && comment.replies.length > 0) {
                repliesHtml = `<div style="margin-top: 1rem; padding-left: 1.5rem; border-left: 2px solid #e50914;">`;
                repliesHtml += comment.replies
                    .map((reply) => `
          <div style="margin-bottom: 0.8rem; background: #fff; padding: 0.8rem; border-radius: 6px; border: 1px solid #ddd;">
            <strong style="color: #333; font-size: 0.9em;">${reply.username}</strong>
            <span style="font-size: 0.8em; color: #888; margin-left: 10px;">Le ${reply.date}</span>
            <p style="margin-top: 0.4rem; font-size: 0.95em; color: #444;">${reply.text}</p>
          </div>
        `)
                    .join("");
                repliesHtml += `</div>`;
            }
            const replyActionHtml = hasToken
                ? `
        <button class="btn-toggle-reply" data-id="${comment.id}" style="background: none; border: none; color: #e50914; font-weight: bold; cursor: pointer; padding: 0; margin-top: 0.5rem;">
          <i class="fa fa-reply"></i> Répondre
        </button>
        <div id="reply-form-container-${comment.id}" style="display: none; margin-top: 1rem; padding-left: 1.5rem;">
          <textarea id="reply-input-${comment.id}" placeholder="Votre réponse..." rows="2" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;"></textarea>
          <div style="margin-top: 5px;">
            <button class="btn btn-submit-reply" data-id="${comment.id}" style="padding: 5px 10px; font-size: 0.8em;">Envoyer</button>
            <button class="btn-cancel-reply" data-id="${comment.id}" style="background: none; border: none; color: #666; cursor: pointer; font-size: 0.8em; margin-left: 10px;">Annuler</button>
          </div>
        </div>
      `
                : "";
            return `
      <article class="review-card" style="border: 1px solid #e50914; padding: 1rem; margin-bottom: 1rem; border-radius: 8px; background: rgba(229, 9, 20, 0.03);">
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
          <strong>${comment.username} <span style="font-size: 0.8em; color: #e50914;">(Utilisateur Cinetech)</span></strong>
          <span style="background: #f1c40f; color: #000; padding: 2px 8px; border-radius: 4px; font-weight: bold;">⭐ ${comment.rating}/10</span>
        </div>
        <p style="font-size: 0.9em; color: #666; margin-bottom: 0.5rem;">Le ${comment.date}</p>
        <p style="margin-bottom: 0.5rem;">${comment.text}</p>
        ${replyActionHtml}
        ${repliesHtml}
      </article>
      `;
        })
            .join("");
    }
    if (currentTmdbReviews && currentTmdbReviews.length > 0) {
        html += currentTmdbReviews
            .slice(0, 5)
            .map((review) => {
            const rating = review.author_details?.rating
                ? `${review.author_details.rating}/10`
                : "Non noté";
            const date = new Date(review.created_at).toLocaleDateString("fr-FR");
            return `
      <article class="review-card" style="border: 1px solid #ccc; padding: 1rem; margin-bottom: 1rem; border-radius: 8px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
          <strong>${review.author} <span style="font-size: 0.8em; color: #888;">(Avis TMDB)</span></strong>
          <span style="background: #f1c40f; color: #000; padding: 2px 8px; border-radius: 4px; font-weight: bold;">⭐ ${rating}</span>
        </div>
        <p style="font-size: 0.9em; color: #666; margin-bottom: 0.5rem;">Le ${date}</p>
        <p>${review.content.substring(0, 300)}${review.content.length > 300 ? "..." : ""}</p>
      </article>
      `;
        })
            .join("");
    }
    if (html === "") {
        html = "<p>Aucun commentaire disponible.</p>";
    }
    allReviewsContainer.innerHTML = html;
    attachReplyEvents();
}
function attachReplyEvents() {
    document.querySelectorAll(".btn-toggle-reply").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            const id = e.currentTarget.getAttribute("data-id");
            const formContainer = document.getElementById(`reply-form-container-${id}`);
            if (formContainer)
                formContainer.style.display = "block";
        });
    });
    document.querySelectorAll(".btn-cancel-reply").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            const id = e.currentTarget.getAttribute("data-id");
            const formContainer = document.getElementById(`reply-form-container-${id}`);
            if (formContainer)
                formContainer.style.display = "none";
        });
    });
    document.querySelectorAll(".btn-submit-reply").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            const id = e.currentTarget.getAttribute("data-id");
            const inputEl = document.getElementById(`reply-input-${id}`);
            const text = inputEl.value.trim();
            if (!text)
                return;
            const currentUsername = localStorage.getItem("username") || "Utilisateur";
            const newReply = {
                username: currentUsername,
                text: text,
                date: new Date().toLocaleDateString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                }),
            };
            const comments = getLocalComments();
            const commentIndex = comments.findIndex((c) => c.id === id);
            if (commentIndex !== -1) {
                comments[commentIndex].replies.push(newReply);
                localStorage.setItem(storageKey, JSON.stringify(comments));
                renderAllReviews();
            }
        });
    });
}
function initLocalComments() {
    if (!localCommentFormContainer)
        return;
    const hasToken = localStorage.getItem("user_token") !== null;
    const currentUsername = localStorage.getItem("username") || "Utilisateur anonyme";
    let htmlContent = "";
    if (hasToken) {
        htmlContent = `
      <form id="comment-form" style="display: flex; flex-direction: column; gap: 10px; max-width: 500px; margin-bottom: 2rem; padding: 15px; background-color: #f9f9f9; border-radius: 8px; border: 1px solid #ddd;">
        <div style="display: flex; gap: 10px; align-items: center;">
          <label for="user-rating" style="color: #333;"><strong>Votre note :</strong></label>
          <input type="number" id="user-rating" min="0" max="10" step="1" required style="width: 60px; padding: 5px;" />
          <span style="color: #333;">/ 10</span>
        </div>
        <textarea id="user-comment" placeholder="Écrivez votre commentaire ici en tant que ${currentUsername}..." required rows="4" style="padding: 10px; width: 100%; border: 1px solid #ccc; border-radius: 4px;"></textarea>
        <button type="submit" class="btn" style="align-self: flex-start; padding: 10px 20px; cursor: pointer;">Publier mon avis</button>
      </form>
    `;
    }
    else {
        htmlContent = `
      <div style="background: #eee; padding: 1rem; border-radius: 8px; margin-bottom: 2rem; color: #333; text-align: center;">
        <p>Vous devez être connecté (via le bouton en haut) pour laisser un commentaire et une note.</p>
      </div>
    `;
    }
    localCommentFormContainer.innerHTML = htmlContent;
    if (hasToken) {
        const form = document.getElementById("comment-form");
        form?.addEventListener("submit", (e) => {
            e.preventDefault();
            const ratingInput = document.getElementById("user-rating");
            const textInput = document.getElementById("user-comment");
            const newComment = {
                id: Math.random().toString(36).substr(2, 9),
                username: currentUsername,
                rating: Number(ratingInput.value),
                text: textInput.value,
                date: new Date().toLocaleDateString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                }),
                replies: [],
            };
            const existingComments = getLocalComments();
            existingComments.unshift(newComment);
            localStorage.setItem(storageKey, JSON.stringify(existingComments));
            ratingInput.value = "";
            textInput.value = "";
            renderAllReviews();
        });
    }
}
// --- Fonction Principale de Chargement ---
async function loadDetails() {
    if (!id) {
        document.title = "Erreur | Cinetech";
        if (detailTitle)
            detailTitle.textContent = "Identifiant manquant";
        return;
    }
    // @ts-ignore
    const detailUrl = `${BASE_URL}/${mediaType}/${id}?api_key=${API_KEY}&language=fr-FR`;
    // @ts-ignore
    const creditsUrl = `${BASE_URL}/${mediaType}/${id}/credits?api_key=${API_KEY}&language=fr-FR`;
    // @ts-ignore
    const similarUrl = `${BASE_URL}/${mediaType}/${id}/similar?api_key=${API_KEY}&language=fr-FR&page=1`;
    // @ts-ignore
    const reviewsUrl = `${BASE_URL}/${mediaType}/${id}/reviews?api_key=${API_KEY}`;
    try {
        const [detailRes, creditsRes, similarRes, reviewsRes] = await Promise.all([
            fetch(detailUrl),
            fetch(creditsUrl),
            fetch(similarUrl),
            fetch(reviewsUrl),
        ]);
        if (!detailRes.ok || !creditsRes.ok || !similarRes.ok || !reviewsRes.ok) {
            throw new Error("Erreur TMDB");
        }
        const detail = await detailRes.json();
        currentMediaDetail = detail; // Sauvegarde des informations pour la fonction Favoris
        const credits = await creditsRes.json();
        const similar = await similarRes.json();
        const reviews = await reviewsRes.json();
        const title = detail.title || detail.name || "Titre inconnu";
        const date = detail.release_date || detail.first_air_date || "";
        const year = getYear(date);
        const runtime = detail.runtime || detail.episode_run_time?.[0] || 0;
        const genres = (detail.genres || [])
            .map((genre) => genre.name)
            .join(" • ");
        const countries = (detail.production_countries ||
            detail.origin_country ||
            [])
            .map((c) => c.name || c)
            .join(", ");
        const ratingValue = detail.vote_average || 0;
        const ratingDisplay = ratingValue > 0 ? `⭐ ${ratingValue.toFixed(1)}/10` : "";
        const director = mediaType === "movie"
            ? getDirector(credits)
            : detail.created_by?.map((creator) => creator.name).join(", ") ||
                "Inconnu";
        document.title = `${title} | Cinetech`;
        if (detailPoster)
            detailPoster.style.backgroundImage = `url('${buildPoster(detail.poster_path || detail.backdrop_path)}')`;
        if (detailKind)
            detailKind.textContent = mediaType === "movie" ? "Film" : "Série";
        if (detailTitle)
            detailTitle.textContent = title;
        if (detailSubtitle)
            detailSubtitle.textContent =
                (detail.original_title || detail.original_name) !== title
                    ? detail.original_title || detail.original_name
                    : "";
        if (detailTags) {
            detailTags.innerHTML = [
                genres && createTag(genres),
                year && createTag(year),
                countries && createTag(countries),
                ratingDisplay && createTag(ratingDisplay),
            ]
                .filter(Boolean)
                .join("");
        }
        if (detailOverview)
            detailOverview.textContent =
                detail.overview || "Aucun résumé disponible.";
        if (detailExtra)
            detailExtra.innerHTML = `
      <div class="info-row"><strong>Réalisateur / Créateur :</strong> ${director}</div>
      <div class="info-row"><strong>Durée :</strong> ${runtime ? `${runtime} min` : "N/A"}</div>
      <div class="info-row"><strong>Popularité :</strong> ${Math.round(detail.popularity || 0)}</div>
    `;
        if (castList)
            castList.innerHTML = renderCast(credits.cast || []);
        if (similarGrid)
            similarGrid.innerHTML = renderSimilar(similar.results || []);
        currentTmdbReviews = reviews.results || [];
        // On initialise l'UI des boutons et commentaires
        updateFavoriteButtonUI();
        initLocalComments();
        renderAllReviews();
    }
    catch (error) {
        console.error("Erreur:", error);
    }
}
loadDetails();
// Réagit automatiquement quand on clique sur "Se connecter" ou "Se déconnecter" dans la navbar
window.addEventListener("authStateChanged", () => {
    initLocalComments();
    updateFavoriteButtonUI(); // Met à jour le bouton favoris sans recharger la page
});
