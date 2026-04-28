// Wait for the page to load
window.onload = function() {
    const userId = sessionStorage.getItem('user_id');
    const messageEl = document.getElementById('message');
    
    // --- Get Elements ---
    const profileForm = document.getElementById('profileForm');
    
    // Get only the fields we want to toggle (inputs and selects)
    const formInputs = [
        document.getElementById('first_name'),
        document.getElementById('last_name'),
        document.getElementById('department'),
        document.getElementById('campus'),
        document.getElementById('study_year'),
        document.getElementById('major')
    ];
    
    const editBtn = document.getElementById('edit-profile-btn');
    const saveBtn = document.getElementById('save-changes-btn');
    const cancelBtn = document.getElementById('cancel-edit-btn');
    
    // === GET NEW BUTTON ===
    const homeBtn = document.getElementById('home-btn');

    if (!userId) {
        window.location.href = 'login.html'; // Redirect if not logged in
        return;
    }

    // --- State Management ---
    function toggleEditMode(isEditing) {
        if (isEditing) {
            // Enable form fields
            formInputs.forEach(el => el.disabled = false);
            // Show Save/Cancel, hide Edit
            editBtn.style.display = 'none';
            saveBtn.style.display = 'block';
            cancelBtn.style.display = 'block';
            messageEl.textContent = ''; // Clear old messages
        } else {
            // Disable form fields
            formInputs.forEach(el => el.disabled = true);
            // Show Edit, hide Save/Cancel
            editBtn.style.display = 'block';
            saveBtn.style.display = 'none';
            cancelBtn.style.display = 'none';
        }
    }

    // --- Data Fetching ---
    function fetchProfileData() {
        fetch(`http://localhost:3000/user/${userId}`)
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then(data => {
                // Populate the form fields
                document.getElementById('first_name').value = data.first_name;
                document.getElementById('last_name').value = data.last_name;
                document.getElementById('email').value = data.email;
                document.getElementById('campus').value = data.campus;
                document.getElementById('department').value = data.department;
                document.getElementById('major').value = data.major;
                document.getElementById('study_year').value = data.study_year;
                
                // Ensure page is in read-only mode on load
                toggleEditMode(false);
            })
            .catch(error => {
                console.error('Error fetching profile:', error);
                messageEl.textContent = 'Error: Could not load profile data. Is the server running?';
                messageEl.className = 'error';
                // Reset the UI to non-edit mode even if fetch fails
                toggleEditMode(false); 
            });
    }

    // --- Event Listeners ---
    
    // 1. Edit Button
    editBtn.addEventListener('click', () => {
        toggleEditMode(true);
    });

    // 2. Cancel Button
    cancelBtn.addEventListener('click', () => {
        // Re-fetch original data to discard any changes
        fetchProfileData(); 
        messageEl.textContent = 'Edit cancelled.';
        messageEl.className = '';
    });

    // 3. Save (Submit) Button
    profileForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const updatedData = {
            first_name: document.getElementById('first_name').value,
            last_name: document.getElementById('last_name').value,
            campus: document.getElementById('campus').value,
            department: document.getElementById('department').value,
            major: document.getElementById('major').value,
            study_year: document.getElementById('study_year').value
        };

        fetch(`http://localhost:3000/user/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        })
        .then(response => response.json())
        .then(data => {
            messageEl.textContent = data.message;
            messageEl.className = 'success';
            toggleEditMode(false); // Switch back to read-only
        })
        .catch(error => {
            console.error('Error updating profile:', error);
            messageEl.textContent = 'Error updating profile.';
            messageEl.className = 'error';
        });
    });

    // 4. === NEW HOME BUTTON LOGIC ===
    homeBtn.addEventListener('click', () => {
        const userRole = sessionStorage.getItem('user_role');
        
        if (userRole === 'admin') {
            window.location.href = 'admin_home.html';
        } else {
            // Default to student home
            window.location.href = 'student_home.html';
        }
    });

    // --- Initial Load ---
    fetchProfileData();
};