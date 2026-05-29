document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const loginContainer = document.getElementById('login-container');
    const dashboardContainer = document.getElementById('dashboard-container');
    const errorMessage = document.getElementById('error-message');
    const logoutBtn = document.getElementById('logout-btn');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Reset error state
        errorMessage.classList.add('hidden');
        errorMessage.textContent = '';
        
        const accountID = document.getElementById('accountID').value.toUpperCase();
        const pin = document.getElementById('pin').value;

        try {
            // Fetch data from Netlify Function (redirected via netlify.toml)
            const response = await fetch('/api/api', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action: 'login', accountID, pin })
            });

            // Error handling: Check if response is valid JSON before parsing
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new Error("Server returned an invalid response (Not JSON).");
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Authentication failed');
            }

            // Success: Update UI
            document.getElementById('welcome-message').textContent = `Welcome, ${data.name}`;
            document.getElementById('balance-amount').textContent = data.balance.toLocaleString();
            
            // Switch Views
            loginContainer.classList.add('hidden');
            dashboardContainer.classList.remove('hidden');

        } catch (error) {
            console.error('Login Error:', error);
            errorMessage.textContent = error.message || 'An unexpected error occurred.';
            errorMessage.classList.remove('hidden');
        }
    });

    logoutBtn.addEventListener('click', () => {
        // Reset and switch back to login
        loginForm.reset();
        dashboardContainer.classList.add('hidden');
        loginContainer.classList.remove('hidden');
    });
});
