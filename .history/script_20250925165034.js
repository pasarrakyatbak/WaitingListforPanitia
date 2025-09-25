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
let searchTimeout = null;

let allData = []; // cache semua data

// Loader & Spinner
const showLoader = () => loader.classList.remove("hidden");
const hideLoader = () => loader.classList.add("hidden");
const setButtonLoading = (state) => {
    btnText.textContent = state ? "Memproses..." : "Ya";
    btnSpinner.classList.toggle("hidden", !state);
    confirmBtn.disabled = state;
};

// Fetch data dari API sekali saja
async function fetchData(limit = 1000) {
    const url = `${URL_API}?action=waitingList&page=1&limit=${limit}`;
    const res = await fetch(url);
    return res.json();
}

// Load data (dengan filter lokal)
async function loadData(page = 1, limit = 10, keyword = "") {
    showLoader();
    try {
        // fetch hanya sekali saat awal
        if (allData.length === 0) {
            const json = await fetchData(1000); // ambil banyak sekaligus
            if (json.success) {
                allData = json.data;
            } else {
                listContainer.innerHTML = `<p style="text-align:center;">Data kosong</p>`;
                hideLoader();
                return;
            }
        }

        // filter lokal
        const filtered = keyword
            ? allData.filter(item =>
                item.nama.toLowerCase().includes(keyword.toLowerCase()) ||
                item.alamat.toLowerCase().includes(keyword.toLowerCase()) ||
                item.jualan.toLowerCase().includes(keyword.toLowerCase())
            )
            : allData;

        // pagination manual
        totalPages = Math.ceil(filtered.length / limit) || 1;
        const start = (page - 1) * limit;
        const end = start + limit;
        const paginated = filtered.slice(start, end);

        listContainer.innerHTML = "";
        if (paginated.length) {
            const fragment = document.createDocumentFragment();
            paginated.forEach(item => fragment.appendChild(createCard(item)));
            listContainer.appendChild(fragment);
            currentPage = page;
            renderPagination();
        } else {
            listContainer.innerHTML = `<p style="text-align:center;">Data tidak ditemukan</p>`;
            paginationDiv.innerHTML = "";
        }
    } catch (err) {
        console.error("Error loadData:", err);
        listContainer.innerHTML = `<p style="text-align:center; color:red;">Kesalahan jaringan</p>`;
        paginationDiv.innerHTML = "";
    } finally {
        hideLoader();
    }
}

// Create card




// Event delegation untuk tombol Done/Hapus
listContainer.addEventListener("click", (e) => {
    const card = e.target.closest(".card");
    if (!card) return;
    const item = {
        no: card.dataset.no,
        nama: card.querySelector(".title").textContent.split(". ")[1]
    };
    if (e.target.closest(".btn.primary")) {
        selectedItem = item;
        selectedAction = "done";
        selectedCardButton = e.target.closest(".btn.primary");
        modalMessage.textContent = `Tandai "${item.nama}" sebagai Done?`;
        modal.classList.remove("hidden");
    } else if (e.target.closest(".btn.danger")) {
        selectedItem = item;
        selectedAction = "delete";
        selectedCardButton = e.target.closest(".btn.danger");
        modalMessage.textContent = `Hapus "${item.nama}" dari waiting list?`;
        modal.classList.remove("hidden");
    }
});

// Modal cancel
cancelBtn.addEventListener("click", resetModal);

// Modal confirm
confirmBtn.addEventListener("click", async () => {
    if (!selectedItem || !selectedAction) return resetModal();
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
            showToast(`"${selectedItem.nama}" berhasil ${selectedAction === "done" ? 'ditandai Done ✅' : 'dihapus ❌'}`, "success");

            // 🔑 refresh data supaya sesuai dengan sheet
            allData = [];
            await loadData(currentPage, 10, currentKeyword);
        } else {
            showToast(json.message || "Gagal update data", "error");
        }
    } catch (err) {
        console.error("Error confirm:", err);
        showToast("Kesalahan jaringan", "error");
    } finally {
        setButtonLoading(false);
        spinnerCard.classList.add("hidden");
        selectedCardButton.disabled = false;
        resetModal();
    }
});

function resetModal() {
    modal.classList.add("hidden");
    selectedItem = null;
    selectedAction = null;
    selectedCardButton = null;
}

// Update card
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
        btn.addEventListener("click", () => loadData(i, 10, currentKeyword));
        paginationDiv.appendChild(btn);
    }
}

// Search dengan debounce (filter lokal)
searchBtn.addEventListener("click", () => triggerSearch());
searchInput.addEventListener("input", () => triggerSearch());
function triggerSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        currentKeyword = searchInput.value.trim();
        loadData(1, 10, currentKeyword);
    }, 300);
}

// Dark mode
if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark");
    darkSwitch.classList.add("active"); // tampilkan icon matahari
}

darkSwitch.addEventListener("click", () => {
    const isDark = document.body.classList.toggle("dark");
    localStorage.setItem("darkMode", isDark);
    darkSwitch.classList.toggle("active", isDark);
});

// Load awal
window.addEventListener("DOMContentLoaded", () => loadData());
