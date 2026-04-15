"use strict";

// On définit l'interface pour les commentaires locaux
interface LocalComment {
  id: number;
  media_id: string;
  text: string;
  author: string;
  date: string;
  parent_id: number | null;
}

const detailPoster: HTMLElement | null =
  document.getElementById("detail-poster");
const detailKind: HTMLElement | null = document.getElementById("detail-kind");
const detailTitle: HTMLElement | null = document.getElementById("detail-title");
const detailSubtitle: HTMLElement | null =
  document.getElementById("detail-subtitle");
const detailTags: HTMLElement | null = document.getElementById("detail-tags");
const detailOverview: HTMLElement | null =
  document.getElementById("detail-overview");
const detailExtra: HTMLElement | null = document.getElementById("detail-extra");
const castList: HTMLElement | null = document.getElementById("cast-list");
const similarGrid: HTMLElement | null = document.getElementById("similar-grid");

const params: URLSearchParams = new URLSearchParams(window.location.search);
const mediaType: string = params.get("type") === "tv" ? "tv" : "movie";
const id: string | null = params.get("id");

function createTag(text: string): string {
  return `<span class="chip">${text}</span>`;
}

function buildPoster(path: string | null): string {
  if (!path) return "https://via.placeholder.com/500x750?text=Pas+d'affiche";
  return `${IMAGE_BASE}${path}`;
}

function getYear(value: string | undefined): string {
  return value ? value.slice(0, 4) : "";
}

function getDirector(credits: any): string {
  return (
    credits.crew?.find((member: any) => member.job === "Director")?.name ||
    credits.crew?.find((member: any) => member.job === "Créateur")?.name ||
    "Inconnu"
  );
}

function renderCast(cast: any[]): string {
  if (!cast?.length) return "<p>Aucun acteur trouvé.</p>";
  return cast
    .slice(0, 8)
    .map(
      (member: any) => `
    <article class="cast-card">
      <p class="cast-name">${member.name}</p>
      <p class="cast-role">${member.character || member.job || "Rôle inconnu"}</p>
    </article>
  `,
    )
    .join("");
}

function renderSimilar(items: any[]): string {
  if (!items?.length) return "<p>Aucune suggestion similaire.</p>";
  return items
    .slice(0, 6)
    .map((item: any) => {
      const title: string = item.title || item.name || "Titre inconnu";
      const poster: string = item.poster_path
        ? `${IMAGE_BASE}${item.poster_path}`
        : "https://via.placeholder.com/300x450?text=Pas+d'affiche";
      return `
      <article class="card card-small">
        <a href="./details.html?type=${mediaType}&id=${item.id}">
          <div class="card-image" style="background-image:url('${poster}')"></div>
          <div class="card-body"><h3>${title}</h3></div>
        </a>
      </article>
    `;
    })
    .join("");
}

// --- 1. COMMENTAIRES TMDB ---
async function fetchTMDBReviews(mediaType: string, id: string) {
  const url = `${BASE_URL}/${mediaType}/${id}/reviews?api_key=${API_KEY}&language=en-US`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    const reviews = data.results || [];
    const container = document.getElementById("tmdb-reviews");
    if (!container) return;
    if (reviews.length === 0) {
      container.innerHTML = "<p>Aucun commentaire TMDB.</p>";
      return;
    }
    container.innerHTML = reviews
      .slice(0, 3)
      .map(
        (r: any) => `
      <div class="review-card" style="border: 1px solid #ddd; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
        <h4>${r.author}</h4>
        <p style="font-size: 0.85rem; color: #666;">${r.content.substring(0, 200)}...</p>
      </div>
    `,
      )
      .join("");
  } catch (e) {
    console.error(e);
  }
}

// --- 2. FAVORIS (LocalStorage) ---
function setupFavoriteButton(
  mediaId: string,
  mediaType: string,
  mediaTitle: string,
  posterPath: string,
) {
  const token = localStorage.getItem("token");
  const container = document.getElementById("favorite-action");
  if (!token || !container) return;

  const updateUI = () => {
    const favs = JSON.parse(localStorage.getItem("favorites") || "[]");
    const isFav = favs.some(
      (f: any) => f.id === mediaId && f.type === mediaType,
    );

    container.innerHTML = `<button id="btn-fav" class="btn ${isFav ? "btn-outline" : ""}" style="margin-top:1rem">
      ${isFav ? "💔 Retirer des favoris" : "❤️ Ajouter aux favoris"}
    </button>`;

    document.getElementById("btn-fav")?.addEventListener("click", () => {
      let current = JSON.parse(localStorage.getItem("favorites") || "[]");
      if (isFav) {
        current = current.filter(
          (f: any) => !(f.id === mediaId && f.type === mediaType),
        );
      } else {
        current.push({
          id: mediaId,
          type: mediaType,
          title: mediaTitle,
          poster: posterPath,
        });
      }
      localStorage.setItem("favorites", JSON.stringify(current));
      updateUI();
    });
  };
  updateUI();
}

// --- 3. COMMENTAIRES LOCAUX AVEC TYPAGE ---
function displayLocalComments(mediaId: string) {
  const container = document.getElementById("local-comments-list");
  if (!container) return;

  // On type le tableau récupéré
  const all: LocalComment[] = JSON.parse(
    localStorage.getItem("local_comments") || "[]",
  );
  const mine = all.filter((c) => c.media_id === mediaId);
  const isConnected = !!localStorage.getItem("token");

  const parents = mine.filter((c) => c.parent_id === null);
  const replies = mine.filter((c) => c.parent_id !== null);

  container.innerHTML = parents
    .map((p) => {
      const childs = replies.filter((r) => r.parent_id === p.id);
      return `
      <div style="background:#f4f4f4; padding:1rem; border-radius:8px; margin-bottom:1rem;">
        <strong>${p.author}</strong> <small>${p.date}</small>
        <p>${p.text}</p>
        ${childs
          .map(
            (c: LocalComment) => `
          <div style="margin-left:2rem; border-left:2px solid #ccc; padding-left:1rem; margin-top:0.5rem;">
            <strong>${c.author}</strong>: ${c.text}
          </div>
        `,
          )
          .join("")}
        ${isConnected ? `<button class="btn-reply" data-id="${p.id}" style="background:none; border:none; color:blue; cursor:pointer; font-size:0.8rem; margin-top:0.5rem;">Répondre</button>` : ""}
        <div id="form-${p.id}" style="display:none; margin-top:0.5rem;">
          <input type="text" id="input-${p.id}" placeholder="Votre réponse..." style="padding:5px; border-radius:4px; border:1px solid #ccc;">
          <button class="btn-send-reply btn" data-id="${p.id}" style="padding:4px 10px; font-size:0.8rem;">OK</button>
        </div>
      </div>
    `;
    })
    .join("");

  attachCommentEvents(mediaId);
}

function attachCommentEvents(mediaId: string) {
  document.querySelectorAll(".btn-reply").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const pid = (e.target as HTMLElement).dataset.id;
      const f = document.getElementById(`form-${pid}`);
      if (f) f.style.display = "block";
    });
  });

  document.querySelectorAll(".btn-send-reply").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const pid = (e.target as HTMLElement).dataset.id;
      const input = document.getElementById(`input-${pid}`) as HTMLInputElement;
      const txt = input.value;
      if (!txt) return;

      const all: LocalComment[] = JSON.parse(
        localStorage.getItem("local_comments") || "[]",
      );
      all.push({
        id: Date.now(),
        media_id: mediaId,
        text: txt,
        author: "Utilisateur",
        date: new Date().toLocaleDateString(),
        parent_id: Number(pid),
      });
      localStorage.setItem("local_comments", JSON.stringify(all));
      displayLocalComments(mediaId);
    });
  });
}

async function loadDetails(): Promise<void> {
  if (!id) return;

  const detailUrl = `${BASE_URL}/${mediaType}/${id}?api_key=${API_KEY}&language=fr-FR`;
  const creditsUrl = `${BASE_URL}/${mediaType}/${id}/credits?api_key=${API_KEY}&language=fr-FR`;
  const similarUrl = `${BASE_URL}/${mediaType}/${id}/similar?api_key=${API_KEY}&language=fr-FR&page=1`;

  try {
    const [dRes, cRes, sRes] = await Promise.all([
      fetch(detailUrl),
      fetch(creditsUrl),
      fetch(similarUrl),
    ]);
    const detail = await dRes.json();
    const credits = await cRes.json();
    const similar = await sRes.json();

    const title = detail.title || detail.name || "Inconnu";

    if (detailPoster)
      detailPoster.style.backgroundImage = `url('${buildPoster(detail.poster_path)}')`;
    if (detailTitle) detailTitle.textContent = title;
    if (detailOverview) detailOverview.textContent = detail.overview;
    if (castList) castList.innerHTML = renderCast(credits.cast);
    if (similarGrid) similarGrid.innerHTML = renderSimilar(similar.results);

    setupFavoriteButton(id, mediaType, title, detail.poster_path);
    fetchTMDBReviews(mediaType, id);
    displayLocalComments(id);
  } catch (err) {
    console.error(err);
  }
}

loadDetails();
