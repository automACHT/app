// Login logic for Autom8
window.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('loginForm');
    const errorDiv = document.getElementById('loginError');

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        errorDiv.style.display = 'none';
        const email = form.loginEmail.value.trim();
        const password = form.loginPassword.value;
        if (!email || !password) return;

        try {
            // Wait for Supabase to be ready
            if (!window.supabase) {
                await new Promise(resolve => {
                    window.addEventListener('supabaseReady', resolve, { once: true });
                });
            }
            const { data, error } = await window.supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            // Redirect to main page
            window.location.href = 'main.html';
        } catch (err) {
            errorDiv.textContent = err.message || 'Inloggen mislukt.';
            errorDiv.style.display = 'block';
        }
    });
});
