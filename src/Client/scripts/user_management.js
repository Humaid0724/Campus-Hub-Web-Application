document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "http://localhost:3000";
  const rosterList = document.getElementById("userRosterList");

  // --- Action Handlers (Global visibility for button clicks) ---
  window.promoteUser = async (userId) => {
    if (!confirm("Are you sure you want to promote this user to Admin?"))
      return;

    try {
      const response = await fetch(`${API_BASE}/users/${userId}/promote`, {
        method: "PUT",
      });
      const data = await response.json();
      alert(data.message);
      if (response.ok) loadRoster(); // Reload to update role visually
    } catch (error) {
      console.error("Promote Error:", error);
      alert("Server connection failed.");
    }
  };

  window.deleteUser = async (userId, userName) => {
    if (
      !confirm(
        `Are you sure you want to PERMANENTLY delete the account for ${userName}?`
      )
    )
      return;

    try {
      const response = await fetch(`${API_BASE}/users/${userId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      alert(data.message);
      if (response.ok || response.status === 400) loadRoster(); // Reload even if it failed due to being an admin (though this shouldn't happen)
    } catch (error) {
      console.error("Delete Error:", error);
      alert("Server connection failed.");
    }
  };

  // --- Main Roster Loader ---
  async function loadRoster() {
    const API_BASE = "http://localhost:3000";
    const rosterList = document.getElementById("userRosterList");

    rosterList.innerHTML =
      '<li class="roster-empty-text">Loading user roster...</li>';

    try {
      // NOTE: The server route app.get("/users/roster") MUST be updated to include 'department'
      const response = await fetch(`${API_BASE}/users/roster`);
      const users = await response.json();

      rosterList.innerHTML = "";

      if (users.length === 0) {
        rosterList.innerHTML =
          '<li class="roster-empty-text">No users registered.</li>';
        return;
      }

      users.forEach((user) => {
        const isStudent = user.role === "student";
        const fullName = `${user.first_name} ${user.last_name}`;

        // --- Determine Actions based on Role ---
        let actionButtons;
        if (isStudent) {
          actionButtons = `
                        <button class="action-btn promote-btn" onclick="promoteUser(${user.user_id})">Admin</button>
                        <button class="action-btn delete-btn" onclick="deleteUser(${user.user_id}, '${fullName}')">Delete User</button>
                    `;
        } else {
          actionButtons = `
                        <span class="role-admin-placeholder">Already Admin</span>
                    `;
          // Per request: no delete button for admins
        }

        // --- Render List Item ---
        rosterList.innerHTML += `
                    <li class="roster-row ${
                      isStudent ? "student-row" : "admin-row"
                    }">
                        <div style="flex: 2;">${fullName}</div>
                        <div style="flex: 2.5;">${user.email}</div>
                        <div style="flex: 3;">${user.department || "N/A"}</div> 
                        <div style="flex: 1;"><span class="role-pill ${
                          user.role === "admin" ? "role-admin" : "role-student"
                        }">${user.role.toUpperCase()}</span></div>
                        <div style="flex: 2; text-align: right; display: flex; justify-content: flex-end; gap: 8px;">
                            ${actionButtons}
                        </div>
                    </li>
                `;
      });
    } catch (error) {
      console.error("Error loading roster:", error);
      rosterList.innerHTML =
        '<li class="roster-empty-text">Failed to load user data.</li>';
    }
  }

  // Load data on page load
  loadRoster();
});
