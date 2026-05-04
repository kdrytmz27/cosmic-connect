const io = require('socket.io-client');

const API_URL = 'http://localhost:3000/api';
const SOCKET_URL = 'http://localhost:3000';

async function apiCall(path, body = null, token = null) {
    const headers = {};
    if (body) headers['Content-Type'] = 'application/json';
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_URL}${path}`, {
        method: body ? 'POST' : 'GET',
        headers,
        body: body ? JSON.stringify(body) : undefined
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'API Error');
    return data;
}

async function runTest() {
    try {
        console.log('--- Starting Cosmic Connect E2E Test ---');
        const u1 = { email: `test1_${Date.now()}@test.com`, password: 'password123', birthDate: '1995-05-15', birthTime: '12:00', gender: 'MALE', interestedIn: 'FEMALE' };
        const u2 = { email: `test2_${Date.now()}@test.com`, password: 'password123', birthDate: '1996-08-20', birthTime: '14:30', gender: 'FEMALE', interestedIn: 'MALE' };

        const r1 = await apiCall('/auth/register', u1);
        const r2 = await apiCall('/auth/register', u2);
        const token1 = r1.token;
        const token2 = r2.token;
        const id1 = r1.user.id;
        const id2 = r2.user.id;
        console.log('✅ Users registered');

        console.log('--- Testing Slot Timing ---');
        let slotTested = false;
        const s1 = io.io(SOCKET_URL, { auth: { token: token1 } });
        s1.on('connect', () => console.log('U1 Socket connected'));

        s1.on('slot:state', async (data) => {
            if (data.state === 'BETTING' && !slotTested) {
                slotTested = true;
                console.log('Placing bet...');
                try {
                    await apiCall('/teller/slot', { betAmount: 1, betType: 'BIG' }, token1);
                    console.log('✅ Bet placed');
                } catch (e) { console.error('Bet failed:', e.message); }
            }
        });

        s1.on('slot:result', (data) => {
            console.log(data.win ? '✅ Slot Win!' : '✅ Slot Loss!', data);
        });

        setTimeout(() => {
            console.log('--- Testing Matchmaking Live Chat ---');
            const s2 = io.io(SOCKET_URL, { auth: { token: token2 } });
            let roomId = null;
            s1.emit('joinMatchmaking');
            s2.emit('joinMatchmaking');

            s1.on('matchFound', (data) => {
                console.log('✅ Match Found! Room:', data.roomId);
                roomId = data.roomId;
                setTimeout(() => {
                    console.log('U1 requesting extra time...');
                    s1.emit('requestExtraTime', { roomId });
                }, 1000);
            });

            s2.on('extraTimeRequested', () => {
                console.log('✅ Partner requested extra time. Approving...');
                s2.emit('requestExtraTime', { roomId });
            });

            s1.on('extraTimeGranted', (data) => {
                console.log(`✅ Extra time granted! +${data.addedSeconds}s`);
                console.log('--- Tests Completed Successfully ---');
                process.exit(0);
            });
        }, 3000);

    } catch (e) {
        console.error('❌ Test failed:', e.message);
        process.exit(1);
    }
}

runTest();
