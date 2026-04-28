document.addEventListener("DOMContentLoaded", () => {
  const userId = sessionStorage.getItem("user_id");

  if (!userId) {
    alert("Please log in first.");
    window.location.href = "login.html";
    return;
  }

  const API_BASE = "http://localhost:3000";

  // 1. Load Stats
  fetch(`${API_BASE}/dashboard/stats/${userId}`)
    .then(res => res.json())
    .then(data => {
      if (document.getElementById("studentUpcomingEvents")) {
        document.getElementById("studentUpcomingEvents").textContent = data.upcomingEvents || 0;
        document.getElementById("studentPendingTasks").textContent = data.pendingTasks || 0;
        document.getElementById("studentRsvps").textContent = data.rsvps || 0;
        document.getElementById("studentUnreadNotices").textContent = data.newNotices || 0;
      }
    })
    .catch(console.error);

  // 2. Load Upcoming Schedule (Events)
  fetch(`${API_BASE}/user/${userId}/events`)
    .then(res => res.json())
    .then(events => {
      const list = document.getElementById("dashboard-schedule-list");
      list.innerHTML = "";

      // Filter: Show events for today and future
      // Create a date object for "Today at 00:00:00"
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const futureEvents = events
        .filter(e => new Date(e.start_date_time) >= today)
        .slice(0, 3);

      if (futureEvents.length === 0) {
        list.innerHTML = '<p class="empty-state">No upcoming events. <a href="Events.html">RSVP to one?</a></p>';
        return;
      }

      futureEvents.forEach(ev => {
        const dateObj = new Date(ev.start_date_time);
        const dateStr = dateObj.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
        const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        list.innerHTML += `
          <div class="dash-item">
            <div class="dash-item-info">
              <h4>${ev.title}</h4>
              <p>${dateStr} at ${timeStr} • ${ev.location || 'Campus'}</p>
            </div>
          </div>`;
      });
    })
    .catch(err => {
      console.error("Schedule error", err);
      document.getElementById("dashboard-schedule-list").innerHTML = '<p class="empty-state">Could not load events.</p>';
    });


  // 3. Load Priority Tasks (From Calendar_Events)
  fetch(`${API_BASE}/user/${userId}/tasks`)
    .then(res => res.json())
    .then(tasks => {
      const list = document.getElementById("dashboard-task-list");
      list.innerHTML = "";

      if (tasks.length === 0) {
        list.innerHTML = '<p class="empty-state">🎉 No upcoming tasks! <a href="calendar.html">Add one?</a></p>';
        return;
      }

      // Take top 3
      const topTasks = tasks.slice(0, 3);

      topTasks.forEach(task => {
        const dateStr = task.due_date ? new Date(task.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'No date';
        
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
    })
    .catch(err => {
      console.error("Task error", err);
      document.getElementById("dashboard-task-list").innerHTML = '<p class="empty-state">Could not load tasks.</p>';
    });


  // 4. Load Latest Notice
  fetch(`${API_BASE}/notices`)
    .then(res => res.json())
    .then(notices => {
      const box = document.getElementById("dashboard-notice-content");
      if(!box) return;

      const importantNotice = notices.find(n => n.pinned) || notices[0];

      if (!importantNotice) {
        box.innerHTML = '<p class="empty-state">No active announcements.</p>';
        return;
      }

      box.innerHTML = `
        <div style="padding: 5px;">
          <h4 style="margin: 0 0 5px 0; color: #9333ea;">
            ${importantNotice.pinned ? '<i class="fa-solid fa-thumbtack"></i> ' : ''}${importantNotice.title}
          </h4>
          <p style="color: #4b5563; font-size: 0.9rem; margin: 0;">${importantNotice.content}</p>
        </div>
      `;
    })
    .catch(console.error);
});

// 5. Task Completion Logic (Deletes Personal Event)
window.completeTask = async (taskId, element) => {
  if(!confirm("Mark this task as complete? (This will remove it from your calendar)")) return;

  try {
    const response = await fetch(`http://localhost:3000/calendar/personal/${taskId}`, {
        method: 'DELETE' 
    });

    if (response.ok) {
      element.closest('.dash-item').remove();
      // Check if list is empty now
      const list = document.getElementById("dashboard-task-list");
      if(list.children.length === 0) {
         list.innerHTML = '<p class="empty-state">🎉 No upcoming tasks! <a href="calendar.html">Add one?</a></p>';
      }
    } else {
      alert("Failed to update task.");
    }
  } catch (error) {
    console.error("Error:", error);
  }
};