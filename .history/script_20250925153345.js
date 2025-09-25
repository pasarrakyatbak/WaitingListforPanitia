const URL_API = "https://script.google.com/macros/s/AKfycby4z2qZ24SrJkcyGpybH29lSUC_3_z1LG-7wSmTzpaOEXrwjXf0Cl3hqkg95qAxPj1-/exec";

const listContainer = document.getElementById("listContainer");
const modal = document.getElementById("modal");
const modalMessage = document.getElementById("modalMessage");
const confirmBtn = document.getElementById("confirmBtn");
const cancelBtn = document.getElementById("cancelBtn");
const loader = document.getElementById("loader");

const btnText = confirmBtn.querySelector(".btn-text");
const btnSpinner = confirmBtn.querySelector(".btn-spinner");

let selectedItem = null;
let selectedAction = null;

// Loader global
function showLoader() { loader.classList.remove("hidden"); }
function hideLoader() { loader.classList.add("hidden"); }

// Loader kecil di tombol konfirmasi
function setButtonLoading(state) {
    if (state) {
        btnText.textContent = "Memproses...";
        btnSpinner.classList.remove("hidden");
        confirmBtn.disabled = true;
    } else {
        btnText.textContent = "Ya";
        btnSpinner.classList.add("hidden");
        confirmBtn.disabled = false;
    }
}

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
        } else {
            listContainer.innerHTML = `<p style="text-align:center;">${json.message || 'Gagal mengambil data'}</p>`;
        }
    } catch (err) {
        console.error("Error loadData:", err);
        listContainer.innerHTML = `<p style="text-align:center; color:red;">Terjadi kesalahan jaringan</p>`;
    } finally {
        hideLoader();
    }
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
        <button class="btn primary">Done</button>
        <button class="btn danger">Hapus</button>
      </div>
    `;

    card.querySelector(".btn.primary").addEventListener("click", () => {
        selectedItem = item;
        selectedAction = "done";
        modalMessage.textContent = `Tandai "${item.nama}" sebagai Done?`;
        modal.classList.remove("hidden");
    });

    card.querySelector(".btn.danger").addEventListener("click", () => {
        selectedItem = item;
        selectedAction = "delete";
        modalMessage.textContent = `Hapus "${item.nama}" dari waiting list?`;
        modal.classList.remove("hidden");
    });

    listContainer.appendChild(card);
}

// Modal batal
cancelBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
    selectedItem = null;
    selectedAction = null;
});

// Modal konfirmasi
confirmBtn.addEventListener("click", async () => {
    if (!selectedItem || !selectedAction) {
        modal.classList.add("hidden");
        return;
    }
    let actionApi = selectedAction === "done" ? "approveWaitingList" : "deleteWaitingList";

    setButtonLoading(true);
    try {
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
            } else {
                removeCard(selectedItem.no);
                showToast(`"${selectedItem.nama}" berhasil dihapus ❌`, "success");
            }
        } else {
            showToast(json.message || "Gagal update data", "error");
        }
    } catch (err) {
        console.error("Error confirm:", err);
        showToast("Kesalahan jaringan", "error");
    } finally {
        setButtonLoading(false);
        modal.classList.add("hidden");
    }
});

// Tandai Done
function markAsDone(no) {
    const card = listContainer.querySelector(`.card[data-no="${no}"]`);
    if (card) card.classList.add("done");
}

// Hapus card
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

    const timer = setTimeout(() => {
        toast.className = "toast hidden";
    }, 3000);

    toastClose.onclick = () => {
        clearTimeout(timer);
        toast.className = "toast hidden";
    };
}

window.addEventListener("DOMContentLoaded", () => {
    loadData();
});
