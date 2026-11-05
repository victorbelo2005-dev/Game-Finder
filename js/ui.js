// ========== Referências do DOM ==========
const resultsContainer = document.getElementById("results");
const messageElement = document.getElementById("message");
const modalElement = document.getElementById("modal");
const modalBody = document.getElementById("modal-body")

// ========== Formata a data: 2022-03-15 -> 15/03/2022 ==========
function formatDate(dateString) {
  if (!dateString) {
    return "Data desconhecida";
  }

  const [year, month, day] = dateString.split("-");

  if (!year || !month || !day) {
    return "Data desconhecida";
  }

  return `${day}/${month}/${year}`;
}

// ========== Monta um card ==========
function createGameCard(game) {
  const card = document.createElement("article");
  card.className = "card";
  card.dataset.id = game.id;

  // Imagem (ou um espaço vazio se o jogo não tiver capa)
  let image;

  if (game.thumbnail) {
    image = document.createElement("img");
    image.src = game.thumbnail;
    image.alt = `Capa de ${game.title}`;
    image.loading = "lazy";
    image.className = "card__image";
  } else {
    image = document.createElement("div");
    image.textContent = "Sem imagem";
    image.className = "card__image card__image--empty";
  }

  // Corpo do card
  const body = document.createElement("div");
  body.className = "card__body";

  const title = document.createElement("h2");
  title.className = "card__title";
  title.textContent = game.title || "Sem título";

  const meta = document.createElement("div");
  meta.className = "card__meta";

  [game.genre, game.platform, formatDate(game.release_date)]
    .filter(Boolean)
    .forEach((text) => {
      const tag = document.createElement("span");
      tag.className = "card__tag";
      tag.textContent = text;
      meta.appendChild(tag);
    });

  body.appendChild(title);
  body.appendChild(meta);
  card.appendChild(image);
  card.appendChild(body);

  return card;
}

// ========== Renderiza a lista inteira ==========
function renderGames(games) {
  resultsContainer.replaceChildren();

  const fragment = document.createDocumentFragment();

  games.forEach((game) => {
    fragment.appendChild(createGameCard(game));
  });

  resultsContainer.appendChild(fragment);
}

// ========== Mensagens de estado ==========
function showMessage(text, type = "info") {
  messageElement.textContent = text;
  messageElement.className = `message message--${type}`;
  messageElement.hidden = false;
}

function hideMessage() {
  messageElement.hidden = true;
  messageElement.textContent = "";
}

// ========== Modal ==========
function openModal() {
  modalElement.hidden = false;
  document.body.style.overflow = "hidden"; // trava o scroll da página de trás
}

function closeModal() {
  modalElement.hidden = true;
  modalBody.replaceChildren();
  document.body.style.overflow = "";
}

function setModalMessage(text, type = "info") {
  const paragraph = document.createElement("p");
  paragraph.className = `modal__message modal__message--${type}`;
  paragraph.textContent = text;
  modalBody.replaceChildren(paragraph);
}

function createInfoLine(label, value) {
  if (!value) {
    return null;
  }

  const line = document.createElement("p");
  line.className = "modal__info";

  const strong = document.createElement("strong");
  strong.textContent = `${label}: `;

  line.appendChild(strong);
  line.appendChild(document.createTextNode(value));
  return line;
}

function renderGameDetails(game) {
  const fragment = document.createDocumentFragment();

  if (game.thumbnail) {
    const image = document.createElement("img");
    image.className = "modal__image";
    image.src = game.thumbnail;
    image.alt = `Capa de ${game.title}`;
    fragment.appendChild(image);
  }

  const title = document.createElement("h2");
  title.className = "modal__title";
  title.textContent = game.title || "Sem título";
  fragment.appendChild(title);

  const meta = document.createElement("div");
  meta.className = "card__meta";

  [game.genre, game.platform, formatDate(game.release_date)]
    .filter(Boolean)
    .forEach((text) => {
      const tag = document.createElement("span");
      tag.className = "card__tag";
      tag.textContent = text;
      meta.appendChild(tag);
    });

  fragment.appendChild(meta);

  const description = document.createElement("p");
  description.className = "modal__description";
    description.textContent =
    (game.description || game.short_description)
      ? "Traduzindo descrição..."
      : "Sem descrição disponível.";
  fragment.appendChild(description);

  [
    createInfoLine("Desenvolvedora", game.developer),
    createInfoLine("Publicadora", game.publisher),
  ]
    .filter(Boolean)
    .forEach((line) => fragment.appendChild(line));

  // Só cria o link se a URL parecer segura (começa com http)
  if (game.game_url && game.game_url.startsWith("http")) {
    const link = document.createElement("a");
    link.className = "modal__link";
    link.href = game.game_url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Jogar agora";
    fragment.appendChild(link);
  }

  modalBody.replaceChildren(fragment);
}

function updateModalDescription(text, note) {
  const description = modalBody.querySelector(".modal__description");

  if (!description) {
    return;
  }

  description.textContent = text;

  if (note) {
    const noteElement = document.createElement("p");
    noteElement.className = "modal__note";
    noteElement.textContent = note;
    description.after(noteElement);
  }
}