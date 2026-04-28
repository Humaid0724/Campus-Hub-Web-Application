// --- 1. Define global variables ---
let userRole = null;
let userId = null;

// --- 2. Main Setup (runs once DOM is loaded) ---
document.addEventListener("DOMContentLoaded", () => {
  // Set the global variables
  userRole = sessionStorage.getItem("user_role");
  userId = sessionStorage.getItem("user_id");

  // Debug: Check what's in sessionStorage
  console.log("DEBUG - user_role:", userRole);
  console.log("DEBUG - user_id:", userId);

  // Add login check
  if (!userRole || !userId) {
    alert("You must be logged in to view this page.");
    window.location.href = "login.html";
    return;
  }

  // --- Role-based UI (Page specific) ---
  setupRoleUI();

  // --- Setup Listeners ---
  setupModalListeners();
  setupTabListeners();

  // --- Initial Load ---
  loadResources();
});

// --- 3. Role-Specific UI ---
function setupRoleUI() {
  const pendingTab = document.getElementById("pendingTab");
  if (userRole === "admin") {
    pendingTab.style.display = "block"; // Show the "Pending" tab for admins
    console.log("DEBUG - Showing admin controls for Resources");
  } else {
    pendingTab.style.display = "none";
  }
}

// --- 4. Modal & Form Logic ---
function setupModalListeners() {
  const modal = document.getElementById("resourceModal");
  const openBtn = document.getElementById("openShareModal"); // Corrected ID
  const closeBtn = document.getElementById("closeModalBtn"); // Correct ID for 'X' button
  const form = document.getElementById("resourceForm");

  // Open modal
  openBtn.addEventListener("click", () => {
    form.reset();
    modal.classList.remove("hidden"); // FIX: Use remove("hidden") to show
  });

  // Close modal
  const closeModal = () => {
    modal.classList.add("hidden"); // FIX: Use add("hidden") to hide
  };

  closeBtn.addEventListener("click", closeModal);
  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Handle Form Submission
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = form.querySelector('input[name="title"]').value;
    if (!title) {
      alert("Please enter a title for the resource.");
      return;
    }

    // Use FormData to send file + text
    const formData = new FormData();
    formData.append("title", title);
    formData.append(
      "description",
      form.querySelector('textarea[name="description"]').value
    );
    formData.append("sharer_id", userId); // Use global userId

    const fileInput = form.querySelector('input[name="file"]');
    if (fileInput.files.length > 0) {
      formData.append("file", fileInput.files[0]);
    }

    try {
      const response = await fetch("http://localhost:3000/resources", {
        method: "POST",
        body: formData, // No Content-Type header needed, browser sets it
      });

      const data = await response.json();
      alert(data.message); // Show success message from server

      if (response.ok) {
        closeModal();
        loadResources(); // Refresh both lists
      }
    } catch (error) {
      console.error("Error sharing resource:", error);
      alert("Server connection failed.");
    }
  });
}

// --- 5. Tab Listeners ---
function setupTabListeners() {
  document.querySelectorAll(".lf-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      // Deactivate old tab
      document
        .querySelector(".lf-tab-active")
        .classList.remove("lf-tab-active");
      // Activate new tab
      tab.classList.add("lf-tab-active");

      const activeList = tab.dataset.tab; // "approved" or "pending"

      if (activeList === "approved") {
        document.getElementById("approvedList").classList.remove("lf-hidden");
        document.getElementById("pendingList").classList.add("lf-hidden");
      } else {
        document.getElementById("approvedList").classList.add("lf-hidden");
        document.getElementById("pendingList").classList.remove("lf-hidden");
      }
    });
  });
}

// --- 6. Load & Display Resources (Global) ---
async function loadResources() {
  try {
    // Fetch both approved and pending
    const [approvedRes, pendingRes] = await Promise.all([
      fetch("http://localhost:3000/resources/approved"),
      fetch("http://localhost:3000/resources/pending"),
    ]);

    const approvedItems = await approvedRes.json();
    const pendingItems = await pendingRes.json();

    // Update counts
    document.getElementById("approvedCount").innerText = approvedItems.length;
    document.getElementById("pendingCount").innerText = pendingItems.length;

    // Render lists
    renderResources("approvedList", approvedItems, false); // false = not admin list
    renderResources("pendingList", pendingItems, true); // true = is admin list
  } catch (error) {
    console.error("Error loading resources:", error);
    document.getElementById("approvedList").innerHTML =
      '<p class="lf-empty-text">Failed to load resources.</p>';
  }
}

// --- 7. Render Helper (Global) ---
function renderResources(listId, items, isAdminList) {
  const listElement = document.getElementById(listId);
  listElement.innerHTML = ""; // Clear list

  if (items.length === 0) {
    const message = isAdminList
      ? "No resources are awaiting approval."
      : "No approved resources available yet.";
    listElement.innerHTML = `<p class="lf-empty-text">${message}</p>`;
    return;
  }

  items.forEach((item) => {
    // Create download link if file exists
    const fileLink = item.file_path
      ? `<a href="http://localhost:3000/uploads/resources/${item.file_path}" target="_blank" class="lf-resolve-btn" style="background-color: #3b82f6; text-decoration: none;">Download File</a>`
      : "<p><em>(No file attached)</em></p>";

    // Use lostfound card style (lf-card)
    listElement.innerHTML += `
      <div class="lf-card">
        <div class="lf-info" style="width: 100%;">
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.description)}</p>
          <p><strong>Shared by:</strong> ${escapeHtml(item.sharer_name)}</p>
          <p><strong>Date:</strong> ${new Date(
            item.upload_date
          ).toLocaleString()}</p>
          
          <div class="lf-admin-actions" style="margin-top: 10px; display: flex; gap: 10px; align-items: center;">
            ${fileLink}
            
            ${
              isAdminList
                ? `
              <button onclick="approveResource(${item.resource_id})" class="lf-resolve-btn">Approve</button>
              <button onclick="deleteResource(${item.resource_id})" class="lf-delete-btn">Reject</button>
            `
                : ""
            }
          </div>
        </div>
      </div>
    `;
  });
}

// --- 8. Admin Actions (Global) ---
window.approveResource = async (id) => {
  if (!confirm("Are you sure you want to approve this resource?")) return;
  try {
    const response = await fetch(
      `http://localhost:3000/resources/${id}/approve`,
      {
        method: "PUT",
      }
    );
    if (response.ok) {
      alert("Resource approved!");
      loadResources(); // Refresh lists
    } else {
      alert("Failed to approve resource.");
    }
  } catch (error) {
    console.error("Approve error:", error);
    alert("Server connection failed.");
  }
};

window.deleteResource = async (id) => {
  if (!confirm("Are you sure you want to reject/delete this resource?")) return;
  try {
    const response = await fetch(`http://localhost:3000/resources/${id}`, {
      method: "DELETE",
    });
    if (response.ok) {
      alert("Resource deleted!");
      loadResources(); // Refresh lists
    } else {
      alert("Failed to delete resource.");
    }
  } catch (error) {
    console.error("Delete error:", error);
    alert("Server connection failed.");
  }
};

// --- 9. Utility Function (Global) ---
function escapeHtml(text) {
  if (text === null || text === undefined) return ""; // Fix for null values
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
