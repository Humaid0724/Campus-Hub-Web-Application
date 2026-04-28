document
  .getElementById("loginForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email.endsWith("@hw.ac.uk")) {
      alert("Please use your Heriot-Watt University email address.");
      return;
    }

    try {
      // Send login data to the server
      const response = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      // Make sure to await response.json()
      const data = await response.json();

      if (response.ok) {
        // Save user info locally and redirect based on role
        localStorage.setItem("userEmail", email);

        const role = data.role || "student";
        localStorage.setItem("userRole", role);
        console.log("Login successful. Role:", role);
        console.log("Full response:", data);

        // Store user ID + role + email for profile page
        sessionStorage.setItem("user_id", data.id);
        sessionStorage.setItem("user_role", data.role);
        sessionStorage.setItem("user_email", data.email);

        if (role === "admin") {
          console.log("Redirecting to admin_home.html");
          window.location.href = "../pages/admin_home.html";
        } else {
          console.log("Redirecting to student_home.html");
          window.location.href = "../pages/student_home.html";
        }
      } else {
        alert(data.message || "Invalid email or password");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Server connection failed.");
    }
  });
