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
// Conteneurs pour les commentaires unifiés
const localCommentFormContainer = document.getElementById("local-comment-form");
const allReviewsContainer = document.getElementById("all-reviews-container");
// --- Paramètres de l'URL ---
const params = new URLSearchParams(window.location.search);
const mediaType = params.get("type") === "tv" ? "tv" : "movie";
const id = params.get("id");
// Clé unique pour stocker les commentaires de ce média spécifique dans le localStorage
const storageKey = `comments_${mediaType}_${id}`;
// Variable globale pour stocker les avis TMDB récupérés
let currentTmdbReviews = [];
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
function getLocalComments() {
    const comments = localStorage.getItem(storageKey);
    return comments ? JSON.parse(comments) : [];
}
// Fonction unifiée pour afficher TOUS les commentaires (Locaux puis TMDB)
function renderAllReviews() {
    if (!allReviewsContainer)
        return;
    const localComments = getLocalComments();
    let html = "";
    // 1. On affiche d'abord les commentaires locaux (Cinetech)
    if (localComments.length > 0) {
        html += localComments
            .map((comment) => `
      <article class="review-card" style="border: 1px solid #ccc; padding: 1rem; margin-bottom: 1rem; border-radius: 8px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
          <strong>${comment.username} <span style="font-size: 0.8em; color: #e50914;">(Utilisateur Cinetech)</span></strong>
          <span style="background: #f1c40f; color: #000; padding: 2px 8px; border-radius: 4px; font-weight: bold;">⭐ ${comment.rating}/10</span>
        </div>
        <p style="font-size: 0.9em; color: #666; margin-bottom: 0.5rem;">Le ${comment.date}</p>
        <p>${comment.text}</p>
      </article>
    `)
            .join("");
    }
    // 2. On affiche ensuite les commentaires de l'API TMDB
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
    // S'il n'y a aucun commentaire (ni local, ni TMDB)
    if (html === "") {
        html =
            "<p>Aucun commentaire disponible pour ce titre. Soyez le premier à donner votre avis !</p>";
    }
    allReviewsContainer.innerHTML = html;
}
// Fonction qui ne gère QUE le formulaire
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
                username: currentUsername,
                rating: Number(ratingInput.value),
                text: textInput.value,
                date: new Date().toLocaleDateString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                }),
            };
            const existingComments = getLocalComments();
            existingComments.unshift(newComment);
            localStorage.setItem(storageKey, JSON.stringify(existingComments));
            // On vide le formulaire après soumission
            ratingInput.value = "";
            textInput.value = "";
            // On rafraîchit TOUTE LA LISTE des commentaires
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
        // --- NOUVEAUTÉ : Initialisation des commentaires ---
        // On sauvegarde les commentaires TMDB dans notre variable globale
        currentTmdbReviews = reviews.results || [];
        // On initialise le formulaire
        initLocalComments();
        // On affiche la liste unifiée (Locaux + TMDB)
        renderAllReviews();
    }
    catch (error) {
        console.error("Erreur:", error);
    }
}
loadDetails();
// Réagit automatiquement quand on clique sur "Se connecter" ou "Se déconnecter" dans la navbar
window.addEventListener("authStateChanged", initLocalComments);
