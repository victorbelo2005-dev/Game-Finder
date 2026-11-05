// ======= referencia do DOM ==============
const searchInput = document.getElementById("search-input");
const searchButton = document.getElementById("search-button");

// ========= fluxo da busca =========
async function handleSearch() {
  // Evita busca dupla (ex: Enter apertado várias vezes)
  if (searchButton.disabled) {
    return;
  }

  const term = searchInput.value.trim();

  if (!term) {
    searchInput.focus();
    return;
  }

  searchButton.disabled = true;
  resultsContainer.replaceChildren();
  showMessage("Carregando jogos...", "loading");

  try {
    const games = await searchGames(term);

    if (games.length === 0) {
      showMessage(`Nenhum jogo encontrado para "${term}".`, "empty");
      return;
    }

    hideMessage();
    renderGames(games);
  } catch (error) {
    console.error(error);
    showMessage(
      "Ops, não rolou carregar os jogos. Confere sua internet e tenta de novo.",
      "error"
    );
  } finally {
    searchButton.disabled = false;
  }
}

// ========== Modal de detalhes ==========
let currentGameId = null;

async function openGameDetails(id) {
  currentGameId = id;
  openModal();
  setModalMessage("Carregando detalhes...", "loading");

  try {
    const game = await getGameDetails(id);

    // Se fechou o modal (ou abriu outro jogo) enquanto carregava, ignora
    if (currentGameId !== id) {
      return;
    }

    renderGameDetails(game);
    translateGameDescription(game, id);
  } catch (error) {
    console.error(error);

    if (currentGameId !== id) {
      return;
    }

    setModalMessage(
      "Não rolou carregar os detalhes desse jogo. Tenta de novo.",
      "error"
    );
  }
}

async function translateGameDescription(game, id) {
  const original = game.description || game.short_description;

  if (!original) {
    return;
  }

  try {
    const translated = await translateToPortuguese(original, game.id);

    // Mesma trava do Módulo 8: se trocou/fechou o modal, ignora
    if (currentGameId !== id) {
      return;
    }

    updateModalDescription(translated);
  } catch (error) {
    console.error(error);

    if (currentGameId !== id) {
      return;
    }

    updateModalDescription(
      original,
      "Não consegui traduzir agora, então tá aparecendo o texto original em inglês."
    );
  }
}

function handleCloseModal() {
  currentGameId = null;
  closeModal();
}

// ========= eventos =========
searchButton.addEventListener("click", handleSearch);

searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        handleSearch();
    }
});

// Clique em qualquer card (um único listener no container)
resultsContainer.addEventListener("click", (event) => {
  const card = event.target.closest(".card");

  if (!card) {
    return;
  }

  openGameDetails(card.dataset.id);
});

// Fechar: botão X
document
  .getElementById("modal-close")
  .addEventListener("click", handleCloseModal);

// Fechar: clique fora do conteúdo
modalElement.addEventListener("click", (event) => {
  if (event.target === modalElement) {
    handleCloseModal();
  }
});

// Fechar: tecla ESC
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modalElement.hidden) {
    handleCloseModal();
  }
});