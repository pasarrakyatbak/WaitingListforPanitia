// Ganti URL_API dengan Web App Google Apps Script kamu
const URL_API = "https://script.google.com/macros/s/AKfycby4z2qZ24SrJkcyGpybH29lSUC_3_z1LG-7wSmTzpaOEXrwjXf0Cl3hqkg95qAxPj1-/exec";
const listContainer = document.getElementById("listContainer");

const modal = document.getElementById("modal");
const modalMessage = document.getElementById("modalMessage");
const confirmBtn = document.getElementById("confirmBtn");
const cancelBtn = document.getElementById("cancelBtn");

let selectedItem = null;
let selectedAction = null;

// Fetch data awal
async function loadData() {
  const res = await fetch(`${URL_API}?action=getWaitingList&page=1&limit=10`);
  const json = await res.json();

  listContainer.innerHTML = "";
  json.data.forEach(item => renderCard(item));
}

function renderCard(item) {
  const card = document.createElement("div");
  card.className = `card ${item.status === "done" ? "done" : ""}`;
  card.setAttribute("data-no", item.no);

  card.innerHTML = `
    <div class="title">${item.nama}</div>
    <div class="subtitle">${item.jualan} - ${item.alamat}</div>
    <div class="subtitle">WA: ${item.nomor_wa}</div>
    <div class="actions">
      <button class="btn primary">Done</button>
      <button class="btn danger">Hapus</button>
    </div>
  `;

  // Event Done
  card.querySelector(".btn.primary").addEventListener("click", () => {
    selectedItem = item;
    selectedAction = "done";
    modalMessage.textContent = `Tandai "${item.nama}" sudah Done?`;
    modal.classList.remove("hidden");
  });

  // Event Hapus
  card.querySelector(".btn.danger").addEventListener("click", () => {
    selectedItem = item;
    selectedAction = "delete";
    modalMessage.textContent = `Hapus "${item.nama}" dari waiting list?`;
    modal.classList.remove("hidden");
  });

  listContainer.appendChild(card);
}

// Modal event
cancelBtn.addEventListener("click", () => {
  modal.classList.add("hidden");
  selectedItem = null;
  selectedAction = null;
});

confirmBtn.addEventListener("click", async () => {
  if (!selectedItem || !selectedAction) return;

  try {
    let actionApi = "";
    if (selectedAction === "done") actionApi = "approveWaitingList";
    if (selectedAction === "delete") actionApi = "deleteWaitingList";

    const res = await fetch(URL_API, {
      method: "POST",
      body: new URLSearchParams({
        action: actionApi,
        no: selectedItem.no
      })
    });

    const json = await res.json();
    if (json.success) {
      if (selectedAction === "done") {
        markAsDone(selectedItem.no);
        showToast(`"${selectedItem.nama}" ditandai Done ✅`, "success");
      } else if (selectedAction === "delete") {
        removeItem(selectedItem.no);
        showToast(`"${selectedItem.nama}" berhasil dihapus ❌`, "success");
      }
    } else {
      showToast("Gagal update data", "error");
    }
  } catch (err) {
    console.error("Error:", err);
    showToast("Terjadi kesalahan server", "error");
  } finally {
    modal.classList.add("hidden");
  }
});

// Helper: tandai card Done
function markAsDone(no) {
  const card = document.querySelector(`.card[data-no="${no}"]`);
  if (card) {
    card.classList.add("done");
  }
}

// Helper: hapus card
function removeItem(no) {
  const card = document.querySelector(`.card[data-no="${no}"]`);
  if (card) card.remove();
}

// Toast Notification
function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  const toastMessage = document.getElementById("toastMessage");
  const toastClose = document.getElementById("toastClose");

  toastMessage.textContent = message;
  toast.className = `toast ${type} show`;

  // Auto hide
  const timer = setTimeout(() => {
    toast.className = "toast hidden";
  }, 3000);

  // Manual close
  toastClose.onclick = () => {
    clearTimeout(timer);
    toast.className = "toast hidden";
  };
}

// Load awal
loadData();