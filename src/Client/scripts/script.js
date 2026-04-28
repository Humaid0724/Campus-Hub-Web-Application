// ===== Avatar Dropdown Toggle =====

// Select all avatar wrappers (works for BOTH student + admin pages)
const avatarWrappers = document.querySelectorAll('.avatar-wrapper');

avatarWrappers.forEach(wrapper => {
    const avatar = wrapper.querySelector('.avatar-circle'); 
    const menu = wrapper.querySelector('.avatar-menu');

    // Toggle dropdown when clicking avatar
    avatar.addEventListener('click', (e) => {
        e.stopPropagation();   // Prevent click from closing immediately
        menu.classList.toggle('show');
    });

    // Close dropdown when clicking anywhere else
    document.addEventListener('click', () => {
        menu.classList.remove('show');
    });
});