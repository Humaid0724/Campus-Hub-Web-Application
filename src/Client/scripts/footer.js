document.addEventListener("DOMContentLoaded", () => {
  // 1. Define the Footer HTML (Same structure as prehome.html)
  const footerHTML = `
    <footer class="site-footer">
        <div class="footer-container">
            <p>&copy; 2025 Heriot-Watt University Dubai - Campus Hub</p>
            <p>Group Members: Abrar, Aryan, Humaid, Mahd, Faizan</p>
        </div>
    </footer>
  `;

  // 2. Find the main page wrapper to ensure sticky positioning
  const pageWrapper = document.querySelector('.page');

  // 3. Inject the footer
  if (pageWrapper) {
    // If the .page wrapper exists, put it inside at the bottom (best for sticky footer)
    pageWrapper.insertAdjacentHTML('beforeend', footerHTML);
  } else {
    // Fallback for pages without .page class
    document.body.insertAdjacentHTML('beforeend', footerHTML);
  }
});