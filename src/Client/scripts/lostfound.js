document.addEventListener("DOMContentLoaded", () => {
  const modalOverlay = document.getElementById("reportModal");
  const reportForm = document.getElementById("reportForm");
  const openBtn = document.getElementById("openReportModal");
  const cancelBtn = document.getElementById("cancelReport");
  const closeModalBtn = document.getElementById("closeModalBtn"); // Target the 'X' button

  const userId = sessionStorage.getItem("user_id");
  const userRole = sessionStorage.getItem("user_role");

  // OPEN MODAL

  openBtn.addEventListener("click", (e) => {
    e.preventDefault();
    reportForm.reset();
    modalOverlay.classList.remove("hidden"); // FIX: Use remove("hidden") to show
  });

  // CLOSE MODAL (Cancel Button & X)

  const closeModalFn = (e) => {
    if (e) e.preventDefault();
    modalOverlay.classList.add("hidden"); // FIX: Use add("hidden") to hide
  };

  cancelBtn.addEventListener("click", closeModalFn);
  // Listener for the 'X' button
  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", closeModalFn);
  }

  // Close when clicking outside modal
  window.addEventListener("click", (e) => {
    if (e.target === modalOverlay) closeModalFn();
  });

  // Tabs

  document.querySelectorAll(".lf-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document
        .querySelector(".lf-tab-active")
        .classList.remove("lf-tab-active");
      tab.classList.add("lf-tab-active");

      const lost = document.getElementById("lostList");
      const found = document.getElementById("foundList");

      lost.classList.add("lf-hidden");
      found.classList.add("lf-hidden");

      if (tab.dataset.tab === "lost") lost.classList.remove("lf-hidden");
      else found.classList.remove("lf-hidden");
    });
  });

  // Load Items

  async function loadItems() {
    try {
      const lostRes = await fetch("http://localhost:3000/lostfound/lost");
      const foundRes = await fetch("http://localhost:3000/lostfound/found");

      const lostItems = await lostRes.json();
      const foundItems = await foundRes.json();

      document.getElementById("lostCount").innerText = lostItems.length;
      document.getElementById("foundCount").innerText = foundItems.length;

      renderItems("lostList", lostItems);
      renderItems("foundList", foundItems);
    } catch (err) {
      console.error("LOAD ERROR:", err);
    }
  }

  // Render Cards

  function renderItems(id, items) {
    const box = document.getElementById(id);
    box.innerHTML = "";

    if (!items.length) {
      box.innerHTML = `<p class="lf-empty-text">Nothing reported yet.</p>`;
      return;
    }

    items.forEach((item) => {
      const imgURL = item.image_path
        ? `http://localhost:3000/uploads/lost-and-found/${item.image_path}`
        : "../assets/no-image.png";

      box.innerHTML += `
        <div class="lf-card">
          <img src="${imgURL}" />
          <div>
            <h3>${item.title}</h3>
            <p>${item.description}</p>
            <p><strong>Category:</strong> ${item.category}</p>
            <p><strong>Reported:</strong> ${new Date(
              item.report_date
            ).toLocaleString()}</p>
            <p><strong>Reported by:</strong> ${
              item.reporter_email || "Unknown"
            }</p>

            ${
              userRole === "admin"
                ? `
              <div class="lf-admin-actions">
                <button onclick="resolveItem(${item.item_id})" class="lf-resolve-btn">Resolve</button>
                <button onclick="deleteItem(${item.item_id})" class="lf-delete-btn">Delete</button>
              </div>
            `
                : ""
            }
          </div>
        </div>`;
    });
  }

  // Submit New Item

  reportForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("title", document.getElementById("itemTitle").value);
    formData.append(
      "description",
      document.getElementById("itemDescription").value
    );
    formData.append("category", document.getElementById("itemCategory").value);
    formData.append("item_type", document.getElementById("itemStatus").value);
    formData.append("reporter_id", userId);
    formData.append("image", document.getElementById("itemImage").files[0]);

    await fetch("http://localhost:3000/lostfound", {
      method: "POST",
      body: formData,
    });

    modalOverlay.classList.add("hidden"); // FIX: Hide on success
    reportForm.reset();
    loadItems();
  });

  // Admin Actions

  window.resolveItem = async (id) => {
    await fetch(`http://localhost:3000/lostfound/${id}/resolve`, {
      method: "PUT",
    });
    loadItems();
  };

  window.deleteItem = async (id) => {
    await fetch(`http://localhost:3000/lostfound/${id}`, { method: "DELETE" });
    loadItems();
  };

  loadItems();
});
