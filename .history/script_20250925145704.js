// Ganti URL_API dengan Web App Google Apps Script kamu
const URL_API = "https://script.google.com/macros/s/AKfycby4z2qZ24SrJkcyGpybH29lSUC_3_z1LG-7wSmTzpaOEXrwjXf0Cl3hqkg95qAxPj1-/exec";

let currentPage = 1;
let limit = localStorage.getItem("limit") || 10;
let currentKeyword = "";

// Ambil data awal
document.addEventListener("DOMContentLoaded", () => {
    // Set dropdown sesuai limit tersimpan
    document.getElementById("limitSelect").value = limit;

    loadData();

    document.getElementById("searchBtn").addEventListener("click", () => {
        currentKeyword = document.getElementById("searchInput").value;
        currentPage = 1;
        loadData();
    });

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

    // Ubah limit data per halaman
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
});

async function loadData() {
    let url;
    if (currentKeyword) {
        url = `${URL_API}?action=searchWaitingList&keyword=${encodeURIComponent(currentKeyword)}&page=${currentPage}&limit=${limit}`;
    } else {
        url = `${URL_API}?action=waitingList&page=${currentPage}&limit=${limit}`;
    }

    try {
        const res = await fetch(url);
        const json = await res.json();

        renderTable(json.data);
        updatePagination(json.page, json.totalPages);
    } catch (err) {
        console.error("Error fetch data:", err);
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

function updatePagination(page, totalPages) {
    document.getElementById("pageInfo").textContent = `Halaman ${page} dari ${totalPages}`;
    document.getElementById("prevBtn").disabled = page <= 1;
    document.getElementById("nextBtn").disabled = page >= totalPages;
}
