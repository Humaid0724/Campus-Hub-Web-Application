// --- 1. Define global variables ---
// These will be set once the DOM is loaded.
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

  // Add login check (good practice)
  if (!userRole || !userId) {
    alert("You must be logged in to view this page.");
    window.location.href = "login.html";
    return;
  }

  // --- Role-based UI (Page specific) ---
  // nav.js handles the navbar, so we only need to show/hide the create button
  const createNoticeBtn = document.getElementById("openCreateModal");
  if (userRole === "admin") {
    createNoticeBtn.style.display = "inline-block";
    console.log("DEBUG - Showing admin controls");
  } else {
    createNoticeBtn.style.display = "none";
    console.log("DEBUG - Hiding admin controls");
  }

  // --- Setup Listeners ---
  // We call the modal setup function (defined globally below)
  setupModalListeners();

  // --- Initial Load ---
  // We call the main data load function (defined globally below)
  loadNotices();
});

// --- 3. Modal & Form Logic (Global Function) ---
// This is now outside DOMContentLoaded so it's cleanly organized.
function setupModalListeners() {
  const createModal = document.getElementById("createModal");
  const createForm = document.getElementById("createNoticeForm");
  const cancelCreateBtn = document.getElementById("cancelCreate");
  const createNoticeBtn = document.getElementById("openCreateModal");
  const closeModalBtn = document.getElementById("closeModal"); // Target the 'X' button

  // Open create modal
  createNoticeBtn.addEventListener("click", () => {
    if (userRole === "admin") {
      // Checks global userRole
      createModal.classList.remove("hidden"); // FIX: Use remove("hidden") to show
    }
  });

  // Close create modal
  const closeModal = () => {
    createModal.classList.add("hidden"); // FIX: Use add("hidden") to hide
    createForm.reset();
  };

  cancelCreateBtn.addEventListener("click", closeModal);
  closeModalBtn.addEventListener("click", closeModal); // FIX: Add listener for the X button

  createModal.addEventListener("click", (e) => {
    if (e.target === createModal) closeModal();
  });

  // Create notice form submission
  createForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = document.getElementById("noticeTitle").value.trim();
    const content = document.getElementById("noticeContent").value.trim();

    if (!title || !content) {
      alert("Please fill in all fields");
      return;
    }

    try {
      // Port is 3000
      const response = await fetch("http://localhost:3000/notices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          content,
          admin_id: userId, // Uses global userId
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Notice created successfully!");
        closeModal();
        loadNotices(); // Calls global loadNotices() to reload
      } else {
        alert(data.message || "Failed to create notice");
      }
    } catch (error) {
      console.error("Error creating notice:", error);
      alert("Server connection failed");
    }
  });
}

// --- 4. Load & Display Notices (Global Function) ---
// MOVED outside DOMContentLoaded so window.deleteNotice can call it.
async function loadNotices() {
  const noticesList = document.getElementById("noticesList");

  try {
    // Port is 3000
    const response = await fetch("http://localhost:3000/notices");
    const notices = await response.json();

    if (notices.length === 0) {
      noticesList.innerHTML =
        '<p class="notice-empty-text">No notices posted yet.</p>';
      return;
    }

    // Sort: pinned first, then by date (newest first)
    notices.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.post_date) - new Date(a.post_date);
    });

    noticesList.innerHTML = notices
      .map(
        (notice) => `
      <div class="notice-card ${notice.pinned ? "pinned" : ""}" data-id="${
          notice.notice_id
        }">
        <div class="notice-header-info">
          <h3 class="notice-title-text">${escapeHtml(notice.title)}</h3>
          ${notice.pinned ? '<span class="notice-pin-badge">PINNED</span>' : ""}
        </div>
        <p class="notice-content">${escapeHtml(notice.content)}</p>
        <div class="notice-meta">
          <span>Posted: ${new Date(notice.post_date).toLocaleString()}</span>
          <span>By: ${escapeHtml(notice.admin_email)}</span>
        </div>
        ${
          userRole === "admin"
            ? `
          <div class="notice-admin-actions">
            <button class="delete-btn" onclick="deleteNotice(${
              notice.notice_id
            })">
              <i class="fa-solid fa-trash"></i> Delete
            </button>
            <button class="pin-btn ${
              notice.pinned ? "unpin" : ""
            }" onclick="togglePin(${notice.notice_id}, ${!notice.pinned})">
              <i class="fa-solid fa-thum_btack"></i> ${
                notice.pinned ? "Unpin" : "Pin"
              }
            </button>
          </div>
        `
            : ""
        }
      </div>
    `
      )
      .join("");
  } catch (error) {
    console.error("Error loading notices:", error);
    noticesList.innerHTML =
      '<p class="notice-empty-text">Failed to load notices. Please try again later.</p>';
  }
}

// --- 5. Admin Actions (Global) ---
// These are already global, but now they can successfully call loadNotices().
window.deleteNotice = async (noticeId) => {
  if (!confirm("Are you sure you want to delete this notice?")) return;

  try {
    // Port is 3000
    const response = await fetch(`http://localhost:3000/notices/${noticeId}`, {
      method: "DELETE",
    });

    if (response.ok) {
      alert("Notice deleted successfully!");
      loadNotices(); // This call now works
    } else {
      const data = await response.json();
      alert(data.message || "Failed to delete notice");
    }
  } catch (error) {
    console.error("Error deleting notice:", error);
    alert("Server connection failed");
  }
};

window.togglePin = async (noticeId, pinStatus) => {
  try {
    // Port is 3000
    const response = await fetch(
      `http://localhost:3000/notices/${noticeId}/pin`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pinned: pinStatus }),
      }
    );

    if (response.ok) {
      loadNotices(); // This call now works
    } else {
      const data = await response.json();
      alert(data.message || "Failed to update pin status");
    }
  } catch (error) {
    console.error("Error updating pin status:", error);
    alert("Server connection failed");
  }
};

// --- 6. Utility Function (Global) ---
// MOVED outside DOMContentLoaded so loadNotices() can call it.
function escapeHtml(text) {
  if (text === null || text === undefined) return ""; // Fix for null values
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
