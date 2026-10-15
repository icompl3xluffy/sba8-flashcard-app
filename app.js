const decks = [{ id: 1, name: "My Deck", cards: [] }];
let selectedDeckId = decks[0].id;
let nextDeckId = 2;
let nextCardId = 1;
let editingDeckId = null;
let editingCardId = null;
let modalOpener = null;

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
const cardModal = document.querySelector("#card-modal");
const cardModalDialog = cardModal.querySelector('[role="dialog"]');
const cardModalTitle = document.querySelector("#card-modal-title");
const cardForm = document.querySelector("#card-form");
const cardQuestionInput = document.querySelector("#card-question");
const cardAnswerInput = document.querySelector("#card-answer");
const cardFormError = document.querySelector("#card-form-error");
const saveCardButton = document.querySelector("#save-card-button");

function renderDecks() {
  deckList.replaceChildren();

  for (const deck of decks) {
    const item = document.createElement("li");
    item.className = "deck-item";

    const selectButton = document.createElement("button");
    selectButton.className = "deck-select";
    selectButton.type = "button";
    selectButton.textContent = deck.name;
    selectButton.setAttribute("aria-current", String(deck.id === selectedDeckId));
    selectButton.addEventListener("click", () => {
      selectedDeckId = deck.id;
      renderDecks();
      updateCurrentDeck();
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
  renderCards(selectedDeck);
}

function renderCards(deck) {
  cardsArea.replaceChildren();

  if (!deck || deck.cards.length === 0) {
    const emptyState = document.createElement("article");
    emptyState.className = "empty-state";
    const title = document.createElement("h3");
    title.textContent = deck ? "No cards yet" : "No deck selected";
    const message = document.createElement("p");
    message.textContent = deck
      ? "Add a card to start studying this deck."
      : "Create a deck to start adding flashcards.";
    emptyState.append(title, message);
    cardsArea.append(emptyState);
    return;
  }

  for (const card of deck.cards) {
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

function openDeckModal(mode, deck, opener) {
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

  const deckIndex = decks.findIndex((item) => item.id === deck.id);
  if (deckIndex === -1) return;
  decks.splice(deckIndex, 1);
  if (selectedDeckId === deck.id) {
    selectedDeckId = decks[0]?.id ?? null;
  }
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
    'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
  )].filter((element) => !element.hidden);
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
      ? document.getElementById(modalOpener.id) ?? addCardButton
      : addCardButton;
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
    renderCards(deck);
    statusMessage.textContent = "Flashcard deleted.";
    const nextCard = deck.cards[Math.min(cardIndex, deck.cards.length - 1)];
    const focusTarget = nextCard
      ? document.querySelector(`#edit-card-${nextCard.id}`)
      : addCardButton;
    focusTarget.focus();
  }
}

addCardButton.addEventListener("click", () => openCardModal(null, addCardButton));
document.querySelector("#cancel-card-button").addEventListener("click", closeCardModal);
cardModal.addEventListener("keydown", (event) =>
  trapModalFocus(event, cardModalDialog, closeCardModal)
);
cardsArea.addEventListener("click", handleCardAction);

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

renderDecks();
updateCurrentDeck();