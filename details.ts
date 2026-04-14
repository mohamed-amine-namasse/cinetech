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

console.log("Details page loaded - Type:", mediaType, "ID:", id);

function createTag(text: string): string {
  return `<span class="chip">${text}</span>`;
}

function buildPoster(path: string | null): string {
  if (!path) {
    return "https://via.placeholder.com/500x750?text=Pas+d'affiche";
  }
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
          <div class="card-body">
            <h3>${title}</h3>
          </div>
        </a>
      </article>
    `;
    })
    .join("");
}

async function loadDetails(): Promise<void> {
  if (!id) {
    document.title = "Erreur | Cinetech";
    if (detailTitle) detailTitle.textContent = "Identifiant manquant";
    if (detailOverview)
      detailOverview.textContent = "Impossible de charger cette fiche.";
    return;
  }
  const detailUrl: string = `${BASE_URL}/${mediaType}/${id}?api_key=${API_KEY}&language=fr-FR`;
  const creditsUrl: string = `${BASE_URL}/${mediaType}/${id}/credits?api_key=${API_KEY}&language=fr-FR`;
  const similarUrl: string = `${BASE_URL}/${mediaType}/${id}/similar?api_key=${API_KEY}&language=fr-FR&page=1`;
  try {
    const [detailRes, creditsRes, similarRes]: Response[] = await Promise.all([
      fetch(detailUrl),
      fetch(creditsUrl),
      fetch(similarUrl),
    ]);
    if (!detailRes.ok || !creditsRes.ok || !similarRes.ok) {
      throw new Error("Erreur TMDB");
    }
    const detail: any = await detailRes.json();
    const credits: any = await creditsRes.json();
    const similar: any = await similarRes.json();

    const title: string = detail.title || detail.name || "Titre inconnu";
    const originalTitle: string =
      detail.original_title || detail.original_name || "";
    const date: string = detail.release_date || detail.first_air_date || "";
    const year: string = getYear(date);
    const runtime: number = detail.runtime || detail.episode_run_time?.[0] || 0;
    const genres: string = (detail.genres || [])
      .map((genre: any) => genre.name)
      .join(" • ");
    const countries: string = (
      detail.production_countries ||
      detail.origin_country ||
      []
    )
      .map((country: any) => country.name || country)
      .join(", ");
    const director: string =
      mediaType === "movie"
        ? getDirector(credits)
        : detail.created_by?.map((creator: any) => creator.name).join(", ") ||
          "Inconnu";

    document.title = `${title} | Cinetech`;
    if (detailPoster)
      detailPoster.style.backgroundImage = `url('${buildPoster(detail.poster_path || detail.backdrop_path)}')`;
    if (detailKind)
      detailKind.textContent = mediaType === "movie" ? "Film" : "Série";
    if (detailTitle) detailTitle.textContent = title;
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
    if (castList) castList.innerHTML = renderCast(credits.cast || []);
    if (similarGrid)
      similarGrid.innerHTML = renderSimilar(similar.results || []);
  } catch (error) {
    console.error("Erreur détail TMDB:", error);
    if (detailTitle) detailTitle.textContent = "Impossible de charger la fiche";
    if (detailOverview)
      detailOverview.textContent =
        "Une erreur est survenue lors du chargement des informations.";
  }
}

loadDetails();
