const URL_API = "https://script.google.com/macros/s/AKfycby4z2qZ24SrJkcyGpybH29lSUC_3_z1LG-7wSmTzpaOEXrwjXf0Cl3hqkg95qAxPj1-/exec";

const listContainer = document.getElementById("listContainer");
const modal = document.getElementById("modal");
const modalMessage = document.getElementById("modalMessage");
const confirmBtn = document.getElementById("confirmBtn");
const cancelBtn = document.getElementById("cancelBtn");

let selectedItem = null;
let selectedAction = null;

async function loadData(page = 1, limit = 10, keyword = "") {
    let url;
    if (keyword && keyword.trim() !== "") {
        url = `${URL_API}?action=searchWaitingList&keyword=${encodeURIComponent(keyword)}&page=${page}&limit=${limit}`;
    } else {
        url = `${URL_API}?action=waitingList&page=${page}&limit=${limit}`;
    }

    try {
        const res = await fetch(url);
        const json = await res.json();
        if (json.success) {
            listContainer.innerHTML = "";
            json.data.forEach(item => {
                renderCard(item);
            });
        } else {
            listContainer.innerHTML = `<p style="text-align:center;">${json.message || 'Gagal mengambil data'}</p>`;
        }
    } catch (err) {
        console.error("Error loadData:", err);
        listContainer.innerHTML = `<p style="text-align:center; color:red;">Terjadi kesalahan jaringan</p>`;
    }
}

// Membuat card
function renderCard(item) {
    const card = document.createElement("div");
    card.classList.add("card");
    if (item.status === "done") {
        card.classList.add("done");
    }
    card.dataset.no = item.no;

    // isi konten
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

    // Event tombol Done
    card.querySelector(".btn.primary").addEventListener("click", () => {
        selectedItem = item;
        selectedAction = "done";
        modalMessage.textContent = `Tandai "${item.nama}" sebagai Done?`;
        modal.classList.remove("hidden");
    });

    // Event tombol Hapus
    card.querySelector(".btn.danger").addEventListener("click", () => {
        selectedItem = item;
        selectedAction = "delete";
        modalMessage.textContent = `Hapus "${item.nama}" dari waiting list?`;
        modal.classList.remove("hidden");
    });

    listContainer.appendChild(card);
}

// Modal tombol batal
cancelBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
    selectedItem = null;
    selectedAction = null;
});

// Modal tombol konfirmasi
confirmBtn.addEventListener("click", async () => {
    if (!selectedItem || !selectedAction) {
        modal.classList.add("hidden");
        return;
    }
    let actionApi = "";
    if (selectedAction === "done") actionApi = "approveWaitingList";
    if (selectedAction === "delete") actionApi = "deleteWaitingList";

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
    }
    modal.classList.add("hidden");
});

// Ubah card menjadi Done
function markAsDone(no) {
    const card = listContainer.querySelector(`.card[data-no="${no}"]`);
    if (card) {
        card.classList.add("done");
    }
}

// Hapus card dari UI
function removeCard(no) {
    const card = listContainer.querySelector(`.card[data-no="${no}"]`);
    if (card) {
        card.remove();
    }
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

// Jalankan loadData saat halaman terbuka
window.addEventListener("DOMContentLoaded", () => {
    loadData();
});
