const FLASHCARDS_STORAGE_KEY = "flashcards-app-state";
const FLASHCARDS_STORAGE_VERSION = 1;

function createDefaultState() {
  return {
    decks: [{ id: 1, name: "My Deck", cards: [] }],
    selectedDeckId: 1,
    nextDeckId: 2,
    nextCardId: 1,
  };
}

function isValidState(state) {
  return state
    && state.version === FLASHCARDS_STORAGE_VERSION
    && Array.isArray(state.decks)
    && state.decks.every((deck) =>
      deck
      && typeof deck === "object"
      && Number.isInteger(deck.id)
      && typeof deck.name === "string"
      && Array.isArray(deck.cards)
      && deck.cards.every((card) =>
        card
        && typeof card === "object"
        && Number.isInteger(card.id)
        && typeof card.question === "string"
        && typeof card.answer === "string"
      )
    );
}

function loadState() {
  let serializedState;
  try {
    serializedState = localStorage.getItem(FLASHCARDS_STORAGE_KEY);
  } catch (error) {
    console.warn("Flashcards state could not be read from local storage.", error);
    return createDefaultState();
  }

  if (serializedState === null) return createDefaultState();

  let state;
  try {
    state = JSON.parse(serializedState);
  } catch (error) {
    console.warn("Flashcards state is not valid JSON; using a fresh state.", error);
    return createDefaultState();
  }

  if (!isValidState(state)) {
    console.warn("Flashcards state has an unsupported version or structure; using a fresh state.");
    return createDefaultState();
  }

  const selectedDeckId = state.decks.some((deck) => deck.id === state.selectedDeckId)
    ? state.selectedDeckId
    : state.decks[0]?.id ?? null;
  const highestDeckId = Math.max(0, ...state.decks.map((deck) => deck.id));
  const highestCardId = Math.max(0, ...state.decks.flatMap((deck) =>
    deck.cards.map((card) => card.id)
  ));

  return {
    decks: state.decks.map((deck) => ({
      ...deck,
      cards: deck.cards.map((card) => ({
        ...card,
        isFlipped: Boolean(card.isFlipped),
      })),
    })),
    selectedDeckId,
    nextDeckId: Number.isInteger(state.nextDeckId)
      ? Math.max(state.nextDeckId, highestDeckId + 1)
      : highestDeckId + 1,
    nextCardId: Number.isInteger(state.nextCardId)
      ? Math.max(state.nextCardId, highestCardId + 1)
      : highestCardId + 1,
  };
}

function saveState(state) {
  const storedState = { ...state, version: FLASHCARDS_STORAGE_VERSION };
  try {
    localStorage.setItem(FLASHCARDS_STORAGE_KEY, JSON.stringify(storedState));
    return true;
  } catch (error) {
    console.warn("Flashcards state could not be saved to local storage.", error);
    return false;
  }
}
