"use strict";
const detailPoster = document.getElementById("detail-poster");
const detailKind = document.getElementById("detail-kind");
const detailTitle = document.getElementById("detail-title");
const detailSubtitle = document.getElementById("detail-subtitle");
const detailTags = document.getElementById("detail-tags");
const detailOverview = document.getElementById("detail-overview");
const detailExtra = document.getElementById("detail-extra");
const castList = document.getElementById("cast-list");
const similarGrid = document.getElementById("similar-grid");
const params = new URLSearchParams(window.location.search);
const mediaType = params.get("type") === "tv" ? "tv" : "movie";
const id = params.get("id");
console.log("Details page loaded - Type:", mediaType, "ID:", id);
function createTag(text) {
    return `<span class="chip">${text}</span>`;
}
function buildPoster(path) {
    if (!path) {
        return "https://via.placeholder.com/500x750?text=Pas+d'affiche";
    }
    return `${IMAGE_BASE}${path}`;
}
function getYear(value) {
    return value ? value.slice(0, 4) : "";
}
function getDirector(credits) {
    var _a, _b, _c, _d;
    return (((_b = (_a = credits.crew) === null || _a === void 0 ? void 0 : _a.find((member) => member.job === "Director")) === null || _b === void 0 ? void 0 : _b.name) ||
        ((_d = (_c = credits.crew) === null || _c === void 0 ? void 0 : _c.find((member) => member.job === "Créateur")) === null || _d === void 0 ? void 0 : _d.name) ||
        "Inconnu");
}
function renderCast(cast) {
    if (!(cast === null || cast === void 0 ? void 0 : cast.length))
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
    if (!(items === null || items === void 0 ? void 0 : items.length))
        return "<p>Aucune suggestion similaire.</p>";
    return items
        .slice(0, 6)
        .map((item) => {
        const title = item.title || item.name || "Titre inconnu";
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
async function loadDetails() {
    var _a, _b;
    if (!id) {
        document.title = "Erreur | Cinetech";
        if (detailTitle)
            detailTitle.textContent = "Identifiant manquant";
        if (detailOverview)
            detailOverview.textContent = "Impossible de charger cette fiche.";
        return;
    }
    const detailUrl = `${BASE_URL}/${mediaType}/${id}?api_key=${API_KEY}&language=fr-FR`;
    const creditsUrl = `${BASE_URL}/${mediaType}/${id}/credits?api_key=${API_KEY}&language=fr-FR`;
    const similarUrl = `${BASE_URL}/${mediaType}/${id}/similar?api_key=${API_KEY}&language=fr-FR&page=1`;
    try {
        const [detailRes, creditsRes, similarRes] = await Promise.all([
            fetch(detailUrl),
            fetch(creditsUrl),
            fetch(similarUrl),
        ]);
        if (!detailRes.ok || !creditsRes.ok || !similarRes.ok) {
            throw new Error("Erreur TMDB");
        }
        const detail = await detailRes.json();
        const credits = await creditsRes.json();
        const similar = await similarRes.json();
        const title = detail.title || detail.name || "Titre inconnu";
        const originalTitle = detail.original_title || detail.original_name || "";
        const date = detail.release_date || detail.first_air_date || "";
        const year = getYear(date);
        const runtime = detail.runtime || ((_a = detail.episode_run_time) === null || _a === void 0 ? void 0 : _a[0]) || 0;
        const genres = (detail.genres || [])
            .map((genre) => genre.name)
            .join(" • ");
        const countries = (detail.production_countries ||
            detail.origin_country ||
            [])
            .map((country) => country.name || country)
            .join(", ");
        const director = mediaType === "movie"
            ? getDirector(credits)
            : ((_b = detail.created_by) === null || _b === void 0 ? void 0 : _b.map((creator) => creator.name).join(", ")) ||
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
                originalTitle && originalTitle !== title ? originalTitle : "";
        if (detailTags)
            detailTags.innerHTML = [
                genres && createTag(genres),
                year && createTag(year),
                countries && createTag(countries),
            ]
                .filter(Boolean)
                .join("");
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
    }
    catch (error) {
        console.error("Erreur détail TMDB:", error);
        if (detailTitle)
            detailTitle.textContent = "Impossible de charger la fiche";
        if (detailOverview)
            detailOverview.textContent =
                "Une erreur est survenue lors du chargement des informations.";
    }
}
loadDetails();
