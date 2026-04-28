// PAGE LOAD & ROLE CHECK

document.addEventListener("DOMContentLoaded", () => {
  // 1. Get user data
  const userRole = sessionStorage.getItem("user_role");
  const userEmail = sessionStorage.getItem("user_email");

  if (!userRole || !userEmail) {
    alert("You must be logged in to view this page.");
    window.location.href = "login.html";
    return;
  }

  // 2. Setup the dynamic page elements
  setupDynamicNavbar(userRole, userEmail);

  // 3. Load the correct content based on role
  if (userRole === "admin") {
    renderAdminView();
  } else {
    renderStudentView();
  }

  // 4. Attach listeners for the modal
  setupModalListeners();
});

/**
 * Fills in the navbar with the correct role pill and avatar links
 */
function setupDynamicNavbar(userRole, userEmail) {
  const rolePillContainer = document.getElementById("role-pill-container");
  const avatarInitial = document.getElementById("avatar-initial");
  const avatarMenu = document.getElementById("avatar-menu-links");
  const dashboardLink = document.querySelector('.nav-menu a[href="#"]');

  avatarInitial.textContent = userEmail.charAt(0).toUpperCase();

  if (userRole === "admin") {
    rolePillContainer.innerHTML = `
      <span class="role-pill role-admin">
        <i class="fa-solid fa-crown"></i> Admin
      </span>
    `;
    avatarMenu.innerHTML = `
      <span class="avatar-menu-label">Signed in as Admin</span>
      <a href="./profile.html" class="avatar-menu-link">Profile</a>
      <a href="login.html" class="avatar-menu-link logout-link">Logout</a>
    `;
    dashboardLink.href = "admin_home.html";
  } else {
    rolePillContainer.innerHTML = `
      <span class="role-pill role-student">
        <i class="fa-solid fa-user-graduate"></i> Student
      </span>
    `;
    avatarMenu.innerHTML = `
      <span class="avatar-menu-label">Signed in as Student</span>
      <a href="./profile.html" class="avatar-menu-link">Profile</a>
      <a href="login.html" class="avatar-menu-link logout-link">Logout</a>
    `;
    dashboardLink.href = "student_home.html";
  }
}

// --- ADMIN VIEW ---
function renderAdminView() {
  // Keep the title consistent or specific to Admin context
  document.getElementById("page-title").textContent = "Events Board (Admin)";
  document.getElementById("page-subtitle").textContent =
    "Review submissions and manage campus events.";
  document.getElementById("create-event-btn").style.display = "block";

  const contentArea = document.getElementById("events-content-area");

  // 1. Insert the Tab and List HTML (Matches structure of Resources/LostFound)
  contentArea.innerHTML = `
    <section class="lf-tabs-row">
      <button class="lf-tab lf-tab-active" data-tab="pending">
        Pending Approval (<span id="pendingCount">0</span>)
      </button>
      <button class="lf-tab" data-tab="approved">
        Approved Events (<span id="approvedCount">0</span>)
      </button>
    </section>

    <section class="lf-list-wrapper">
      <div class="lf-list" id="pending-events-list">
        <p class="lf-empty-text">Loading pending events...</p>
      </div>

      <div class="lf-list lf-hidden" id="approved-events-list">
        <p class="lf-empty-text">Loading approved events...</p>
      </div>
    </section>
  `;

  // 2. Add tab-switching logic
  const tabs = contentArea.querySelectorAll(".lf-tab");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      contentArea
        .querySelector(".lf-tab-active")
        .classList.remove("lf-tab-active");
      tab.classList.add("lf-tab-active");

      const type = tab.dataset.tab;
      document.getElementById("pending-events-list").classList.add("lf-hidden");
      document
        .getElementById("approved-events-list")
        .classList.add("lf-hidden");

      if (type === "pending") {
        document
          .getElementById("pending-events-list")
          .classList.remove("lf-hidden");
      } else {
        document
          .getElementById("approved-events-list")
          .classList.remove("lf-hidden");
      }
    });
  });

  // 3. Load data into both lists
  loadPendingEvents();
  loadApprovedEvents(true); // true = enable delete buttons
}

// --- STUDENT VIEW ---
function renderStudentView() {
  document.getElementById("page-title").textContent = "Events Board";
  document.getElementById("page-subtitle").textContent =
    "Discover and RSVP to campus events.";
  document.getElementById("create-event-btn").style.display = "block";

  const contentArea = document.getElementById("events-content-area");

  // Student view doesn't need tabs, just the list wrapper
  contentArea.innerHTML = `
    <section class="lf-list-wrapper">
      <div class="lf-list" id="approved-events-list">
        <p class="lf-empty-text">Loading events...</p>
      </div>
    </section>
  `;

  loadApprovedEvents(false); // false = show RSVP buttons
}

//  DATA LOADING FUNCTIONS

async function loadPendingEvents() {
  const container = document.getElementById("pending-events-list");
  if (!container) return;

  try {
    const response = await fetch("http://localhost:3000/events/pending");
    const events = await response.json();

    const countSpan = document.getElementById("pendingCount");
    if (countSpan) countSpan.innerText = events.length;

    container.innerHTML = "";

    if (events.length === 0) {
      container.innerHTML = `<p class="lf-empty-text">No events are awaiting approval.</p>`;
      return;
    }

    events.forEach((event) => {
      const start = new Date(event.start_date_time).toLocaleString();
      const end = event.end_date_time
        ? new Date(event.end_date_time).toLocaleString()
        : "N/A";

      container.innerHTML += `
        <div class="lf-card">
          <div class="lf-info">
            <h3>${event.title}</h3>
            <p>${event.description}</p>
            <p><strong>Location:</strong> ${event.location}</p>
            <p><strong>From:</strong> ${start}</p>
            <p><strong>To:</strong> ${end}</p>
            <p><strong>Created by:</strong> ${
              event.creator_name || "Unknown"
            }</p>
            
            <div class="lf-admin-actions" style="margin-top: 10px;">
              <button class="lf-resolve-btn" onclick="approveEvent(${
                event.event_id
              })">Approve</button>
              <button class="lf-delete-btn" onclick="rejectEvent(${
                event.event_id
              })">Reject</button>
            </div>
          </div>
        </div>
      `;
    });
  } catch (err) {
    console.error("Error loading pending events:", err);
    container.innerHTML = `<p class="lf-empty-text">Failed to load events.</p>`;
  }
}

async function loadApprovedEvents(isAdminList = false) {
  const containerId = "approved-events-list";

  const container = document.getElementById(containerId);
  if (!container) return;

  // Use global userRole variable from the top of the script
  const userRole = sessionStorage.getItem("user_role"); // Get the role once

  try {
    const response = await fetch("http://localhost:3000/events/approved");
    const events = await response.json();

    if (isAdminList) {
      const countSpan = document.getElementById("approvedCount");
      if (countSpan) countSpan.innerText = events.length;
    }

    container.innerHTML = "";

    if (events.length === 0) {
      const message = isAdminList
        ? "No events have been approved yet."
        : "No events scheduled. Check back soon!";
      container.innerHTML = `<p class="lf-empty-text">${message}</p>`;
      return;
    }

    events.forEach((event) => {
      const start = new Date(event.start_date_time).toLocaleString();
      const end = event.end_date_time
        ? new Date(event.end_date_time).toLocaleString()
        : "N/A";

      // START OF FIX: Build the action buttons string
      let actionButtons = `
                <button class="lf-resolve-btn" onclick="rsvpToEvent(${event.event_id})" style="background-color: #3b82f6;">
                    <i class="fa-solid fa-calendar-check"></i> RSVP
                </button>
            `;

      // Only add the Delete button if the user is an Admin OR if this function was called for the Admin's Approved tab
      if (userRole === "admin") {
        actionButtons += `
                    <button class="lf-delete-btn" onclick="rejectEvent(${event.event_id})">Delete</button>
                `;
      }

      container.innerHTML += `
                <div class="lf-card">
                    <div class="lf-info">
                        <h3>${event.title}</h3>
                        <p>${event.description}</p>
                        <p><strong>Location:</strong> ${event.location}</p>
                        <p><strong>From:</strong> ${start}</p>
                        <p><strong>To:</strong> ${end}</p>
                        <p><strong>Created by:</strong> ${
                          event.creator_name || "Unknown"
                        }</p>
                        
                        <div class="lf-admin-actions" style="margin-top: 10px; display: flex; gap: 10px;">
                            ${actionButtons}
                        </div>
                    </div>
                </div>
            `;
    });
  } catch (err) {
    console.error("Error loading approved events:", err);
    container.innerHTML = `<p class="lf-empty-text">Failed to load events.</p>`;
  }
}

// --- ACTIONS (Approve, Reject, RSVP)

async function approveEvent(id) {
  if (!confirm("Are you sure you want to approve this event?")) return;
  try {
    await fetch(`http://localhost:3000/events/${id}/approve`, {
      method: "PUT",
    });
    loadPendingEvents();
    loadApprovedEvents(true);
  } catch (err) {
    console.error("Approve failed:", err);
    alert("Server error.");
  }
}

async function rejectEvent(id) {
  if (!confirm("Are you sure you want to reject/delete this event?")) return;
  try {
    await fetch(`http://localhost:3000/events/${id}`, { method: "DELETE" });
    // Reload both lists just in case
    loadPendingEvents();
    loadApprovedEvents(true);
  } catch (err) {
    console.error("Reject failed:", err);
    alert("Server error.");
  }
}

async function rsvpToEvent(eventId) {
  const userId = sessionStorage.getItem("user_id");

  if (!userId) {
    alert("Please log in to RSVP.");
    return;
  }

  try {
    const response = await fetch("http://localhost:3000/events/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, event_id: eventId }),
    });

    const data = await response.json();
    if (response.ok) {
      alert("RSVP Successful! This event is now in your calendar.");
    } else {
      alert("Error: " + data.message);
    }
  } catch (error) {
    console.error("RSVP error:", error);
    alert("Could not connect to server.");
  }
}
// MODAL & FORM LOGIC
function setupModalListeners() {
  const modal = document.getElementById("eventModal");
  const eventForm = document.getElementById("eventForm");
  const createEventBtn = document.getElementById("create-event-btn");
  const closeModal = document.getElementById("closeModal");

  // OPEN MODAL
  createEventBtn.addEventListener("click", () => {
    modal.classList.remove("hidden"); // FIX: Use class
  });

  // CLOSE MODAL
  closeModal.addEventListener("click", () => {
    modal.classList.add("hidden"); // FIX: Use class
  });

  window.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.add("hidden"); // FIX: Use class
  });

  // HANDLE FORM SUBMIT
  eventForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const creator_id = sessionStorage.getItem("user_id");

    const title = document.getElementById("eventTitle").value;
    const description = document.getElementById("eventDescription").value;
    // Combine Location Fields
    const subject = document.getElementById("subjects").value;
    const room = document.getElementById("roomNo").value;
    const location =
      subject !== "choose" ? `${subject} - Room ${room}` : `Room ${room}`;

    const startDate = document.getElementById("eventStartDate").value;
    const startTime = document.getElementById("eventStartTime").value;
    const endDate = document.getElementById("eventEndDate").value;
    const endTime = document.getElementById("eventEndTime").value;

    const start_date_time_string = `${startDate}T${startTime}`;
    const end_date_time_string = `${endDate}T${endTime}`;

    const startDateTime = new Date(start_date_time_string);
    const endDateTime = new Date(end_date_time_string);
    const now = new Date();

    if (startDateTime < now) {
      alert("Error: The event start time must be in the future.");
      return;
    }
    if (endDateTime <= startDateTime) {
      alert("Error: The event end time must be after the start time.");
      return;
    }

    const eventData = {
      title: title,
      description: description,
      location: location,
      start_date_time: start_date_time_string,
      end_date_time: end_date_time_string,
      creator_id: creator_id,
    };

    try {
      const response = await fetch("http://localhost:3000/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });

      const data = await response.json();
      alert(data.message);

      if (response.ok) {
        eventForm.reset();
        modal.classList.add("hidden"); // FIX: Use class

        // Refresh based on role
        const userRole = sessionStorage.getItem("user_role");
        if (userRole === "admin") {
          loadPendingEvents();
          loadApprovedEvents(true);
        } else {
          loadApprovedEvents(false);
        }
      }
    } catch (error) {
      console.error("Error submitting event:", error);
      alert("Could not connect to the server.");
    }
  });
}
