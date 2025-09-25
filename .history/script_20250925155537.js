// ============================
// Config
// ============================
const URL_API = "https://script.google.com/macros/s/AKfycby4z2qZ24SrJkcyGpybH29lSUC_3_z1LG-7wSmTzpaOEXrwjXf0Cl3hqkg95qAxPj1-/exec";
const listContainer = document.getElementById("listContainer");
const loader = document.getElementById("loader");
const pagination = document.getElementById("pagination");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const toast = document.getElementById("toast");
const toastMessage = document.getElementById("toastMessage");
const toastClose = document.getElementById("toastClose");

let currentPage = 1;
const limit = 10;

// ============================
// Helpers
// ============================
function showLoader(show = true) {
    loader.classList.toggle("hidden", !show);
}

function showToast(msg) {
    toastMessage.textContent = msg;
    toast.classList.remove("hidden");
}

toastClose.addEventListener("click", () => {
    toast.classList.add("hidden");
});

// ============================
// Skeleton Loader
// ============================
function showSkeleton(count = 5) {
    listContainer.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const skeleton = document.createElement('div');
        skeleton.className = 'skeleton-card';
        listContainer.appendChild(skeleton);
    }
}

// ============================
// Render List
// ============================
function renderList(data) {
    listContainer.innerHTML = '';
    if (data.length === 0) {
        listContainer.innerHTML = '<p>Tidak ada data</p>';
        return;
    }
    data.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <h3>${item.Nama}</h3>
            <p><strong>Alamat:</strong> ${item.Alamat}</p>
            <p><strong>Jualan:</strong> ${item.Jualan}</p>
            <p><strong>Nomor WA:</strong> ${item['Nomor WA']}</p>
        `;
        listContainer.appendChild(card);
    });
}

// ============================
// Render Pagination
// ============================
function renderPagination(total) {
    pagination.innerHTML = '';
    const totalPages = Math.ceil(total / limit);
    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        btn.className = (i === currentPage) ? 'active' : '';
        btn.addEventListener('click', () => {
            currentPage = i;
            fetchData();
        });
        pagination.appendChild(btn);
    }
}

// ============================
// Fetch Data
// ============================
async function fetchData(search = '') {
    showSkeleton(); // tampilkan skeleton
    try {
        const res = await fetch(`${URL_API}?page=${currentPage}&limit=${limit}&search=${encodeURIComponent(search)}`);
        const result = await res.json();

        // Simpan data di sessionStorage agar lebih cepat jika balik halaman
        sessionStorage.setItem(`waitingList-page-${currentPage}-search-${search}`, JSON.stringify(result.data));

        renderList(result.data);
        renderPagination(result.total);
    } catch (err) {
        showToast('Gagal memuat data!');
        console.error(err);
    } finally {
        showLoader(false);
    }
}

// ============================
// Search
// ============================
searchBtn.addEventListener('click', () => {
    currentPage = 1;
    fetchData(searchInput.value.trim());
});

// Load pertama kali
fetchData();
