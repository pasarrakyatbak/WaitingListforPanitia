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
const darkSwitch = document.getElementById("darkSwitch");

let selectedItem = null;
let selectedAction = null;
let selectedCardButton = null;
let currentKeyword = "";
let searchTimeout = null;

let allData = []; // Semua data disimpan di memory
const CARD_HEIGHT = 130; // tinggi per card (px)
const BUFFER = 5; // card buffer sebelum & sesudah viewport

// Loader & Spinner
const showLoader = () => loader.classList.remove("hidden");
const hideLoader = () => loader.classList.add("hidden");
const setButtonLoading = (state) => {
    btnText.textContent = state ? "Memproses..." : "Ya";
    btnSpinner.classList.toggle("hidden", !state);
    confirmBtn.disabled = state;
};

// Fetch all data
async function fetchData(keyword = "") {
    showLoader();
    try {
        const url = keyword
            ? `${URL_API}?action=searchWaitingList&keyword=${encodeURIComponent(keyword)}&limit=1000`
            : `${URL_API}?action=waitingList&limit=1000`;
        const res = await fetch(url);
        const json = await res.json();
        if (json.success) {
            allData = json.data || [];
            renderVirtualList();
        } else {
            listContainer.innerHTML = `<p style="text-align:center;">${json.message || 'Data kosong'}</p>`;
        }
    } catch (err) {
        console.error(err);
        listContainer.innerHTML = `<p style="text-align:center; color:red;">Kesalahan jaringan</p>`;
    } finally {
        hideLoader();
    }
}

// Render card
function createCard(item) {
    const card = document.createElement("div");
    card.className = `card${item.status === "done" ? " done" : ""}`;
    card.dataset.no = item.no;
    card.style.height = CARD_HEIGHT + "px";
    card.innerHTML = `
        <div class="title">${item.no}. ${item.nama}</div>
        <div class="subtitle"><strong>Alamat:</strong> ${item.alamat}</div>
        <div class="subtitle"><strong>Jualan:</strong> ${item.jualan}</div>
        <div class="subtitle"><strong>WA:</strong> ${item.nomor_wa}</div>
        <div class="actions">
            <button class="btn primary">Done <span class="btn-card-spinner hidden"></span></button>
            <button class="btn danger">Hapus <span class="btn-card-spinner hidden"></span></button>
        </div>
    `;
    return card;
}

// Virtual scrolling render
function renderVirtualList() {
    listContainer.innerHTML = "";
    const totalHeight = allData.length * CARD_HEIGHT;
    const spacer = document.createElement("div");
    spacer.style.height = totalHeight + "px";
    spacer.id = "spacer";
    listContainer.appendChild(spacer);

    function updateVisibleCards() {
        const scrollTop = listContainer.scrollTop;
        const containerHeight = listContainer.clientHeight;
        const startIndex = Math.max(0, Math.floor(scrollTop / CARD_HEIGHT) - BUFFER);
        const endIndex = Math.min(allData.length, Math.ceil((scrollTop + containerHeight) / CARD_HEIGHT) + BUFFER);

        const fragment = document.createDocumentFragment();
        for (let i = startIndex; i < endIndex; i++) {
            const item = allData[i];
            const card = createCard(item);
            card.style.position = "absolute";
            card.style.top = i * CARD_HEIGHT + "px";
            fragment.appendChild(card);
        }
        // hapus semua card lama kecuali spacer
        listContainer.querySelectorAll(".card").forEach(c => c.remove());
        listContainer.appendChild(fragment);
    }

    listContainer.addEventListener("scroll", () => requestAnimationFrame(updateVisibleCards));
    updateVisibleCards(); // render awal
}

// Event delegation untuk tombol Done/Hapus
listContainer.addEventListener("click", (e) => {
    const card = e.target.closest(".card");
    if (!card) return;
    const item = allData.find(i => i.no == card.dataset.no);
    if (!item) return;

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

// Modal cancel & confirm
cancelBtn.addEventListener("click", resetModal);
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
            if (selectedAction === "done") selectedItem.status = "done";
            else allData = allData.filter(i => i.no != selectedItem.no);
            renderVirtualList();
        }
    } catch (err) { console.error(err); }
    finally { setButtonLoading(false); spinnerCard.classList.add("hidden"); selectedCardButton.disabled = false; resetModal(); }
});

function resetModal() {
    modal.classList.add("hidden");
    selectedItem = null;
    selectedAction = null;
    selectedCardButton = null;
}

// Search dengan debounce
searchBtn.addEventListener("click", triggerSearch);
searchInput.addEventListener("input", triggerSearch);
function triggerSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        currentKeyword = searchInput.value.trim();
        fetchData(currentKeyword);
    }, 300);
}

// Dark mode
if (localStorage.getItem("darkMode") === "true") document.body.classList.add("dark");
darkSwitch.addEventListener("click", () => {
    const isDark = document.body.classList.toggle("dark");
    localStorage.setItem("darkMode", isDark);
    darkSwitch.textContent = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
});

// Load awal
window.addEventListener("DOMContentLoaded", () => fetchData());
