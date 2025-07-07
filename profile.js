// Profile page logic for Autom8
window.addEventListener('DOMContentLoaded', async function () {
    // Wait for Supabase to be ready
    if (!window.supabase) {
        await new Promise(resolve => {
            window.addEventListener('supabaseReady', resolve, { once: true });
        });
    }

    // Get user info
    let user = null;
    try {
        const { data, error } = await window.supabase.auth.getUser();
        if (error || !data || !data.user) {
            window.location.href = 'login.html';
            return;
        }
        user = data.user;
    } catch (err) {
        window.location.href = 'login.html';
        return;
    }

    // Show user email
    document.getElementById('profileEmail').textContent = user.email || '(geen e-mail)';

    // Logout logic
    function logout() {
        window.supabase.auth.signOut().then(() => {
            window.location.href = 'login.html';
        });
    }
    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('logoutBtn2').addEventListener('click', logout);
});
