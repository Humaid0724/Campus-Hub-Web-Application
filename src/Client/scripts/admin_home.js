// main/src/Client/scripts/admin_home.js

// This function is required globally for task completion (My Upcoming Deadlines widget)
window.completeTask = async (taskId, element) => {
  if (
    !confirm(
      "Mark this task as complete? (This will remove it from your calendar)"
    )
  )
    return;

  try {
    // Deletes the personal event from the database
    const response = await fetch(
      `http://localhost:3000/calendar/personal/${taskId}`,
      {
        method: "DELETE",
      }
    );

    if (response.ok) {
      // Remove the task visually
      element.closest(".dash-item").remove();
      // Reload the entire list to handle the empty state
      loadAdminTasks(
        "http://localhost:3000",
        sessionStorage.getItem("user_id")
      );
    } else {
      alert("Failed to update task.");
    }
  } catch (error) {
    console.error("Error:", error);
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const userId = sessionStorage.getItem("user_id");
  const userRole = sessionStorage.getItem("user_role");

  if (!userId) {
    alert("Please log in first.");
    window.location.href = "login.html";
    return;
  }

  const API_BASE = "http://localhost:3000";

  // --- 1. Load Stats and Initialize Widgets ---
  fetch(`${API_BASE}/dashboard/stats/${userId}`)
    .then((res) => res.json())
    .then((data) => {
      // --- Read Dashboard Counts from Server ---
      // upcomingEvents here represents the count of PENDING EVENTS for admin role
      const pendingEvents = data.upcomingEvents || 0;
      const pendingResources = data.pendingResources || 0;
      const totalNotices = data.newNotices || 0;
      const departmentStats = data.departmentStats || []; // Data for trends widget

      // --- Update Metric Cards (Top Row) ---
      document.getElementById("adminPendingEvents").textContent = pendingEvents;
      document.getElementById("adminPendingResources").textContent =
        pendingResources;
      document.getElementById("adminNoticesCount").textContent = totalNotices;

      // Calculate Total Students (for the new metric card)
      const totalStudents = departmentStats.reduce(
        (sum, item) => sum + item.count,
        0
      );
      document.getElementById("adminTotalStudents").textContent = totalStudents;

      // --- Render Dynamic Widgets ---
      loadPendingEventsFeed(API_BASE); // 1. Event Approvals
      loadAdminTasks(API_BASE, userId); // 2. My Upcoming Deadlines
      renderDepartmentTrends(departmentStats); // 3. Student Registration Trends
    })
    .catch((err) => {
      console.error("Admin dashboard stats error:", err);
    });
});

// --- 1. Event Approvals (Pending Events Feed) ---
async function loadPendingEventsFeed(API_BASE) {
  const list = document.getElementById("dashboard-pending-events-list");
  list.innerHTML = ""; // Clear loader

  try {
    const response = await fetch(`${API_BASE}/events/pending`);
    const events = await response.json();

    // Show only the next 3 most urgent pending events
    const topEvents = events.slice(0, 3);

    if (topEvents.length === 0) {
      list.innerHTML =
        '<p class="empty-state">🎉 No events are awaiting approval.</p>';
      return;
    }

    topEvents.forEach((event) => {
      const dateObj = new Date(event.start_date_time);
      const dateStr = dateObj.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      const timeStr = dateObj.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      list.innerHTML += `
              <div class="dash-item" style="border-left-color: #f97316;">
                <div class="dash-item-info">
                  <h4>${event.title} <span style="font-size: 0.75rem; color: #f97316;">(Pending)</span></h4>
                  <p>${dateStr} at ${timeStr} | By: ${event.creator_name}</p>
                </div>
                <a href="Events.html" class="widget-link" style="white-space: nowrap;">Review</a>
              </div>
            `;
    });
  } catch (err) {
    console.error("Pending events error", err);
    list.innerHTML =
      '<p class="empty-state">Could not load pending events.</p>';
  }
}

// --- 2. My Upcoming Deadlines (Admin Personal Tasks) ---
async function loadAdminTasks(API_BASE, userId) {
  const list = document.getElementById("dashboard-admin-task-list");
  list.innerHTML = ""; // Clear loader

  try {
    // Uses existing server endpoint /user/:id/tasks (personal calendar events)
    const response = await fetch(`${API_BASE}/user/${userId}/tasks`);
    const tasks = await response.json();

    if (tasks.length === 0) {
      list.innerHTML =
        '<p class="empty-state">✅ No administrative tasks for today. <a href="calendar.html">Add one?</a></p>';
      return;
    }

    // Take top 3 tasks
    const topTasks = tasks.slice(0, 3);

    topTasks.forEach((task) => {
      const dateStr = task.due_date
        ? new Date(task.due_date).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
          })
        : "No date";

      list.innerHTML += `
              <div class="dash-item task-item">
                <div class="dash-item-info">
                  <h4>${task.title}</h4>
                  <p>Due: ${dateStr}</p>
                </div>
                <i class="fa-regular fa-circle" 
                   style="cursor: pointer; color: #22c55e; font-size: 1.2rem;" 
                   title="Complete Task"
                   onclick="completeTask(${task.task_id}, this)">
                </i> 
              </div>`;
    });
  } catch (err) {
    console.error("Admin task error", err);
    list.innerHTML = '<p class="empty-state">Could not load tasks.</p>';
  }
}

// --- 3. Student Registration Trends (Department Breakdown) ---
function renderDepartmentTrends(stats) {
  const container = document.getElementById("dashboard-student-trends");
  container.innerHTML = "";

  if (stats.length === 0) {
    container.innerHTML =
      '<p class="empty-state">No student data available to show trends.</p>';
    return;
  }

  // Calculate total students to get percentages
  const totalStudents = stats.reduce((sum, item) => sum + item.count, 0);

  // Take top 5 departments for the summary
  const topDepartments = stats.slice(0, 5);

  let html = "<h4>Top Departments by Student Count:</h4>";
  html += '<ul style="list-style: none; padding: 0;">';

  topDepartments.forEach((item) => {
    const percentage = ((item.count / totalStudents) * 100).toFixed(1);
    // Shorten the department name for display purposes
    const departmentShort = item.department
      .replace(/ and /, " & ")
      .replace(/Sciences$/, "Sci")
      .substring(0, 35);

    // Render department name, count, and a simple bar chart to visualize percentage
    html += `
          <li style="margin-bottom: 8px; font-size: 0.9rem; color: #1f2937;">
            <strong>${departmentShort}</strong> (${item.count})
            <div style="height: 6px; background: #eef2ff; border-radius: 3px; margin-top: 2px;">
              <div style="width: ${percentage}%; height: 100%; background: linear-gradient(90deg, #4f46e5, #ec4899); border-radius: 3px;"></div>
            </div>
          </li>
        `;
  });

  html += "</ul>";
  container.innerHTML = html;
}
