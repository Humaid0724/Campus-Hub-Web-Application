(() => {

  // ==============================
  // SIMPLE NAVBAR SESSION SYNC
  // ==============================

  // Read session storage
  const userRole  = sessionStorage.getItem("user_role");
  const fullName  = sessionStorage.getItem("user_name");   // may be null
  const userEmail = sessionStorage.getItem("user_email");  // we know this exists

  // Elements
  const dashLink     = document.getElementById("dashLink");
  const rolePill     = document.getElementById("rolePill");
  const avatarCircle = document.getElementById("avatarCircle");
  const avatarLabel  = document.getElementById("avatarLabel");

  // Mobile Elements
  const menuToggle = document.querySelector(".menu-toggle");
  const navCenter  = document.querySelector(".nav-center");

  // ------------------------------------------------------
  // 1. FIX DASHBOARD LINK
  // ------------------------------------------------------
  if (dashLink) {
    dashLink.href = userRole === "admin"
      ? "./admin_home.html"
      : "./student_home.html";
  }

  // ------------------------------------------------------
  // 2. AVATAR FIRST LETTER (NAME → EMAIL → ?)
  // ------------------------------------------------------
  if (avatarCircle) {
    // prefer full name, then email, else "?"
    const source = (fullName && fullName.trim()) ||
                   (userEmail && userEmail.trim()) ||
                   "?";

    const letter = source.charAt(0).toUpperCase();
    avatarCircle.textContent = letter;
  }

  // ------------------------------------------------------
  // 3. MOBILE MENU TOGGLE LOGIC (UPDATED)
  // ------------------------------------------------------
  if (menuToggle && navCenter) {
      // 1. Listen for the click on the hamburger button
      menuToggle.addEventListener("click", () => {
          // Toggle the CSS class 'mobile-open' on the menu
          navCenter.classList.toggle("mobile-open");
          
          const isOpen = navCenter.classList.contains("mobile-open");
          
          // 2. Change the button icon (hamburger to 'X' and back)
          menuToggle.innerHTML = isOpen ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
      });
      
      // 3. Close mobile menu if a navigation link is clicked
      navCenter.querySelectorAll('a').forEach(link => {
          link.addEventListener('click', () => {
              if (navCenter.classList.contains("mobile-open")) {
                  navCenter.classList.remove("mobile-open");
                  // Reset the icon back to the hamburger bars
                  menuToggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
              }
          });
      });
  }

  // ------------------------------------------------------
  // 4. ROLE PILL
  // ------------------------------------------------------
  if (rolePill) {
    if (userRole === "admin") {
      rolePill.classList.remove("role-student");
      rolePill.classList.add("role-admin");
      rolePill.innerHTML = `<i class="fa-solid fa-crown"></i> Admin`;
    } else {
      rolePill.classList.remove("role-admin");
      rolePill.classList.add("role-student");
      rolePill.innerHTML = `<i class="fa-solid fa-user-graduate"></i> Student`;
    }
  }

  // ------------------------------------------------------
  // 5. DROPDOWN LABEL
  // ------------------------------------------------------
  if (avatarLabel) {
    avatarLabel.textContent =
      `Signed in as ${userRole === "admin" ? "Admin" : "Student"}`;
  }

  // ------------------------------------------------------
  // 6. DROPDOWN TOGGLE
  // ------------------------------------------------------
  const avatarWrapper = document.querySelector(".avatar-wrapper");
  const dropdownMenu  = document.querySelector(".avatar-menu");

  if (avatarWrapper && dropdownMenu) {
    avatarWrapper.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdownMenu.classList.toggle("show");
    });

    document.addEventListener("click", () => {
      dropdownMenu.classList.remove("show");
    });
  }

})();