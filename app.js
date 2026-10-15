const initialState = loadState();
const decks = initialState.decks;
let selectedDeckId = initialState.selectedDeckId;
let nextDeckId = initialState.nextDeckId;
let nextCardId = initialState.nextCardId;
let editingDeckId = null;
let editingCardId = null;
let modalOpener = null;
let studyMode = null;
let searchTimer = null;
let searchQuery = "";

const deckList = document.querySelector("#deck-list");
const addDeckButton = document.querySelector("#add-deck-button");
const currentDeckTitle = document.querySelector("#current-deck-title");
const statusMessage = document.querySelector("#status-message");
const modal = document.querySelector("#deck-modal");
const modalDialog = modal.querySelector('[role="dialog"]');
const modalTitle = document.querySelector("#deck-modal-title");
const deckForm = document.querySelector("#deck-form");
const deckNameInput = document.querySelector("#deck-name");
const formError = document.querySelector("#deck-form-error");
const saveDeckButton = document.querySelector("#save-deck-button");
const cardsArea = document.querySelector("#cards-area");
const addCardButton = document.querySelector("#add-card-button");
const studyDeckButton = document.querySelector("#study-deck-button");
const cardModal = document.querySelector("#card-modal");
const cardModalDialog = cardModal.querySelector('[role="dialog"]');
const cardModalTitle = document.querySelector("#card-modal-title");
const cardForm = document.querySelector("#card-form");
const cardQuestionInput = document.querySelector("#card-question");
const cardAnswerInput = document.querySelector("#card-answer");
const cardFormError = document.querySelector("#card-form-error");
const saveCardButton = document.querySelector("#save-card-button");
const cardSearchInput = document.querySelector("#card-search-input");
const cardMatchCount = document.querySelector("#card-match-count");

function persistState() {
  return saveState({ decks, selectedDeckId, nextDeckId, nextCardId });
}

function renderDecks() {
  deckList.replaceChildren();

  for (const deck of decks) {
    const item = document.createElement("li");
    item.className = "deck-item";

    const selectButton = document.createElement("button");
    selectButton.className = "deck-select";
    selectButton.type = "button";
    selectButton.id = `select-deck-${deck.id}`;
    selectButton.textContent = deck.name;
    selectButton.setAttribute("aria-current", String(deck.id === selectedDeckId));
    selectButton.addEventListener("click", () => {
      if (studyMode) exitStudyMode(false);
      selectedDeckId = deck.id;
      persistState();
      renderDecks();
      updateCurrentDeck();
      document.getElementById(`select-deck-${deck.id}`)?.focus();
    });

    const actions = document.createElement("div");
    actions.className = "deck-actions";

    const editButton = document.createElement("button");
    editButton.className = "text-button";
    editButton.type = "button";
    editButton.textContent = "Rename";
    editButton.id = `edit-deck-${deck.id}`;
    editButton.setAttribute("aria-label", `Rename ${deck.name}`);
    editButton.addEventListener("click", () => openDeckModal("edit", deck, editButton));

    const deleteButton = document.createElement("button");
    deleteButton.className = "text-button delete-button";
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
    deleteButton.setAttribute("aria-label", `Delete ${deck.name}`);
    deleteButton.addEventListener("click", () => deleteDeck(deck));

    actions.append(editButton, deleteButton);
    item.append(selectButton, actions);
    deckList.append(item);
  }
}

function updateCurrentDeck() {
  const selectedDeck = decks.find((deck) => deck.id === selectedDeckId);
  currentDeckTitle.textContent = selectedDeck ? `${selectedDeck.name} — Cards` : "Cards";
  addCardButton.disabled = !selectedDeck;
  studyDeckButton.disabled = !selectedDeck || selectedDeck.cards.length === 0;
  renderCards(selectedDeck);
}

function createEmptyState(iconName, titleText, messageText, actionLabel, actionHandler) {
  const icons = {
    deck: "M3 7.5 12 3l9 4.5-9 4.5L3 7.5Zm0 0V17l9 4 9-4V7.5M12 12v9",
    card: "M4 4.5h16A1.5 1.5 0 0 1 21.5 6v12a1.5 1.5 0 0 1-1.5 1.5H4A1.5 1.5 0 0 1 2.5 18V6A1.5 1.5 0 0 1 4 4.5ZM7 9h10M7 13h7",
    search: "m20 20-4.5-4.5M18 10.5a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z",
  };
  const article = document.createElement("article");
  article.className = "empty-state";
  article.setAttribute("aria-live", "polite");
  article.setAttribute("aria-atomic", "true");

  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.classList.add("empty-state-icon");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("aria-hidden", "true");
  icon.setAttribute("focusable", "false");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", icons[iconName]);
  icon.append(path);

  const heading = document.createElement("h3");
  heading.textContent = titleText;
  const message = document.createElement("p");
  message.textContent = messageText;
  article.append(icon, heading, message);

  if (actionLabel && actionHandler) {
    const action = document.createElement("button");
    action.type = "button";
    action.textContent = actionLabel;
    action.addEventListener("click", actionHandler);
    article.append(action);
  }
  return article;
}

function renderCards(deck) {
  cardsArea.replaceChildren();
  studyDeckButton.disabled = !deck || deck.cards.length === 0;

  const allCards = deck?.cards ?? [];
  const normalizedQuery = searchQuery.toLocaleLowerCase();
  const matchingCards = allCards.filter((card) =>
    !normalizedQuery
    || card.question.toLocaleLowerCase().includes(normalizedQuery)
    || card.answer.toLocaleLowerCase().includes(normalizedQuery)
  );
  cardMatchCount.textContent = normalizedQuery
    ? `${matchingCards.length} ${matchingCards.length === 1 ? "match" : "matches"}`
    : `${allCards.length} ${allCards.length === 1 ? "card" : "cards"}`;

  if (!deck || allCards.length === 0) {
    if (deck) {
      cardsArea.append(createEmptyState(
        "card",
        "No cards yet",
        "Add a question and answer to build this deck, then study your cards.",
        "Add your first card",
        () => openCardModal(null, addCardButton)
      ));
    } else {
      const hasDecks = decks.length > 0;
      cardsArea.append(createEmptyState(
        "deck",
        hasDecks ? "No deck selected" : "No decks yet",
        hasDecks
          ? "Choose a deck from the sidebar to view its cards."
          : "Create a deck to organize your flashcards and get started.",
        hasDecks ? null : "Create a deck",
        hasDecks ? null : () => openDeckModal("create", null, addDeckButton)
      ));
    }
    return;
  }

  if (matchingCards.length === 0) {
    cardsArea.append(createEmptyState(
      "search",
      "No matches",
      "No questions or answers match this search. Try another phrase or clear the search.",
      "Clear search",
      () => {
        cardSearchInput.value = "";
        searchQuery = "";
        renderCards(deck);
        cardSearchInput.focus();
      }
    ));
    return;
  }

  for (const card of matchingCards) {
    const article = document.createElement("article");
    article.className = "card";
    article.dataset.cardId = String(card.id);
    if (card.isFlipped) article.classList.add("is-flipped");

    const cardInner = document.createElement("div");
    cardInner.className = "card-inner";

    const questionFace = document.createElement("div");
    questionFace.className = "card-face card-front";
    questionFace.setAttribute("aria-hidden", String(card.isFlipped));
    questionFace.inert = card.isFlipped;
    const questionTitle = document.createElement("h3");
    questionTitle.textContent = "Question";
    const questionText = document.createElement("p");
    questionText.textContent = card.question;
    questionFace.append(questionTitle, questionText);

    const answerFace = document.createElement("div");
    answerFace.className = "card-face card-back";
    answerFace.setAttribute("aria-hidden", String(!card.isFlipped));
    answerFace.inert = !card.isFlipped;
    const answerTitle = document.createElement("h3");
    answerTitle.textContent = "Answer";
    const answerText = document.createElement("p");
    answerText.textContent = card.answer;
    answerFace.append(answerTitle, answerText);
    cardInner.append(questionFace, answerFace);

    const cardActions = document.createElement("div");
    cardActions.className = "card-actions";

    const flipButton = document.createElement("button");
    flipButton.className = "flip-button";
    flipButton.type = "button";
    flipButton.dataset.action = "flip";
    flipButton.setAttribute("aria-pressed", String(card.isFlipped));
    flipButton.setAttribute("aria-label", card.isFlipped ? "Show question" : "Show answer");
    flipButton.textContent = card.isFlipped ? "Show question" : "Show answer";

    const editButton = document.createElement("button");
    editButton.className = "text-button";
    editButton.type = "button";
    editButton.dataset.action = "edit";
    editButton.id = `edit-card-${card.id}`;
    editButton.setAttribute("aria-label", `Edit card: ${card.question}`);
    editButton.textContent = "Edit";

    const deleteButton = document.createElement("button");
    deleteButton.className = "text-button delete-button";
    deleteButton.type = "button";
    deleteButton.dataset.action = "delete";
    deleteButton.setAttribute("aria-label", `Delete card: ${card.question}`);
    deleteButton.textContent = "Delete";

    cardActions.append(flipButton, editButton, deleteButton);
    article.append(cardInner, cardActions);
    cardsArea.append(article);
  }
}

function enterStudyMode(deckId) {
  const deck = decks.find((item) => item.id === deckId);
  if (!deck) {
    statusMessage.textContent = "That deck could not be found.";
    return false;
  }
  if (deck.cards.length === 0) {
    statusMessage.textContent = `${deck.name} has no cards to study.`;
    return false;
  }

  if (studyMode) exitStudyMode(false);
  selectedDeckId = deck.id;
  renderDecks();

  const view = document.createElement("section");
  view.className = "study-view";
  view.setAttribute("aria-labelledby", "study-title");
  view.tabIndex = -1;

  const heading = document.createElement("div");
  heading.className = "study-heading";
  const title = document.createElement("h3");
  title.id = "study-title";
  title.textContent = `Studying ${deck.name}`;
  const progress = document.createElement("p");
  progress.className = "study-progress";
  progress.setAttribute("aria-live", "polite");

  const exitButton = document.createElement("button");
  exitButton.type = "button";
  exitButton.dataset.studyAction = "exit";
  exitButton.className = "secondary-button";
  exitButton.textContent = "Exit study";
  heading.append(title, progress, exitButton);

  const card = document.createElement("article");
  card.className = "card study-card";
  const inner = document.createElement("div");
  inner.className = "card-inner";

  const questionFace = document.createElement("div");
  questionFace.className = "card-face card-front";
  const questionTitle = document.createElement("h4");
  questionTitle.textContent = "Question";
  const questionText = document.createElement("p");
  questionFace.append(questionTitle, questionText);

  const answerFace = document.createElement("div");
  answerFace.className = "card-face card-back";
  const answerTitle = document.createElement("h4");
  answerTitle.textContent = "Answer";
  const answerText = document.createElement("p");
  answerFace.append(answerTitle, answerText);
  inner.append(questionFace, answerFace);
  card.append(inner);

  const controls = document.createElement("div");
  controls.className = "study-controls";
  const previousButton = document.createElement("button");
  previousButton.type = "button";
  previousButton.dataset.studyAction = "previous";
  previousButton.textContent = "Previous";

  const flipButton = document.createElement("button");
  flipButton.type = "button";
  flipButton.dataset.studyAction = "flip";
  flipButton.setAttribute("aria-pressed", "false");
  flipButton.textContent = "Show answer";

  const nextButton = document.createElement("button");
  nextButton.type = "button";
  nextButton.dataset.studyAction = "next";
  nextButton.textContent = "Next";
  controls.append(previousButton, flipButton, nextButton);

  const shortcutHint = document.createElement("p");
  shortcutHint.className = "study-shortcuts";
  shortcutHint.textContent = "Keyboard: Left/Right to navigate, Space to flip, Esc to exit.";
  view.append(heading, card, controls, shortcutHint);
  cardsArea.replaceChildren(view);

  studyMode = {
    deck,
    index: 0,
    isFlipped: false,
    opener: studyDeckButton,
    progress,
    card,
    questionText,
    answerText,
    previousButton,
    flipButton,
    nextButton,
  };
  renderStudyCard();
  document.addEventListener("keydown", handleStudyKeydown);
  exitButton.focus();
  return true;
}

function renderStudyCard() {
  if (!studyMode) return;
  const { deck, index, isFlipped } = studyMode;
  const card = deck.cards[index];
  studyMode.progress.textContent = `Card ${index + 1} of ${deck.cards.length}`;
  studyMode.questionText.textContent = card.question;
  studyMode.answerText.textContent = card.answer;
  studyMode.card.classList.toggle("is-flipped", isFlipped);

  const questionFace = studyMode.card.querySelector(".card-front");
  const answerFace = studyMode.card.querySelector(".card-back");
  questionFace.setAttribute("aria-hidden", String(isFlipped));
  questionFace.inert = isFlipped;
  answerFace.setAttribute("aria-hidden", String(!isFlipped));
  answerFace.inert = !isFlipped;
  studyMode.flipButton.setAttribute("aria-pressed", String(isFlipped));
  studyMode.flipButton.textContent = isFlipped ? "Show question" : "Show answer";
  studyMode.previousButton.disabled = index === 0;
  studyMode.nextButton.disabled = index === deck.cards.length - 1;
}

function exitStudyMode(restoreFocus = true) {
  if (!studyMode) return;
  const opener = studyMode.opener;
  document.removeEventListener("keydown", handleStudyKeydown);
  studyMode = null;
  updateCurrentDeck();
  if (restoreFocus) opener.focus();
}

function handleStudyKeydown(event) {
  if (!studyMode || modal.hidden === false || cardModal.hidden === false) return;
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.key === "Escape") {
    event.preventDefault();
    exitStudyMode();
    return;
  }
  if (event.target instanceof HTMLElement &&
    (event.target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName))) {
    return;
  }

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    studyMode.index = Math.max(0, studyMode.index - 1);
    studyMode.isFlipped = false;
    renderStudyCard();
  } else if (event.key === "ArrowRight") {
    event.preventDefault();
    studyMode.index = Math.min(studyMode.deck.cards.length - 1, studyMode.index + 1);
    studyMode.isFlipped = false;
    renderStudyCard();
  } else if ((event.code === "Space" || event.key === " ")
    && !(event.target instanceof Element && event.target.closest("button, a"))) {
    event.preventDefault();
    studyMode.isFlipped = !studyMode.isFlipped;
    renderStudyCard();
  }
}

function openDeckModal(mode, deck, opener) {
  if (studyMode) exitStudyMode(false);
  editingDeckId = mode === "edit" ? deck.id : null;
  modalOpener = opener;
  modalTitle.textContent = editingDeckId ? "Rename deck" : "Add deck";
  saveDeckButton.textContent = editingDeckId ? "Save changes" : "Create deck";
  deckNameInput.value = deck ? deck.name : "";
  formError.textContent = "";
  modal.hidden = false;
  deckNameInput.focus();
  deckNameInput.select();
}

function closeDeckModal() {
  modal.hidden = true;
  deckForm.reset();
  formError.textContent = "";
  const focusTarget = modalOpener?.isConnected
    ? modalOpener
    : modalOpener?.id
      ? document.getElementById(modalOpener.id) ?? addDeckButton
      : addDeckButton;
  modalOpener = null;
  editingDeckId = null;
  focusTarget.focus();
}

function deleteDeck(deck) {
  const confirmed = window.confirm(`Delete the "${deck.name}" deck?`);
  if (!confirmed) return;

  if (studyMode?.deck.id === deck.id) exitStudyMode(false);
  const deckIndex = decks.findIndex((item) => item.id === deck.id);
  if (deckIndex === -1) return;
  decks.splice(deckIndex, 1);
  if (selectedDeckId === deck.id) {
    selectedDeckId = decks[0]?.id ?? null;
  }
  persistState();
  renderDecks();
  updateCurrentDeck();
  statusMessage.textContent = `${deck.name} deck deleted.`;
  (deckList.querySelector(".deck-select") ?? addDeckButton).focus();
}

addDeckButton.addEventListener("click", () => openDeckModal("create", null, addDeckButton));
document.querySelector("#cancel-deck-button").addEventListener("click", closeDeckModal);

deckForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = deckNameInput.value.trim();
  if (!name) {
    formError.textContent = "Enter a deck name.";
    deckNameInput.focus();
    return;
  }

  if (editingDeckId !== null) {
    const deck = decks.find((item) => item.id === editingDeckId);
    if (!deck) {
      formError.textContent = "This deck no longer exists. Close the dialog and try again.";
      return;
    }
    deck.name = name;
    statusMessage.textContent = `${name} deck renamed.`;
  } else {
    const deck = { id: nextDeckId++, name, cards: [] };
    decks.push(deck);
    selectedDeckId = deck.id;
    statusMessage.textContent = `${name} deck created.`;
  }

  persistState();
  renderDecks();
  updateCurrentDeck();
  closeDeckModal();
});

modal.addEventListener("keydown", (event) => {
  trapModalFocus(event, modalDialog, closeDeckModal);
});

function trapModalFocus(event, dialogElement, closeModal) {
  if (event.key === "Escape") {
    event.preventDefault();
    closeModal();
    return;
  }
  if (event.key !== "Tab") return;

  const focusableElements = [...dialogElement.querySelectorAll(
    'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
  )].filter((element) => !element.hidden && !element.inert && element.getClientRects().length > 0);
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  if (!firstElement || !lastElement) {
    event.preventDefault();
    dialogElement.focus();
  } else if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault();
    lastElement.focus();
  } else if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault();
    firstElement.focus();
  }
}

function openCardModal(card, opener) {
  editingCardId = card?.id ?? null;
  modalOpener = opener;
  cardModalTitle.textContent = editingCardId ? "Edit card" : "Add card";
  saveCardButton.textContent = editingCardId ? "Save changes" : "Create card";
  cardQuestionInput.value = card?.question ?? "";
  cardAnswerInput.value = card?.answer ?? "";
  cardFormError.textContent = "";
  cardModal.hidden = false;
  cardQuestionInput.focus();
  cardQuestionInput.select();
}

function closeCardModal() {
  cardModal.hidden = true;
  cardForm.reset();
  cardFormError.textContent = "";
  const focusTarget = modalOpener?.isConnected
    ? modalOpener
    : modalOpener?.id
      ? document.getElementById(modalOpener.id) ?? (searchQuery ? cardSearchInput : addCardButton)
      : (searchQuery ? cardSearchInput : addCardButton);
  modalOpener = null;
  editingCardId = null;
  focusTarget.focus();
}

function handleCardAction(event) {
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest("button[data-action]");
  if (!button || !cardsArea.contains(button)) return;

  const cardElement = button.closest(".card");
  const deck = decks.find((item) => item.id === selectedDeckId);
  const card = deck?.cards.find((item) => item.id === Number(cardElement?.dataset.cardId));
  if (!deck || !card || !cardElement) return;

  if (button.dataset.action === "flip") {
    card.isFlipped = !card.isFlipped;
    persistState();
    cardElement.classList.toggle("is-flipped", card.isFlipped);
    const questionFace = cardElement.querySelector(".card-front");
    const answerFace = cardElement.querySelector(".card-back");
    questionFace.setAttribute("aria-hidden", String(card.isFlipped));
    questionFace.inert = card.isFlipped;
    answerFace.setAttribute("aria-hidden", String(!card.isFlipped));
    answerFace.inert = !card.isFlipped;
    button.setAttribute("aria-pressed", String(card.isFlipped));
    button.setAttribute("aria-label", card.isFlipped ? "Show question" : "Show answer");
    button.textContent = card.isFlipped ? "Show question" : "Show answer";
    return;
  }

  if (button.dataset.action === "edit") {
    openCardModal(card, button);
    return;
  }

  if (button.dataset.action === "delete") {
    if (!window.confirm("Delete this flashcard?")) return;
    const cardIndex = deck.cards.findIndex((item) => item.id === card.id);
    if (cardIndex === -1) return;
    deck.cards.splice(cardIndex, 1);
    persistState();
    renderCards(deck);
    statusMessage.textContent = "Flashcard deleted.";
    const focusTarget = cardsArea.querySelector(".card [data-action='edit']")
      ?? (searchQuery ? cardSearchInput : addCardButton);
    focusTarget.focus();
  }
}

addCardButton.addEventListener("click", () => openCardModal(null, addCardButton));
studyDeckButton.addEventListener("click", () => enterStudyMode(selectedDeckId));
document.querySelector("#cancel-card-button").addEventListener("click", closeCardModal);
cardModal.addEventListener("keydown", (event) =>
  trapModalFocus(event, cardModalDialog, closeCardModal)
);
cardsArea.addEventListener("click", handleCardAction);
cardsArea.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest("button[data-study-action]");
  if (!button || !cardsArea.contains(button) || !studyMode) return;

  if (button.dataset.studyAction === "exit") {
    exitStudyMode();
  } else if (button.dataset.studyAction === "flip") {
    studyMode.isFlipped = !studyMode.isFlipped;
    renderStudyCard();
  } else if (button.dataset.studyAction === "previous") {
    studyMode.index = Math.max(0, studyMode.index - 1);
    studyMode.isFlipped = false;
    renderStudyCard();
  } else if (button.dataset.studyAction === "next") {
    studyMode.index = Math.min(studyMode.deck.cards.length - 1, studyMode.index + 1);
    studyMode.isFlipped = false;
    renderStudyCard();
  }
});

cardForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const question = cardQuestionInput.value.trim();
  const answer = cardAnswerInput.value.trim();
  if (!question || !answer) {
    cardFormError.textContent = "Enter both a question and an answer.";
    (!question ? cardQuestionInput : cardAnswerInput).focus();
    return;
  }

  const deck = decks.find((item) => item.id === selectedDeckId);
  if (!deck) {
    cardFormError.textContent = "No deck is selected. Close the dialog and select a deck.";
    return;
  }

  if (editingCardId !== null) {
    const card = deck.cards.find((item) => item.id === editingCardId);
    if (!card) {
      cardFormError.textContent = "This card no longer exists. Close the dialog and try again.";
      return;
    }
    card.question = question;
    card.answer = answer;
    card.isFlipped = false;
    statusMessage.textContent = "Flashcard updated.";
  } else {
    deck.cards.push({ id: nextCardId++, question, answer, isFlipped: false });
    statusMessage.textContent = "Flashcard created.";
  }

  persistState();
  renderCards(deck);
  closeCardModal();
});

document.addEventListener("focusin", (event) => {
  const activeModal = [modal, cardModal].find((item) => !item.hidden);
  if (activeModal && !activeModal.contains(event.target)) {
    const focusInput = activeModal === modal ? deckNameInput : cardQuestionInput;
    focusInput.focus();
  }
});

cardSearchInput.addEventListener("input", () => {
  window.clearTimeout(searchTimer);
  searchTimer = window.setTimeout(() => {
    searchQuery = cardSearchInput.value.trim();
    const selectedDeck = decks.find((deck) => deck.id === selectedDeckId);
    renderCards(selectedDeck);
  }, 300);
});

renderDecks();
updateCurrentDeck();