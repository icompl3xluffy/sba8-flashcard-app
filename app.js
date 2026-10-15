const decks = [{ id: 1, name: "My Deck" }];
let selectedDeckId = decks[0].id;
let nextDeckId = 2;
let editingDeckId = null;
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
    const deck = { id: nextDeckId++, name };
    decks.push(deck);
    selectedDeckId = deck.id;
    statusMessage.textContent = `${name} deck created.`;
  }

  renderDecks();
  updateCurrentDeck();
  closeDeckModal();
});

modal.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    event.preventDefault();
    closeDeckModal();
    return;
  }

  if (event.key !== "Tab") return;

  const focusableElements = [...modalDialog.querySelectorAll(
    'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
  )].filter((element) => !element.hidden);
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  if (!firstElement || !lastElement) {
    event.preventDefault();
    modalDialog.focus();
  } else if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault();
    lastElement.focus();
  } else if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault();
    firstElement.focus();
  }
});

document.addEventListener("focusin", (event) => {
  if (!modal.hidden && !modal.contains(event.target)) {
    deckNameInput.focus();
  }
});

renderDecks();
updateCurrentDeck();