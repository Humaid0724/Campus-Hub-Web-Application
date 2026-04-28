/* --- CLEANED-UP register.js --- */

// Wait for the HTML document to be fully loaded before running script
document.addEventListener("DOMContentLoaded", () => {
  
  const registerForm = document.getElementById("registerForm");
  
  // Ensure the form exists before adding an event listener
  if (!registerForm) {
    console.error("Error: registerForm not found on this page.");
    return;
  }

  registerForm.addEventListener("submit", async function (e) {
    e.preventDefault(); // Stop the form from submitting the default way

    // --- 1. GET FORM DATA ---
    // Use .value.trim() to remove any whitespace
    const first_name = document.getElementById("first_name").value.trim();
    const last_name = document.getElementById("last_name").value.trim();
    const campus = document.getElementById("campus").value.trim();
    const department = document.getElementById("department").value.trim();
    const major = document.getElementById("major").value.trim();
    const study_year = document.getElementById("study_year").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value; // Don't trim passwords
    const confirmPassword = document.getElementById("confirmPassword").value;

    // --- 2. CLIENT-SIDE VALIDATION ---
    
    // Check for empty profile fields
    if (!first_name || !last_name || !campus || !department || !major || !study_year) {
      alert("Please fill out all profile fields.");
      return;
    }

    // Check email
    if (!email.endsWith("@hw.ac.uk")) {
      alert("Please use your Heriot-Watt University email address.");
      return;
    }

    // Check password matching
    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    // Check password complexity
    const passwordErrors = [];
    if (password.length < 6) {
      passwordErrors.push("must be at least 6 characters long");
    }
    if (!/[A-Z]/.test(password)) {
      passwordErrors.push("must contain at least one uppercase letter");
    }
    if (!/[0-9]/.test(password)) {
      passwordErrors.push("must contain at least one number");
    }

    if (passwordErrors.length > 0) {
      alert("Password is not strong enough:\n" + passwordErrors.join("\n"));
      return;
    }

    // --- 3. PREPARE DATA FOR SERVER ---
    // This object's keys MUST match the server's req.body destructuring
    const formData = {
      first_name,
      last_name,
      campus,
      department,
      major,
      study_year,
      email,
      password // Send the plain-text password to the server for hashing
    };

    // --- 4. SEND DATA TO BACKEND ---
    try {
      const response = await fetch("http://localhost:3000/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) { // Status codes 200-299
        alert("Registration successful! Please log in.");
        window.location.href = "login.html"; // Redirect to login
      } else {
        // Show the specific error message from the server
        alert(data.message || "Registration failed. Please try again.");
      }

    } catch (error) {
      console.error("Registration Error:", error);
      alert("Could not connect to the server. Please check your connection.");
    }
  });
});