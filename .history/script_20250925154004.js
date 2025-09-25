const URL_API = "https://script.google.com/macros/s/AKfycby4z2qZ24SrJkcyGpybH29lSUC_3_z1LG-7wSmTzpaOEXrwjXf0Cl3hqkg95qAxPj1-/exec";

const listContainer = document.getElementById("listContainer");
const modal = document.getElementById("modal");
const modalMessage = document.getElementById("modalMessage");
const confirmBtn = document.getElementById("confirmBtn");
const cancelBtn = document.getElementById("cancelBtn");
const loader = document.getElementById("loader");
const btnText = confirmBtn.querySelector(".btn-text");
const btnSpinner = confirmBtn.querySelector(".btn-spinner");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const paginationDiv = document.getElementById("pagination");
const darkSwitch = document.getElementById("darkSwitch");

let selectedItem = null;
let selectedAction = null;
let selectedCardButton = null;
let currentPage = 1;
let totalPages = 1;
let currentKeyword = "";

// Loader global
function showLoader() { loader.classList.remove("hidden"); }
function hideLoader() { loader.classList.add("hidden"); }

// Spinner modal Ya
function setButtonLoading(state) {
    if (state) { btnText.textContent = "Memproses..."; btnSpinner.classList.remove("hidden"); confirmBtn.disabled = true; }
    else { btnText.textContent = "Ya"; btnSpinner.classList.add("hidden"); confirmBtn.disabled = false; }
}

// Load data
async function loadData(page = 1, limit = 10, keyword = "") {
    showLoader();
    let url = keyword && keyword.trim() !== ""
        ? `${URL_API}?action=searchWaitingList&keyword=${encodeURIComponent(keyword)}&page=${page}&limit=${limit}`
        : `${URL_API}?action=waitingList&page=${page}&limit=${limit}`;
    try {
        const res = await fetch(url);
        const json = await res.json();
        listContainer.innerHTML = "";
        if (json.success) {
            json.data.forEach(item => renderCard(item));
            currentPage = page;
            totalPages = json.totalPages || 1;
            renderPagination();
        } else {
            listContainer.innerHTML = `<p style="text-align:center;">${json.message || 'Gagal mengambil data'}</p>`;
            paginationDiv.innerHTML = "";
        }
    } catch (err) {
        console.error("Error loadData:", err);
        listContainer.innerHTML = `<p style="text-align:center; color:red;">Terjadi kesalahan jaringan</p>`;
        paginationDiv.innerHTML = "";
    } finally { hideLoader(); }
}

// Render card
function renderCard(item) {
    const card = document.createElement("div");
    card.classList.add("card");
    if (item.status === "done") card.classList.add("done");
    card.dataset.no = item.no;

    card.innerHTML = `
      <div class="title">${item.no}. ${item.nama}</div>
      <div class="subtitle"><strong>Alamat:</strong> ${item.alamat}</div>
      <div class="subtitle"><strong>Jualan:</strong> ${item.jualan}</div>
      <div class="subtitle"><strong>WA:</strong> ${item.nomor_wa}</div>
      <div class="actions">
        <button class="btn primary">
          Done <span class="btn-card-spinner hidden"></span>
        </button>
        <button class="btn danger">
          Hapus <span class="btn-card-spinner hidden"></span>
        </button>
      </div>
    `;

    const btnDone = card.querySelector(".btn.primary");
    const btnHapus = card.querySelector(".btn.danger");
    const spinnerDone = btnDone.querySelector(".btn-card-spinner");
    const spinnerHapus = btnHapus.querySelector(".btn-card-spinner");

    btnDone.addEventListener("click", () => {
        selectedItem = item;
        selectedAction = "done";
        selectedCardButton = btnDone;
        modalMessage.textContent = `Tandai "${item.nama}" sebagai Done?`;
        modal.classList.remove("hidden");
    });

    btnHapus.addEventListener("click", () => {
        selectedItem = item;
        selectedAction = "delete";
        selectedCardButton = btnHapus;
        modalMessage.textContent = `Hapus "${item.nama}" dari waiting list?`;
        modal.classList.remove("hidden");
    });

    listContainer.appendChild(card);
}

// Modal cancel
cancelBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
    selectedItem = null;
    selectedAction = null;
    selectedCardButton = null;
});

// Modal confirm
confirmBtn.addEventListener("click", async () => {
    if (!selectedItem || !selectedAction) { modal.classList.add("hidden"); return; }
    const actionApi = selectedAction === "done" ? "approveWaitingList" : "deleteWaitingList";

    setButtonLoading(true);
    const spinnerCard = selectedCardButton.querySelector(".btn-card-spinner");
    selectedCardButton.disabled = true;
    spinnerCard.classList.remove("hidden");

    try {
        const res = await fetch(URL_API, {
            method: "POST",
            body: new URLSearchParams({ action: actionApi, no: selectedItem.no })
        });
        const json = await res.json();
        if (json.success) {
            if (selectedAction === "done") { markAsDone(selectedItem.no); showToast(`"${selectedItem.nama}" ditandai Done ✅`, "success"); }
            else { removeCard(selectedItem.no); showToast(`"${selectedItem.nama}" berhasil dihapus ❌`, "success"); }
        } else { showToast(json.message || "Gagal update data", "error"); }
    } catch (err) {
        console.error("Error confirm:", err);
        showToast("Kesalahan jaringan", "error");
    } finally {
        setButtonLoading(false);
        spinnerCard.classList.add("hidden");
        selectedCardButton.disabled = false;
        modal.classList.add("hidden");
        selectedItem = null;
        selectedAction = null;
        selectedCardButton = null;
    }
});

function markAsDone(no) {
    const card = listContainer.querySelector(`.card[data-no="${no}"]`);
    if (card) card.classList.add("done");
}

function removeCard(no) {
    const card = listContainer.querySelector(`.card[data-no="${no}"]`);
    if (card) card.remove();
}

// Toast
function showToast(message, type = "success") {
    const toast = document.getElementById("toast");
    const toastMessage = document.getElementById("toastMessage");
    const toastClose = document.getElementById("toastClose");
    toastMessage.textContent = message;
    toast.className = `toast ${type} show`;
    const timer = setTimeout(() => { toast.className = "toast hidden"; }, 3000);
    toastClose.onclick = () => { clearTimeout(timer); toast.className = "toast hidden"; };
}

// Pagination
function renderPagination() {
    paginationDiv.innerHTML = "";
    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement("button");
        btn.textContent = i;
        if (i === currentPage) btn.classList.add("active");
        btn.addEventListener("click", () => { loadData(i, 10, currentKeyword); });
        paginationDiv.appendChild(btn);
    }
}

// Search
searchBtn.addEventListener("click", () => {
    currentKeyword = searchInput.value.trim();
    loadData(1, 10, currentKeyword);
});

searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") { searchBtn.click(); }
});
// Cek preferensi di localStorage
if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark");
    darkSwitch.textContent = "☀️ Light Mode";
}

// Toggle dark mode
darkSwitch.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    const isDark = document.body.classList.contains("dark");
    localStorage.setItem("darkMode", isDark);
    darkSwitch.textContent = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
});
// Load awal
window.addEventListener("DOMContentLoaded", () => { loadData(); });
