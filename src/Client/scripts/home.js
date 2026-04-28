// home.js – dashboard metrics for student + admin

document.addEventListener("DOMContentLoaded", () => {
  // 1) Check that user is logged in (we use sessionStorage everywhere else)
  const userId = sessionStorage.getItem("user_id");
  const userEmail = sessionStorage.getItem("user_email");
  const userRole = sessionStorage.getItem("user_role");

  if (!userId || !userEmail) {
    alert("Please log in first.");
    window.location.href = "login.html";
    return;
  }

  // Optional: if this script runs on admin page too, we can swap the text
  const bannerTitle = document.querySelector(".banner h1");
  if (bannerTitle && userRole === "admin") {
    bannerTitle.textContent = "Welcome back, admin!";
  }

  // 2) Fetch stats from backend
  // ⚠️ If your Node server runs on 5500, change 3000 -> 5500
  const API_BASE = "http://localhost:3000";

  fetch(`${API_BASE}/dashboard/stats/${userId}`)
    .then((res) => res.json())
    .then((data) => {
      const stats = {
        upcomingEvents: data.upcomingEvents || 0,
        pendingTasks: data.pendingTasks || 0,
        myRsvps: data.myRsvps || 0,
        totalNotices: data.totalNotices || 0,
      };

      const elEvents  = document.getElementById("metric-events");
      const elTasks   = document.getElementById("metric-tasks");
      const elRsvps   = document.getElementById("metric-rsvps");
      const elNotices = document.getElementById("metric-notices");

      if (elEvents)  elEvents.textContent  = stats.upcomingEvents;
      if (elTasks)   elTasks.textContent   = stats.pendingTasks;
      if (elRsvps)   elRsvps.textContent   = stats.myRsvps;
      if (elNotices) elNotices.textContent = stats.totalNotices;
    })
    .catch((err) => {
      console.error("Error loading dashboard stats:", err);
      // We just keep 0s if API fails
    });
});