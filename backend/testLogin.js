const axios = require('axios');

async function testLogin() {
    try {
        const res = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'user1@example.com',
            password: '123456'
        });
        console.log('API RESPONSE SUCCESS:');
        console.log({
            token: res.data.token.substring(0, 20) + '...',
            role: res.data.user.role
        });
    } catch (err) {
        console.error('API RESPONSE ERROR:', err.response?.data || err.message);
    }
}

testLogin();
