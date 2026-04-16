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
// Nouveaux conteneurs pour les commentaires et avis
const tmdbReviewsContainer = document.getElementById("tmdb-reviews");
const localCommentFormContainer = document.getElementById("local-comment-form");
// --- Paramètres de l'URL ---
const params = new URLSearchParams(window.location.search);
const mediaType = params.get("type") === "tv" ? "tv" : "movie";
const id = params.get("id");
// Clé unique pour stocker les commentaires de ce média spécifique dans le localStorage
const storageKey = `comments_${mediaType}_${id}`;
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
function renderTMDBReviews(reviews) {
    if (!reviews || !reviews.length)
        return "<p>Aucun commentaire TMDB disponible pour le moment.</p>";
    return reviews
        .slice(0, 5)
        .map((review) => {
        const rating = review.author_details?.rating
            ? `${review.author_details.rating}/10`
            : "Non noté";
        const date = new Date(review.created_at).toLocaleDateString("fr-FR");
        return `
      <article class="review-card" style="border: 1px solid #ccc; padding: 1rem; margin-bottom: 1rem; border-radius: 8px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
          <strong>${review.author}</strong>
          <span style="background: #f1c40f; color: #000; padding: 2px 8px; border-radius: 4px; font-weight: bold;">⭐ ${rating}</span>
        </div>
        <p style="font-size: 0.9em; color: #666; margin-bottom: 0.5rem;">Le ${date}</p>
        <p>${review.content.substring(0, 300)}${review.content.length > 300 ? "..." : ""}</p>
      </article>
    `;
    })
        .join("");
}
function getLocalComments() {
    const comments = localStorage.getItem(storageKey);
    return comments ? JSON.parse(comments) : [];
}
function renderLocalCommentsList() {
    const comments = getLocalComments();
    if (comments.length === 0)
        return "<p>Soyez le premier à donner votre avis !</p>";
    return comments
        .map((comment) => `
    <article style="border-left: 4px solid #e50914; padding-left: 1rem; margin-top: 1rem; margin-bottom: 1rem;">
      <div style="display: flex; gap: 10px; align-items: center;">
        <strong>${comment.username}</strong>
        <span style="color: #f1c40f;">⭐ ${comment.rating}/10</span>
      </div>
      <p style="font-size: 0.8em; color: #888;">Le ${comment.date}</p>
      <p style="margin-top: 0.5rem;">${comment.text}</p>
    </article>
  `)
        .join("");
}
function initLocalComments() {
    if (!localCommentFormContainer)
        return;
    // On vérifie le token de index.ts au lieu de isLoggedIn
    const hasToken = localStorage.getItem("user_token") !== null;
    const currentUsername = localStorage.getItem("username") || "Utilisateur anonyme";
    let htmlContent = `<div id="local-comments-list">${renderLocalCommentsList()}</div>`;
    if (hasToken) {
        htmlContent =
            `
      <form id="comment-form" style="display: flex; flex-direction: column; gap: 10px; max-width: 500px; margin-bottom: 2rem;">
        <div style="display: flex; gap: 10px; align-items: center;">
          <label for="user-rating"><strong>Votre note :</strong></label>
          <input type="number" id="user-rating" min="0" max="10" step="1" required style="width: 60px; padding: 5px;" />
          <span>/ 10</span>
        </div>
        <textarea id="user-comment" placeholder="Écrivez votre commentaire ici en tant que ${currentUsername}..." required rows="4" style="padding: 10px; width: 100%;"></textarea>
        <button type="submit" class="btn" style="align-self: flex-start; padding: 10px 20px; cursor: pointer;">Publier mon avis</button>
      </form>
    ` + htmlContent;
    }
    else {
        htmlContent =
            `
      <div style="background: #eee; padding: 1rem; border-radius: 8px; margin-bottom: 2rem; color: #333;">
        <p>Vous devez être connecté (via le bouton en haut) pour laisser un commentaire et une note.</p>
      </div>
    ` + htmlContent;
    }
    localCommentFormContainer.innerHTML = htmlContent;
    if (hasToken) {
        const form = document.getElementById("comment-form");
        form?.addEventListener("submit", (e) => {
            e.preventDefault();
            const ratingInput = document.getElementById("user-rating");
            const textInput = document.getElementById("user-comment");
            const newComment = {
                username: currentUsername, // On utilise le vrai pseudo stocké !
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
            initLocalComments(); // On rafraîchit
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
        // Récupération du score moyen (ex: 7.8)
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
        // Ajout du rating à côté des autres tags
        if (detailTags) {
            detailTags.innerHTML = [
                genres && createTag(genres),
                year && createTag(year),
                countries && createTag(countries),
                ratingDisplay && createTag(ratingDisplay), // Nouveau tag pour la note
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
        if (tmdbReviewsContainer)
            tmdbReviewsContainer.innerHTML = renderTMDBReviews(reviews.results || []);
        initLocalComments();
    }
    catch (error) {
        console.error("Erreur:", error);
    }
}
loadDetails();
// Réagit automatiquement quand on clique sur "Se connecter" ou "Se déconnecter" dans la navbar
window.addEventListener("authStateChanged", initLocalComments);
