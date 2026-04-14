const listGrid = document.getElementById("list-grid");
const pagination = document.getElementById("pagination");
const type = document.body.dataset.listType || "movie";
const pageParam = Number(
  new URLSearchParams(window.location.search).get("page") || "1",
);
let currentPage = pageParam >= 1 ? pageParam : 1;

function getEndpoint() {
  return type === "tv" ? "tv/popular" : "movie/popular";
}

function getTitle() {
  return type === "tv" ? "Séries populaires" : "Films populaires";
}

function renderCard(item) {
  const title = item.title || item.name || "Titre inconnu";
  const date = item.release_date || item.first_air_date || "";
  const year = date ? date.slice(0, 4) : "";
  const poster = item.poster_path
    ? `${IMAGE_BASE}${item.poster_path}`
    : "https://via.placeholder.com/300x450?text=Pas+d'affiche";
  return `
    <article class="card">
      <a href="./details.html?type=${type}&id=${item.id}">
        <div class="card-image" style="background-image:url('${poster}')"></div>
        <div class="card-body">
          <h3>${title}</h3>
          <p class="card-meta">${year} • ${type === "tv" ? "Série" : "Film"}</p>
        </div>
      </a>
    </article>
  `;
}

function renderPagination(page, totalPages) {
  if (!pagination) return;
  const previousDisabled = page <= 1 ? "disabled" : "";
  const nextDisabled = page >= totalPages ? "disabled" : "";
  pagination.innerHTML = `
    <button ${previousDisabled} data-action="prev">Précédent</button>
    <span>Page ${page} sur ${totalPages}</span>
    <button ${nextDisabled} data-action="next">Suivant</button>
  `;
  pagination
    .querySelector("button[data-action=prev]")
    ?.addEventListener("click", () => changePage(page - 1));
  pagination
    .querySelector("button[data-action=next]")
    ?.addEventListener("click", () => changePage(page + 1));
}

function changePage(newPage) {
  if (newPage < 1) return;
  currentPage = newPage;
  const url = new URL(window.location.href);
  url.searchParams.set("page", String(currentPage));
  window.history.replaceState({}, "", url);
  loadList();
}

async function loadList() {
  if (!listGrid) return;
  listGrid.innerHTML = "<p>Chargement...</p>";
  const url = `${BASE_URL}/${getEndpoint()}?api_key=${API_KEY}&language=fr-FR&page=${currentPage}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      listGrid.innerHTML = "<p>Impossible de charger la liste.</p>";
      return;
    }
    const data = await response.json();
    const items = data.results || [];
    if (!items.length) {
      listGrid.innerHTML = "<p>Aucun résultat trouvé.</p>";
      return;
    }
    listGrid.innerHTML = items.map(renderCard).join("");
    renderPagination(currentPage, Math.min(data.total_pages || 1, 500));
  } catch (error) {
    listGrid.innerHTML = "<p>Erreur de chargement.</p>";
    console.error("Erreur liste TMDB:", error);
  }
}

loadList();
