// Signup logic for Autom8
window.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('signupForm');
    const errorDiv = document.getElementById('signupError');

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        errorDiv.style.display = 'none';
        const email = form.signupEmail.value.trim();
        const password = form.signupPassword.value;
        if (!email || !password) return;

        try {
            // Wait for Supabase to be ready
            if (!window.supabase) {
                await new Promise(resolve => {
                    window.addEventListener('supabaseReady', resolve, { once: true });
                });
            }
            const { data, error } = await window.supabase.auth.signUp({ email, password });
            if (error) throw error;
            // Show success and redirect to login
            alert('Account aangemaakt! Bevestig je e-mail en log in.');
            window.location.href = 'login.html';
        } catch (err) {
            errorDiv.textContent = err.message || 'Account aanmaken mislukt.';
            errorDiv.style.display = 'block';
        }
    });
});
