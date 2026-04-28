(() => {
  // --- GLOBAL VARIABLES ---
  let events = [];
  let currentDate = new Date();
  let view = "month";
  const userId = sessionStorage.getItem("user_id"); // Get logged-in user

  // --- DOM ELEMENTS ---
  const calendarRoot = document.getElementById("calendarRoot");
  const currentLabel = document.getElementById("currentLabel");
  const eventList = document.getElementById("eventList"); // Sidebar list

  // Buttons
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const monthViewBtn = document.getElementById("monthViewBtn");
  const weekViewBtn = document.getElementById("weekViewBtn");
  const todayBtn = document.getElementById("todayBtn");
  const addEventBtn = document.getElementById("addEventBtn");

  // Modal Elements
  const modal = document.getElementById("eventModal");
  const closeModal = document.getElementById("closeModal");
  const eventForm = document.getElementById("eventForm");
  const modalTitle = document.getElementById("modalTitle");
  const deleteEventBtn = document.getElementById("deleteEventBtn");
  
  // Form Inputs
  const evtTitle = document.getElementById("evtTitle");
  const evtDate = document.getElementById("evtDate");
  const evtStart = document.getElementById("evtStart");
  const evtEnd = document.getElementById("evtEnd");

  // ============================================================
  // 1. DATA LOADING & SAVING
  // ============================================================

  // --- Load Events ---
  async function load() {
    if (!userId) {
      console.warn("No user ID found. Please log in.");
      return; 
    }

    try {
      // Fetch combined Global (RSVP) + Personal events
      const res = await fetch(`http://localhost:3000/calendar/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch events");
      
      const data = await res.json();
      events = data; // Update global events array
      render();      // Refresh UI
    } catch (err) {
      console.error("Error loading calendar:", err);
    }
  }

  // --- Save Personal Event ---
  async function saveEventToServer(title, start, end) {
     try {
        const res = await fetch("http://localhost:3000/calendar/personal", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                user_id: userId,
                title: title,
                start: start,
                end: end
            })
        });
        
        if (res.ok) {
          load(); // Reload to see the new event
        } else {
          alert("Failed to save event.");
        }
     } catch(err) {
         console.error("Save error:", err);
     }
  }

  // --- Delete / Un-RSVP Event (UPDATED LOGIC) ---
  async function deleteEvent(id, type) {
    
    // CASE 1: Global Event (University Event) -> Un-RSVP
    if (type === 'global') {
        if (!confirm("Remove this event from your calendar? (Un-RSVP)")) return;

        try {
            const res = await fetch(`http://localhost:3000/events/rsvp/${userId}/${id}`, { 
                method: "DELETE" 
            });

            if (res.ok) {
                load(); // Reload to remove the event from view
                closeModalFn();
            } else {
                alert("Failed to remove event.");
            }
        } catch(err) {
            console.error("Un-RSVP error:", err);
        }
        return;
    }

    // CASE 2: Personal Event -> Delete permanently
    if (!confirm("Are you sure you want to delete this personal event?")) return;

    try {
        const res = await fetch(`http://localhost:3000/calendar/personal/${id}`, { 
          method: "DELETE" 
        });

        if (res.ok) {
          load(); 
          closeModalFn();
        } else {
          alert("Failed to delete event.");
        }
    } catch(err) {
        console.error("Delete error:", err);
    }
  }

  // ============================================================
  // 2. HELPER FUNCTIONS
  // ============================================================

  // Check if an event falls on or spans across a specific day
  function isEventActiveOnDay(ev, dateObj) {
    const evStart = new Date(ev.start);
    evStart.setHours(0, 0, 0, 0);

    const evEnd = new Date(ev.end || ev.start); 
    evEnd.setHours(23, 59, 59, 999);

    const current = new Date(dateObj);
    current.setHours(12, 0, 0, 0); 

    return current >= evStart && current <= evEnd;
  }

  function toISODate(d) {
    const offsetDate = new Date(d.getTime() - (d.getTimezoneOffset() * 60000));
    return offsetDate.toISOString().split('T')[0];
  }

  // ============================================================
  // 3. RENDER LOGIC
  // ============================================================

  function render() {
    if (view === "month") renderMonth();
    else if (view === "week") renderWeek();
    else renderDay();
    
    renderEventList(); // Update sidebar
  }

  // --- Sidebar List ---
  function renderEventList() {
    eventList.innerHTML = "";
    const sorted = events.slice().sort((a, b) => new Date(a.start) - new Date(b.start));

    sorted.forEach((e) => {
      const li = document.createElement("li");
      li.className = "event-item";
      
      const isGlobal = e.type === 'global';
      li.style.borderLeft = isGlobal ? "4px solid #f97316" : "4px solid #3b82f6";

      const meta = document.createElement("div");
      meta.className = "meta";
      meta.innerHTML = `
        <div style="font-weight:bold">${e.title}</div>
        <div style="font-size:0.85rem; color:#666">${new Date(e.start).toLocaleString()}</div>
        <div style="font-size:0.75rem; color:#999; margin-top:2px;">
          ${isGlobal ? '<i class="fa-solid fa-university"></i> University Event' : '<i class="fa-solid fa-user"></i> Personal'}
        </div>
      `;

      const actions = document.createElement("div");

      // "Delete" button (X) - NOW ENABLED FOR BOTH
      const del = document.createElement("button");
      del.className = "btn danger";
      del.textContent = "×";
      del.title = isGlobal ? "Un-RSVP (Remove)" : "Delete Event";
      del.onclick = () => deleteEvent(e.id, e.type);
      actions.appendChild(del);

      li.append(meta, actions);
      eventList.appendChild(li);
    });
  }

  // --- Month View ---
  function renderMonth() {
    calendarRoot.innerHTML = "";
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();

    currentLabel.textContent = new Date(y, m).toLocaleString('default', { month: 'long', year: 'numeric' });

    const weekdayHeader = document.createElement("div");
    weekdayHeader.className = "weekday-header";
    ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].forEach(name => {
      const el = document.createElement("div");
      el.className = "weekday";
      el.textContent = name;
      weekdayHeader.appendChild(el);
    });
    calendarRoot.appendChild(weekdayHeader);

    const grid = document.createElement("div");
    grid.className = "month-grid";

    const firstDayOfMonth = new Date(y, m, 1);
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const startDayIndex = firstDayOfMonth.getDay(); 

    for (let i = 0; i < startDayIndex; i++) {
      grid.appendChild(document.createElement("div"));
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const cell = document.createElement("div");
      cell.className = "day-cell";
      
      const thisDate = new Date(y, m, d);
      const now = new Date();
      if (thisDate.toDateString() === now.toDateString()) {
        cell.classList.add("today");
      }

      const dateLabel = document.createElement("div");
      dateLabel.className = "date";
      dateLabel.textContent = d;

      const eventsWrap = document.createElement("div");
      eventsWrap.className = "events";

      const daysEvents = events.filter(ev => isEventActiveOnDay(ev, thisDate));

      daysEvents.forEach(ev => {
        const pill = document.createElement("div");
        pill.className = "event-pill";
        pill.textContent = ev.title;
        if(ev.type === 'global') pill.style.background = "linear-gradient(120deg, #f97316, #fb923c)";

        pill.onclick = (e) => {
          e.stopPropagation();
          openModalWith(ev); 
        };
        eventsWrap.appendChild(pill);
      });

      cell.append(dateLabel, eventsWrap);
      
      cell.onclick = () => {
          modalTitle.textContent = "Add Personal Event";
          deleteEventBtn.classList.add("hidden");
          openModalWith({ start: toISODate(thisDate) });
      };

      grid.appendChild(cell);
    }

    calendarRoot.appendChild(grid);
  }

  // --- Week View ---
  function renderWeek() {
    calendarRoot.innerHTML = "";
    
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay()); 

    currentLabel.textContent = "Week of " + startOfWeek.toLocaleDateString();

    const grid = document.createElement("div");
    grid.className = "month-grid"; 

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);

      const cell = document.createElement("div");
      cell.className = "day-cell";
      
      const dateLabel = document.createElement("div");
      dateLabel.className = "date";
      dateLabel.textContent = d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });

      const eventsWrap = document.createElement("div");
      eventsWrap.className = "events";

      const daysEvents = events.filter(ev => isEventActiveOnDay(ev, d));

      daysEvents.forEach(ev => {
        const pill = document.createElement("div");
        pill.className = "event-pill";
        pill.textContent = ev.title;
        if(ev.type === 'global') pill.style.background = "linear-gradient(120deg, #f97316, #fb923c)";
        
        pill.onclick = (e) => { e.stopPropagation(); openModalWith(ev); };
        eventsWrap.appendChild(pill);
      });

      cell.append(dateLabel, eventsWrap);
      
      cell.onclick = () => {
          modalTitle.textContent = "Add Personal Event";
          deleteEventBtn.classList.add("hidden");
          openModalWith({ start: toISODate(d) });
      };

      grid.appendChild(cell);
    }

    calendarRoot.appendChild(grid);
  }

  // --- Day View ---
  function renderDay() {
    calendarRoot.innerHTML = "";
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();
    const d = currentDate.getDate();
    const checkDate = new Date(y, m, d);

    currentLabel.textContent = checkDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

    const wrap = document.createElement("div");
    wrap.className = "day-grid";

    for (let h = 0; h < 24; h++) {
      const row = document.createElement("div");
      row.className = "hour-row";
      const label = document.createElement("div");
      label.className = "hour-label";
      label.textContent = `${String(h).padStart(2, "0")}:00`;
      const cell = document.createElement("div");
      cell.className = "hour-cell";

      cell.onclick = () => {
         const timeStr = `${String(h).padStart(2, "0")}:00`;
         modalTitle.textContent = "Add Personal Event";
         deleteEventBtn.classList.add("hidden");
         openModalWith({ start: toISODate(checkDate), startTime: timeStr });
      };

      const hourEvents = events.filter(ev => {
          const evDate = new Date(ev.start);
          return evDate.getDate() === d && evDate.getMonth() === m && evDate.getFullYear() === y && evDate.getHours() === h;
      });

      hourEvents.forEach(ev => {
        const pill = document.createElement("div");
        pill.className = "event-pill";
        pill.textContent = ev.title;
        if(ev.type === 'global') pill.style.background = "linear-gradient(120deg, #f97316, #fb923c)";
        pill.onclick = (e) => { e.stopPropagation(); openModalWith(ev); };
        cell.appendChild(pill);
      });

      row.append(label, cell);
      wrap.appendChild(row);
    }

    calendarRoot.appendChild(wrap);
  }

  // ============================================================
  // 4. MODAL & FORM LOGIC
  // ============================================================

  function closeModalFn() {
    modal.classList.add("hidden");
  }

  function openModalWith(data) {
    modal.classList.remove("hidden");

    // 1. Populate Fields
    evtTitle.value = data.title || "";
    
    let dateVal = "";
    if (data.start) {
        dateVal = data.start.includes("T") ? data.start.split("T")[0] : data.start;
    }
    evtDate.value = dateVal;

    let sTime = "";
    let eTime = "";
    if (data.startTime) {
        sTime = data.startTime;
    } else if (data.start && data.start.includes("T")) {
        const d = new Date(data.start);
        sTime = d.toTimeString().slice(0, 5); 
    }
    if (data.end && data.end.includes("T")) {
        const d = new Date(data.end);
        eTime = d.toTimeString().slice(0, 5);
    }
    evtStart.value = sTime;
    evtEnd.value = eTime;

    // 2. Button Logic
    if (data.id && data.type !== 'global') {
        // Personal Event -> Edit/Delete
        modalTitle.textContent = "Edit Personal Event";
        deleteEventBtn.textContent = "Delete";
        deleteEventBtn.classList.remove("hidden");
        deleteEventBtn.onclick = () => deleteEvent(data.id, data.type);
        
    } else if (data.type === 'global') {
        // Global Event -> Un-RSVP
        modalTitle.textContent = "University Event";
        deleteEventBtn.textContent = "Remove from Calendar"; // Changed Text
        deleteEventBtn.classList.remove("hidden"); // NOW VISIBLE
        deleteEventBtn.onclick = () => deleteEvent(data.id, data.type);

    } else {
        // New Event
        modalTitle.textContent = "Add Personal Event";
        deleteEventBtn.classList.add("hidden");
    }
  }

  closeModal.onclick = closeModalFn;
  window.onclick = (e) => { if (e.target === modal) closeModalFn(); };

  eventForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = evtTitle.value.trim();
    const date = evtDate.value;
    const start = evtStart.value;
    const end = evtEnd.value;

    if(!title || !date) {
        alert("Title and Date are required");
        return;
    }
    
    const startISO = `${date} ${start || "00:00"}:00`;
    const endISO   = `${date} ${end   || "23:59"}:00`;

    saveEventToServer(title, startISO, endISO);
    closeModalFn();
  });

  // ============================================================
  // 5. VIEW TOGGLES
  // ============================================================

  function setView(newView) {
    view = newView;
    monthViewBtn.classList.remove("primary");
    weekViewBtn.classList.remove("primary");
    todayBtn.classList.remove("primary");

    if (newView === "month") monthViewBtn.classList.add("primary");
    else if (newView === "week") weekViewBtn.classList.add("primary");
    else if (newView === "day") todayBtn.classList.add("primary");

    render();
  }

  monthViewBtn.onclick = () => setView("month");
  weekViewBtn.onclick = () => setView("week");
  todayBtn.onclick = () => { currentDate = new Date(); setView("day"); };

  prevBtn.onclick = () => {
    if (view === "month") currentDate.setMonth(currentDate.getMonth() - 1);
    else if (view === "week") currentDate.setDate(currentDate.getDate() - 7);
    else currentDate.setDate(currentDate.getDate() - 1);
    render();
  };

  nextBtn.onclick = () => {
    if (view === "month") currentDate.setMonth(currentDate.getMonth() + 1);
    else if (view === "week") currentDate.setDate(currentDate.getDate() + 7);
    else currentDate.setDate(currentDate.getDate() + 1);
    render();
  };

  addEventBtn.onclick = () => {
      modalTitle.textContent = "Add Personal Event";
      deleteEventBtn.classList.add("hidden");
      openModalWith({ start: toISODate(new Date()) });
  };

  // ============================================================
  // 6. INITIALIZATION
  // ============================================================
  document.addEventListener("DOMContentLoaded", () => {
    load(); 
    setView("month");
  });

})();