// ========== Configuração ==========
const BASE_URL = "https://www.freetogame.com/api";

// Cache: guarda a lista pra não pedir de novo a cada busca
let gamesCache = null;

// ========== Lista completa de jogos ==========
async function fetchAllGames() {
  if (gamesCache) {
    return gamesCache;
  }

  const response = await fetch(`${BASE_URL}/games`);

  if (!response.ok) {
    throw new Error(`Erro ao buscar jogos (status ${response.status})`);
  }

  gamesCache = await response.json();
  return gamesCache;
}

// ========== Busca por nome (filtro feito no JS) ==========
async function searchGames(term) {
  const games = await fetchAllGames();
  const query = term.trim().toLowerCase();

  return games.filter((game) => game.title.toLowerCase().includes(query));
}

// ========== Detalhes de um jogo ==========
async function getGameDetails(id) {
  const response = await fetch(`${BASE_URL}/game?id=${id}`);

  if (!response.ok) {
    throw new Error(`Erro ao buscar detalhes (status ${response.status})`);
  }

  return await response.json();
}

// ========== Tradução (MyMemory) ==========
const TRANSLATE_URL = "https://api.mymemory.translated.net/get";
const TRANSLATE_EMAIL = ""; // opcional: coloque um e-mail seu pra aumentar a cota diária
const MAX_CHUNK_SIZE = 400; // a API aceita até 500 bytes por pedido
const TRANSLATION_CACHE_PREFIX = "gamefinder:pt:";

// Quebra um texto em pedaços menores, respeitando o fim das frases
function splitIntoChunks(text, maxSize = MAX_CHUNK_SIZE) {
  const sentences = text.match(/[^.!?]+[.!?]*\s*/g) || [text];
  const chunks = [];
  let current = "";

  sentences.forEach((sentence) => {
    if (current && (current + sentence).length > maxSize) {
      chunks.push(current.trim());
      current = "";
    }

    current += sentence;

    // Frase gigante: corta na marra
    while (current.length > maxSize) {
      chunks.push(current.slice(0, maxSize).trim());
      current = current.slice(maxSize);
    }
  });

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks;
}

// A API às vezes devolve entidades HTML (ex: &#39;), então decodificamos
function decodeHtmlEntities(text) {
  return new DOMParser().parseFromString(text, "text/html").body.textContent;
}

// Traduz UM pedaço de texto
async function translateChunk(text) {
  const params = new URLSearchParams({ q: text, langpair: "en|pt-BR" });

  if (TRANSLATE_EMAIL) {
    params.set("de", TRANSLATE_EMAIL);
  }

  const response = await fetch(`${TRANSLATE_URL}?${params}`);

  if (!response.ok) {
    throw new Error(`Erro na tradução (status ${response.status})`);
  }

  const data = await response.json();
  const translated = data.responseData && data.responseData.translatedText;

  // O aviso de cota estourada pode vir como resposta "normal"
  if (
    Number(data.responseStatus) !== 200 ||
    !translated ||
    translated.toUpperCase().includes("MYMEMORY WARNING")
  ) {
    throw new Error("Tradução indisponível (cota diária ou erro do serviço)");
  }

  return decodeHtmlEntities(translated);
}

// Traduz um texto inteiro (en -> pt-BR), com cache no localStorage
async function translateToPortuguese(text, cacheKey) {
  const storageKey = `${TRANSLATION_CACHE_PREFIX}${cacheKey}`;

  try {
    const saved = localStorage.getItem(storageKey);

    if (saved) {
      return saved;
    }
  } catch (error) {
    // localStorage indisponível: segue sem cache
  }

  const paragraphs = text.split(/\n+/).filter((p) => p.trim());
  const translatedParagraphs = [];

  for (const paragraph of paragraphs) {
    const parts = [];

    // Um pedaço por vez (em sequência), pra não estourar o limite da API
    for (const chunk of splitIntoChunks(paragraph)) {
      parts.push(await translateChunk(chunk));
    }

    translatedParagraphs.push(parts.join(" "));
  }

  const result = translatedParagraphs.join("\n\n");

  // Só chega aqui se TUDO foi traduzido, então nunca salva tradução pela metade
  try {
    localStorage.setItem(storageKey, result);
  } catch (error) {
    // sem cache, tudo bem
  }

  return result;
}