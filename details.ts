"use strict";

/**
 * INTERFACES
 */
interface LocalComment {
  id: number;
  media_id: string;
  text: string;
  author: string;
  date: string;
  parent_id: number | null;
}

/**
 * SÉLECTEURS DOM
 */
const detailPoster = document.getElementById(
  "detail-poster",
) as HTMLElement | null;
const detailKind = document.getElementById("detail-kind") as HTMLElement | null;
const detailTitle = document.getElementById(
  "detail-title",
) as HTMLElement | null;
const detailSubtitle = document.getElementById(
  "detail-subtitle",
) as HTMLElement | null;
const detailTags = document.getElementById("detail-tags") as HTMLElement | null;
const detailOverview = document.getElementById(
  "detail-overview",
) as HTMLElement | null;
const detailExtra = document.getElementById(
  "detail-extra",
) as HTMLElement | null;
const castList = document.getElementById("cast-list") as HTMLElement | null;
const similarGrid = document.getElementById(
  "similar-grid",
) as HTMLElement | null;

/**
 * PARAMÈTRES D'URL
 */
const params = new URLSearchParams(window.location.search);
const mediaType = params.get("type") === "tv" ? "tv" : "movie";
const id = params.get("id");

// Vérifie si l'utilisateur est connecté (clé "token" mise par index.ts)
const isUserConnected = !!localStorage.getItem("token");

/**
 * FONCTIONS UTILITAIRES
 */
function createTag(text: string): string {
  return `<span class="chip">${text}</span>`;
}

function buildPoster(path: string | null): string {
  if (!path) return "https://via.placeholder.com/500x750?text=Pas+d'affiche";
  return `${IMAGE_BASE}${path}`;
}

/**
 * RENDU DES COMPOSANTS
 */
function renderCast(cast: any[]): string {
  if (!cast || cast.length === 0) return "<p>Aucun acteur trouvé.</p>";
  return cast
    .slice(0, 8)
    .map(
      (member: any) => `
    <article class="cast-card">
      <p class="cast-name">${member.name}</p>
      <p class="cast-role">${member.character || "Rôle inconnu"}</p>
    </article>
  `,
    )
    .join("");
}

function renderSimilar(items: any[]): string {
  if (!items || items.length === 0)
    return "<p>Aucune suggestion similaire.</p>";
  return items
    .slice(0, 6)
    .map((item: any) => {
      const title = item.title || item.name || "Inconnu";
      const poster = item.poster_path
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

/**
 * GESTION DES FAVORIS (LocalStorage)
 */
function setupFavoriteButton(
  mediaId: string,
  type: string,
  title: string,
  poster: string,
) {
  const container = document.getElementById("favorite-action");
  if (!container || !isUserConnected) return;

  const updateUI = () => {
    const favs = JSON.parse(localStorage.getItem("favorites") || "[]");
    const isFav = favs.some((f: any) => f.id === mediaId && f.type === type);

    container.innerHTML = `
      <button id="btn-fav" class="btn ${isFav ? "btn-outline" : ""}" style="margin-top:1rem">
        ${isFav ? "💔 Retirer des favoris" : "❤️ Ajouter aux favoris"}
      </button>
    `;

    document.getElementById("btn-fav")?.addEventListener("click", () => {
      let current = JSON.parse(localStorage.getItem("favorites") || "[]");
      if (isFav) {
        current = current.filter(
          (f: any) => !(f.id === mediaId && f.type === type),
        );
      } else {
        current.push({ id: mediaId, type: type, title: title, poster: poster });
      }
      localStorage.setItem("favorites", JSON.stringify(current));
      updateUI();
    });
  };
  updateUI();
}

/**
 * GESTION DES COMMENTAIRES (LocalStorage Pur Front)
 */
function displayLocalComments(mediaId: string) {
  const container = document.getElementById("local-comments-list");
  if (!container) return;

  const all: LocalComment[] = JSON.parse(
    localStorage.getItem("local_comments") || "[]",
  );
  const filtered = all.filter((c) => c.media_id === mediaId);

  const parents = filtered.filter((c) => c.parent_id === null);
  const replies = filtered.filter((c) => c.parent_id !== null);

  if (parents.length === 0) {
    container.innerHTML = "<p>Aucun commentaire pour le moment.</p>";
  } else {
    container.innerHTML = parents
      .map((p) => {
        const childs = replies.filter((r) => r.parent_id === p.id);
        return `
        <div class="comment-block" style="background:#f9f9f9; padding:1rem; border-radius:8px; margin-bottom:1rem; border:1px solid #ddd;">
          <strong>${p.author}</strong> <small style="color:#999;">le ${p.date}</small>
          <p style="margin: 0.5rem 0;">${p.text}</p>
          
          <div class="replies-container">
            ${childs
              .map(
                (c: LocalComment) => `
              <div style="margin-left:2rem; border-left:2px solid #ccc; padding-left:1rem; margin-top:0.5rem; font-size:0.9rem;">
                <strong>${c.author}</strong>: ${c.text}
              </div>
            `,
              )
              .join("")}
          </div>

          ${
            isUserConnected
              ? `
            <button class="btn-reply" data-id="${p.id}" style="background:none; border:none; color:var(--green); cursor:pointer; font-size:0.8rem; padding:0; margin-top:0.5rem;">Répondre</button>
            <div id="form-${p.id}" style="display:none; margin-top:0.5rem;">
              <input type="text" id="input-${p.id}" placeholder="Votre réponse..." style="width:70%; padding:5px;">
              <button class="btn-send-reply btn" data-id="${p.id}" style="padding:5px 10px; font-size:0.7rem;">OK</button>
            </div>
          `
              : ""
          }
        </div>
      `;
      })
      .join("");
  }

  attachCommentEvents(mediaId);
}

function attachCommentEvents(mediaId: string) {
  // Gestion du formulaire principal (si l'utilisateur est connecté)
  const btnMainComment = document.getElementById("btn-submit-comment");
  if (btnMainComment && !btnMainComment.dataset.listener) {
    btnMainComment.dataset.listener = "true";
    btnMainComment.addEventListener("click", () => {
      const input = document.getElementById(
        "comment-text",
      ) as HTMLTextAreaElement;
      if (!input.value.trim()) return;

      const all: LocalComment[] = JSON.parse(
        localStorage.getItem("local_comments") || "[]",
      );
      all.push({
        id: Date.now(),
        media_id: mediaId,
        text: input.value,
        author: "Moi",
        date: new Date().toLocaleDateString("fr-FR"),
        parent_id: null,
      });
      localStorage.setItem("local_comments", JSON.stringify(all));
      input.value = "";
      displayLocalComments(mediaId);
    });
  }

  // Afficher le champ réponse
  document.querySelectorAll(".btn-reply").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const pid = (e.target as HTMLElement).dataset.id;
      const f = document.getElementById(`form-${pid}`);
      if (f) f.style.display = "block";
    });
  });

  // Envoyer une réponse
  document.querySelectorAll(".btn-send-reply").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const pid = (e.target as HTMLElement).dataset.id;
      const input = document.getElementById(`input-${pid}`) as HTMLInputElement;
      if (!input.value.trim()) return;

      const all: LocalComment[] = JSON.parse(
        localStorage.getItem("local_comments") || "[]",
      );
      all.push({
        id: Date.now(),
        media_id: mediaId,
        text: input.value,
        author: "Moi",
        date: new Date().toLocaleDateString("fr-FR"),
        parent_id: Number(pid),
      });
      localStorage.setItem("local_comments", JSON.stringify(all));
      displayLocalComments(mediaId);
    });
  });
}

function setupCommentFormUI() {
  const formContainer = document.getElementById("local-comment-form");
  if (!formContainer) return;

  if (isUserConnected) {
    formContainer.innerHTML = `
      <div style="margin-top: 2rem; border-top: 1px solid #eee; padding-top: 1rem;">
        <h3>Laisser un commentaire</h3>
        <textarea id="comment-text" placeholder="Qu'avez-vous pensé de ce titre ?" rows="3" style="width: 100%; margin: 10px 0; padding: 10px; border-radius: 8px; border: 1px solid #ccc;"></textarea>
        <button id="btn-submit-comment" class="btn">Publier le commentaire</button>
      </div>
    `;
  } else {
    formContainer.innerHTML = `
      <p style="background: #f0f0f0; padding: 1rem; border-radius: 8px; text-align: center; margin-top: 2rem;">
        Veuillez vous <strong>connecter</strong> pour laisser un commentaire ou répondre.
      </p>
    `;
  }
}

/**
 * CHARGEMENT DES DONNÉES TMDB
 */
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
    const year = (detail.release_date || detail.first_air_date || "").slice(
      0,
      4,
    );

    // Remplissage DOM
    if (detailPoster)
      detailPoster.style.backgroundImage = `url('${buildPoster(detail.poster_path)}')`;
    if (detailTitle) detailTitle.textContent = title;
    if (detailOverview)
      detailOverview.textContent =
        detail.overview || "Pas de résumé disponible.";
    if (detailKind)
      detailKind.textContent = mediaType === "movie" ? "Film" : "Série";

    if (detailTags) {
      const genres = detail.genres?.map((g: any) => g.name).join(", ");
      detailTags.innerHTML = `
        ${genres ? createTag(genres) : ""}
        ${year ? createTag(year) : ""}
        ${createTag(detail.vote_average.toFixed(1) + " ★")}
      `;
    }

    if (castList) castList.innerHTML = renderCast(credits.cast);
    if (similarGrid) similarGrid.innerHTML = renderSimilar(similar.results);

    // Initialisation des fonctionnalités LocalStorage
    setupFavoriteButton(id, mediaType, title, detail.poster_path);
    setupCommentFormUI();
    displayLocalComments(id);
  } catch (error) {
    console.error("Erreur de chargement:", error);
    if (detailTitle) detailTitle.textContent = "Erreur de chargement";
  }
}

// Lancement global
loadDetails();
