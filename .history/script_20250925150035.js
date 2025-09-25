// Ganti URL_API dengan Web App Google Apps Script kamu
const URL_API = "https://script.google.com/macros/s/AKfycby4z2qZ24SrJkcyGpybH29lSUC_3_z1LG-7wSmTzpaOEXrwjXf0Cl3hqkg95qAxPj1-/exec";

let currentPage = 1;
let limit = localStorage.getItem("limit") || 10;
let currentKeyword = "";
let isCardView = false;

// Saat DOM siap
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("limitSelect").value = limit;

    // Cek preferensi view di localStorage
    if (localStorage.getItem("viewMode")) {
        isCardView = localStorage.getItem("viewMode") === "card";
    } else {
        // Kalau belum ada, cek ukuran layar
        isCardView = window.innerWidth < 768;
    }
    setViewMode(isCardView);

    loadData();

    // Search
    document.getElementById("searchBtn").addEventListener("click", () => {
        currentKeyword = document.getElementById("searchInput").value.trim();
        currentPage = 1;
        loadData();
    });

    // Prev Next
    document.getElementById("prevBtn").addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            loadData();
        }
    });

    document.getElementById("nextBtn").addEventListener("click", () => {
        currentPage++;
        loadData();
    });

    // Ubah limit
    document.getElementById("limitSelect").addEventListener("change", (e) => {
        limit = e.target.value;
        localStorage.setItem("limit", limit);
        currentPage = 1;
        loadData();
    });

    // Dark mode toggle
    const darkToggle = document.getElementById("darkToggle");
    const darkIcon = document.getElementById("darkIcon");
    darkToggle.addEventListener("click", () => {
        document.body.classList.toggle("dark");
        if (document.body.classList.contains("dark")) {
            darkIcon.textContent = "light_mode";
            localStorage.setItem("theme", "dark");
        } else {
            darkIcon.textContent = "dark_mode";
            localStorage.setItem("theme", "light");
        }
    });

    // Load saved theme
    if (localStorage.getItem("theme") === "dark") {
        document.body.classList.add("dark");
        darkIcon.textContent = "light_mode";
    }

    // Toggle view manual
    document.getElementById("toggleViewBtn").addEventListener("click", () => {
        isCardView = !isCardView;
        localStorage.setItem("viewMode", isCardView ? "card" : "table");
        setViewMode(isCardView);
        loadData();
    });
});

function setViewMode(cardMode) {
    document.getElementById("tableView").classList.toggle("hidden", cardMode);
    document.getElementById("cardView").classList.toggle("hidden", !cardMode);

    document.querySelector("#toggleViewBtn span").textContent =
        cardMode ? "table_chart" : "view_module";
}

function showSpinner() {
    document.getElementById("loadingSpinner").classList.remove("hidden");
}
function hideSpinner() {
    document.getElementById("loadingSpinner").classList.add("hidden");
}

async function loadData() {
    let url = currentKeyword
        ? `${URL_API}?action=searchWaitingList&keyword=${encodeURIComponent(currentKeyword)}&page=${currentPage}&limit=${limit}`
        : `${URL_API}?action=waitingList&page=${currentPage}&limit=${limit}`;

    try {
        showSpinner();
        const res = await fetch(url);
        const json = await res.json();

        if (isCardView) {
            renderCardView(json.data);
        } else {
            renderTable(json.data);
        }

        updatePagination(json.page, json.totalPages);
    } catch (err) {
        console.error("Error fetch data:", err);
    } finally {
        hideSpinner();
    }
}

function renderTable(data) {
    const tbody = document.getElementById("tableBody");
    tbody.innerHTML = "";

    if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Tidak ada data</td></tr>`;
        return;
    }

    data.forEach(item => {
        const row = `
      <tr>
        <td>${item.no}</td>
        <td>${item.nama}</td>
        <td>${item.alamat}</td>
        <td>${item.jualan}</td>
        <td><a href="https://wa.me/${item.nomor_wa}" target="_blank">${item.nomor_wa}</a></td>
      </tr>
    `;
        tbody.innerHTML += row;
    });
}

function renderCardView(data) {
    const container = document.getElementById("cardView");
    container.innerHTML = "";

    if (!data || data.length === 0) {
        container.innerHTML = `<p style="grid-column:1/-1; text-align:center;">Tidak ada data</p>`;
        return;
    }

    data.forEach(item => {
        const card = `
      <div class="card">
        <h3>${item.no}. ${item.nama}</h3>
        <p><strong>Alamat:</strong> ${item.alamat}</p>
        <p><strong>Jualan:</strong> ${item.jualan}</p>
        <a href="https://wa.me/${item.nomor_wa}" target="_blank">
          <span class="material-icons" style="vertical-align:middle;">chat</span> Hubungi
        </a>
      </div>
    `;
        container.innerHTML += card;
    });
}

function updatePagination(page, totalPages) {
    document.getElementById("pageInfo").textContent = `Halaman ${page} dari ${totalPages}`;
    document.getElementById("prevBtn").disabled = page <= 1;
    document.getElementById("nextBtn").disabled = page >= totalPages;
}
