document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            if (loginError) {
                loginError.textContent = '';
            }

            try {
                const response = await fetch('http://localhost:8081/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                });

                if (!response.ok) {
                    throw new Error('Sai tên đăng nhập hoặc mật khẩu!');
                }

                const data = await response.json();
                
                if (data.token) {
                    localStorage.setItem('token', data.token);
                    
                    const loginModal = document.getElementById('loginModal');
                    if (loginModal) {
                        loginModal.style.display = 'none';
                    }
                    
                    window.location.reload();
                } else {
                    throw new Error('Đăng nhập thành công nhưng không nhận được token.');
                }

            } catch (error) {
                if (loginError) {
                    loginError.textContent = error.message;
                }
            }
        });
    }
});