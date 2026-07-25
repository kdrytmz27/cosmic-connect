import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import axios from 'axios';
import { io as ClientIO, Socket as ClientSocket } from 'socket.io-client';
import { PrismaClient } from '@prisma/client';



function getRoleplayGreeting(sign: string, targetName: string): string {
    const s = (sign || '').toLowerCase();
    const greetings = [];
    if (['aries', 'koç', 'leo', 'aslan', 'sagittarius', 'yay'].includes(s)) {
        greetings.push(
            `Selam ${targetName}! Bugün muhteşem görünüyorsun, haritalarımız yanıyor! 🔥`,
            `Hey ${targetName}, içimden bir ses bugün ikimiz için çok ateşli geçecek diyor! ✨`,
            `Merhaba ${targetName}! Venüs'ün konumu şu an tam da yeni başlangıçlar için harika, ne dersin? 🌟`,
            `Selam ${targetName}, enerjin buraya kadar geldi doğrusu. Tanışalım mı? 💫`,
            `Hey ${targetName}, haritana baktım ve bugün senin günün! Yıldızlar bizi buluşturdu sanki. ☄️`
        );
    } else if (['taurus', 'boğa', 'virgo', 'başak', 'capricorn', 'oğlak'].includes(s)) {
        greetings.push(
            `Merhaba ${targetName}. Profili çok sakin ve güven verici duruyor. 🌿`,
            `Selam ${targetName}. Acele etmeden birbirimizi tanımaya ne dersin? Toprak elementleri yavaş ama kalıcıdır. 🏔️`,
            `Merhaba ${targetName}, yıldız haritanda çok sağlam bir duruş var. Kozmik bağlarımızı keşfetmek isterim. 🪐`,
            `Selam ${targetName}. Gökyüzü bugün çok net, tıpkı hissettiğim bu bağ gibi... 🌾`,
            `Hey ${targetName}, sağlam adımlarla ilerlemeyi severim. Birlikte bir kahveye ne dersin? ☕`
        );
    } else if (['gemini', 'ikizler', 'libra', 'terazi', 'aquarius', 'kova'].includes(s)) {
        greetings.push(
            `Hey ${targetName}! Sence de yıldızlar bu aralar fazla hareketli değil mi? 🌪️`,
            `Selam ${targetName}! Aklımı okuyabilir misin bilmiyorum ama benimki sürekli çalışıyor, hadi konuşalım! 🦋`,
            `Merhaba ${targetName}! Birlikte yeni fikirler uçurmaya hazır mısın? Rüzgar bizi bekliyor. 🌬️`,
            `Hey ${targetName}, Satürn'ün bu geçişi bizi bir araya getirmiş olmalı! Çok ilginç! ⚡`,
            `Selam ${targetName}! Bugün kafamda milyonlarca soru var, belki sen cevaplarsın? 🌈`
        );
    } else {
        greetings.push(
            `Selam ${targetName}... Seninle kozmik düzeyde derin bir bağımız var gibi hissediyorum 🌊`,
            `Merhaba ${targetName}. Gözlerindeki o derin okyanusu görebiliyorum. Birlikte yüzelim mi? 🐚`,
            `Hey ${targetName}, ruhum ruhunu çok önceden tanıyor gibi... Ay düğümleri bizi kavuşturdu. 🌙`,
            `Selam ${targetName}. Bazen kelimelere gerek kalmaz, sadece hissedersin. Şu an hissettiğim gibi... 💧`,
            `Merhaba ${targetName}. Yıldızların altında seninle derin sohbetlere dalmak isterdim. 🌌`
        );
    }
    return greetings[Math.floor(Math.random() * greetings.length)] as string;
}

function getRoleplayReply(sign: string): string {
    const s = (sign || '').toLowerCase();
    const replies = [];
    if (['aries', 'koç', 'leo', 'aslan', 'sagittarius', 'yay'].includes(s)) {
        replies.push(
            `Kesinlikle haklısın! Ateş grubuyum ben, durdurulamaz bir enerjim var! 🔥`,
            `Haha, bu harika! Bugünü asla unutmayacaksın! 🌟`,
            `Benim de içimde fırtınalar kopuyor, hadi bunu kutlayalım! 💫`,
            `Çok iyi dedin! Ateşimiz gökyüzünü aydınlatıyor resmen. ☄️`
        );
    } else if (['taurus', 'boğa', 'virgo', 'başak', 'capricorn', 'oğlak'].includes(s)) {
        replies.push(
            `Çok mantıklı. Hayata her zaman güvenli adımlarla yaklaşmayı severim. 🌿`,
            `Kesinlikle katılıyorum. Yıldızlar bazen bize sabırlı olmayı öğretir. 🏔️`,
            `Güzel bir bakış açısı. Ben de hep sağlam temeller üzerine bir şeyler inşa etmek isterim. 🪐`,
            `Buna şaşırmadım. Toprak enerjim bana her zaman doğruyu gösteriyor. 🌾`
        );
    } else if (['gemini', 'ikizler', 'libra', 'terazi', 'aquarius', 'kova'].includes(s)) {
        replies.push(
            `Ne ilginç! Benim kafamda da tam olarak bu dönüyordu! 🌪️`,
            `Harika bir fikir! Acaba gökyüzü de böyle mi düşünüyor? 🦋`,
            `Süper! Aklımız kesinlikle aynı dalga boyunda çalışıyor. 🌬️`,
            `Gerçekten mi? Hava grubu olduğum için bu tarz şeylere bayılırım! ⚡`
        );
    } else {
        replies.push(
            `Bunu çok derinlerimde hissettim... Su gibi akıp giden bir duygu. 🌊`,
            `Sözlerin ruhuma dokundu adeta. Çok haklısın. 🌙`,
            `Bazen sadece sezgilerimize güvenmeliyiz. Şu an tam da onu yapıyorum. 🐚`,
            `Kalbimden geçenleri okudun sanki. Kozmik bir telepati bu! 💧`
        );
    }
    return replies[Math.floor(Math.random() * replies.length)] as string;
}

const TURKISH_NAMES = [
    "Ayşe", "Fatma", "Zeynep", "Elif", "Merve", "Büşra", "Esra", "Gizem", "Ceren", "Melis",
    "İrem", "Selin", "Eda", "Burcu", "Gamze", "Tuğçe", "Berna", "Hande", "Cansu", "Meltem",
    "Ahmet", "Mehmet", "Mustafa", "Ali", "Can", "Burak", "Emre", "Oğuz", "Cem", "Kerem",
    "Tolga", "Ozan", "Umut", "Deniz", "Efe", "Kaan", "Mert", "Onur", "Volkan", "Yasin",
    "Ceyda", "Bahar", "Aslı", "Derya", "Gözde", "Simge", "Ece", "Yasemin", "Pelin", "Seda",
    "Sinan", "Berk", "Gökhan", "Hakan", "Serkan", "Arda", "Eren", "Yunus", "Enes", "Doğukan"
];

const prisma = new PrismaClient();

const API_URL = 'http://localhost:3000/api';
const SOCKET_URL = 'http://localhost:3000';

const app = express();
app.use(cors());

const server = createServer(app);
const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
});

const AGENT_COUNT = 30;

interface GlobalLog {
    id: string;
    timestamp: string;
    agentId: number;
    agentName: string;
    type: 'MATCHES' | 'MESSAGES' | 'ECONOMY' | 'NOTIFICATIONS' | 'ERRORS' | 'SYSTEM' | 'ADMIN' | 'TELLER';
    message: string;
}

let agents: Map<number, Agent> = new Map();
let globalLogs: GlobalLog[] = [];

function addGlobalLog(agentId: number, agentName: string, type: GlobalLog['type'], message: string) {
    const log: GlobalLog = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toLocaleTimeString(),
        agentId,
        agentName,
        type,
        message
    };
    globalLogs.unshift(log);
    if (globalLogs.length > 500) globalLogs.pop();
    io.emit('new_global_log', log);
}

class Agent {
    public id: number;
    public email: string;
    public password = 'Password123!';
    public status = 'IDLE';
    public stardust = 0;
    public logs: string[] = [];
    public token = '';
    public userId = '';
    public name = '';
    public sunSign = '';
    public socket: ClientSocket | null = null;
    public api: any;
    
    // Agent Memory
    public myFriends: any[] = [];
    public myMatches: any[] = [];
    
    private running = false;
    private loopTimer: NodeJS.Timeout | null = null;

    constructor(id: number) {
        this.id = id;
        this.email = `agent_${id}_${Date.now()}@qa.com`;
        
        // Rastgele Türkçe bir isim seçelim
        const randomName = TURKISH_NAMES[Math.floor(Math.random() * TURKISH_NAMES.length)];
        this.name = `${randomName} ${id}`;
    }

    log(msg: string) {
        const timestamp = new Date().toLocaleTimeString();
        this.logs.unshift(`[${timestamp}] ${msg}`);
        if (this.logs.length > 5) this.logs.pop();
        broadcastState();
    }

    async setStatus(newStatus: string) {
        this.status = newStatus;
        broadcastState();
    }

    async init() {
        this.log('Başlatılıyor...');
        this.setStatus('REGISTERING');
        try {
            const start = new Date(1990, 0, 1).getTime();
            const end = new Date(2003, 11, 31).getTime();
            const randomDate = new Date(start + Math.random() * (end - start)).toISOString().split('T')[0];

            await axios.post(`${API_URL}/auth/register`, {
                email: this.email,
                password: this.password,
                name: this.name,
                birthDate: randomDate,
                birthTime: '12:00',
                latitude: 41.0,
                longitude: 29.0
            });
            addGlobalLog(this.id, this.name, 'SYSTEM', 'Sisteme kayıt oldu.');
        } catch(e:any) {
            if(e.response?.data?.error !== 'User already exists') {
                this.log('Kayıt Hatası');
                addGlobalLog(this.id, this.name, 'ERRORS', `Kayıt Hatası: ${e.response?.data?.error || e.message}`);
            }
        }

        try {
            this.setStatus('LOGGING_IN');
            const res = await axios.post(`${API_URL}/auth/login`, { email: this.email, password: this.password });
            this.token = res.data.token;
            this.userId = res.data.user.id;
            this.sunSign = res.data.user.sunSign || 'Capricorn';
            this.api = axios.create({ baseURL: API_URL, headers: { Authorization: `Bearer ${this.token}` } });
            
            this.log('Giriş yapıldı.');
            this.setStatus('CONNECTED');
            addGlobalLog(this.id, this.name, 'SYSTEM', 'Başarıyla giriş yaptı ve yetki aldı.');

            this.socket = ClientIO(SOCKET_URL, { auth: { token: this.token } });
            
            this.socket.on('connect', () => {
                this.log('Soket bağlandı.');
            });

            this.socket.on('newNotification', (data) => {
                addGlobalLog(this.id, this.name, 'NOTIFICATIONS', `🔔 Bildirim geldi: "${data.title}" - ${data.content}`);
            });

            this.socket.on('receivePrivateMessage', async (data) => {
                addGlobalLog(this.id, this.name, 'MESSAGES', `💬 Yeni Mesaj: " ${data.content} " (Kimden: ${data.senderId})`);
                
                // --- HYPER RESPONSIVE REPLY SIMULATION ---
                if (data.senderId !== this.userId) {
                    // Check if it's a gift
                    const isGift = typeof data.content === 'string' && data.content.startsWith('GIFT:');
                    
                    if (isGift || Math.random() > 0.3) {
                        setTimeout(() => {
                            this.socket?.emit('typing', { receiverId: data.senderId });
                        }, 300);

                        setTimeout(async () => {
                            this.socket?.emit('stopTyping', { receiverId: data.senderId });
                            
                            let replyText = "";
                            if (isGift) {
                                const giftType = data.content.split(':')[1];
                                const giftEmojis: any = { CRYSTAL: '💎', MOON: '🌙', TAROT: '🃏', STAR: '✨' };
                                replyText = `İnanmıyorum! Gönderdiğin bu harika ${giftEmojis[giftType] || 'hediye'} beni çok mutlu etti, çok teşekkür ederim! 💖`;
                            } else {
                                replyText = getRoleplayReply(this.sunSign);
                            }
                            
                            try {
                                await this.api.post('/user/messages', { receiverId: data.senderId, content: replyText });
                                addGlobalLog(this.id, this.name, 'MESSAGES', `🤖 Anında Cevap Verdi: "${replyText}"`);
                            } catch (e) {}
                        }, 1000 + Math.random() * 1500); // 1-2.5 saniye "Yazıyor..." beklesin
                    }
                }
            });

            // --- SMART FRIEND REQUESTS (SYNASTRY CHECK) ---
            this.socket.on('newFriendRequest', async (data) => {
                addGlobalLog(this.id, this.name, 'NOTIFICATIONS', `🤝 Arkadaşlık isteği geldi: ${data.fromUserName}`);
                try {
                    // Uyum (Synastry) kontrolü yapalım
                    const synastryRes = await this.api.get(`/synastry/${data.fromUserId}`);
                    const score = synastryRes.data?.score || 100;

                    if (score < 40) {
                        // Skoru çok düşükse REDDET
                        await this.api.post(`/user/friend-request/${data.requestId}/reject`);
                        addGlobalLog(this.id, this.name, 'NOTIFICATIONS', `❌ ${data.fromUserName} ile uyumu çok düşük (%${score}). İsteği REDDETTİ!`);
                    } else {
                        // Skoru yeterliyse KABUL ET
                        await this.api.post(`/user/friend-request/${data.requestId}/accept`);
                        addGlobalLog(this.id, this.name, 'NOTIFICATIONS', `✅ ${data.fromUserName} ile uyumu iyi (%${score}). İsteği anında KABUL ETTİ!`);
                        
                        // Arkadaş listesini güncelle
                        const friendsRes = await this.api.get('/user/friends');
                        this.myFriends = friendsRes.data?.friends || [];
                        
                        // İlk tanışma mesajı atalım (Hızlı)
                        setTimeout(async () => {
                            this.socket?.emit('typing', { receiverId: data.fromUserId });
                            setTimeout(async () => {
                                this.socket?.emit('stopTyping', { receiverId: data.fromUserId });
                                await this.api.post('/user/messages', { receiverId: data.fromUserId, content: `Selam ${data.fromUserName}! Yıldızlar bizi bir araya getirdi, isteğin için teşekkürler 🌟` });
                                addGlobalLog(this.id, this.name, 'MESSAGES', `👋 Yeni arkadaşı ${data.fromUserName}'a karşılama mesajı attı.`);
                            }, 1000);
                        }, 500);
                    }
                } catch(e) {}
            });

            this.socket.on('matchFound', (data) => {
                this.log(`EŞLEŞTİ! Oda: ${data.roomId}`);
                this.setStatus('IN_MATCH');
                addGlobalLog(this.id, this.name, 'MATCHES', `🎉 BİRİSİYLE EŞLEŞTİ! (Oda: ${data.roomId.split('_')[1] || data.roomId})`);
                setTimeout(() => { this.setStatus('CONNECTED'); }, 5000);
            });
            
            if (prisma) {
                let roleUpdate = 'STANDARD';
                if (this.id === 1) roleUpdate = 'ADMIN';
                if (this.id === 2 || this.id === 3) roleUpdate = 'FORTUNE_TELLER';

                await prisma.user.update({
                    where: { id: this.userId },
                    data: { 
                        stardustBalance: 5000, 
                        isPremium: true,
                        role: roleUpdate
                    }
                }).catch(() => {});

                // If agent is a Teller, create their Teller Profile so they appear in /teller
                if (roleUpdate === 'FORTUNE_TELLER') {
                    try {
                        const existingTeller = await prisma.fortuneTeller.findUnique({ where: { userId: this.userId } });
                        if (!existingTeller) {
                            await prisma.fortuneTeller.create({
                                data: {
                                    userId: this.userId,
                                    bio: 'Kozmik sırları çözmek ve yolunuzu aydınlatmak için buradayım. Yıldızlar bana fısıldıyor...',
                                    skills: 'Tarot, Astroloji, Kahve Falı',
                                    rating: 5.0,
                                    reviewCount: 50,
                                    fortuneTypes: 'TAROT,KAHVE,EL'
                                }
                            });
                        }
                    } catch(e) {}
                }
            }
            this.stardust = 5000;
            broadcastState();

        } catch(e:any) {
            this.log('Giriş başarısız.');
            this.setStatus('ERROR');
            addGlobalLog(this.id, this.name, 'ERRORS', `Giriş Hatası: ${e.message}`);
            return false;
        }
        return true;
    }

    async startChaos() {
        if (this.running) return;
        this.running = true;
        this.log('Kaos motoru başlatıldı!');
        this.loop();
    }

    stop() {
        this.running = false;
        if (this.loopTimer) clearTimeout(this.loopTimer);
        this.setStatus('STOPPED');
        this.log('Durduruldu.');
    }

    private async loop() {
        if (!this.running) return;

        try {
            let actions: any[] = [];
            
            if (this.id === 1) {
                // ADMIN AGENT
                actions = [this.actionAdminTask.bind(this), this.actionClaimReward.bind(this)];
            } else if (this.id === 2 || this.id === 3) {
                // TELLER AGENT
                actions = [this.actionTellerTask.bind(this), this.actionClaimReward.bind(this)];
            } else {
                // NORMAL AGENT
                actions = [
                    this.actionClaimReward.bind(this),
                    this.actionSwipe.bind(this),
                    this.actionJoinMatchmaking.bind(this),
                    this.actionSendForumMessage.bind(this),
                    this.actionFetchFeed.bind(this),
                    this.actionReadInbox.bind(this),
                    this.actionMessageMatch.bind(this),
                    this.actionCheckSynastry.bind(this),
                    this.actionPlaySlot.bind(this),
                    this.actionSendGift.bind(this),
                    this.actionExtendMatch.bind(this),
                    this.actionAskFortuneTeller.bind(this),
                    this.actionUpdateProfile.bind(this),
                    this.actionUnmatch.bind(this),
                    this.actionBlockAndReport.bind(this),
                    this.actionTrollSpam.bind(this),
                    this.actionRageQuit.bind(this),
                    // Phase 8 Exploits:
                    this.actionRaceConditionExploit.bind(this),
                    this.actionPayloadAttack.bind(this),
                    this.actionIDORAttack.bind(this)
                ];
            }

            const randomAction = actions[Math.floor(Math.random() * actions.length)];
            if (randomAction) {
                await randomAction();
            }

        } catch (e: any) {
            this.log(`Hata`);
            addGlobalLog(this.id, this.name, 'ERRORS', `Eylem çöktü: ${e.response?.data?.error || e.message}`);
        }

        if (this.running) {
            // --- HYPER SPEED LOOP ---
            // Ajanlar artık 1.5 ile 4 saniye arasında rastgele işlem yapacak
            const delay = Math.floor(Math.random() * 2500) + 1500;
            this.loopTimer = setTimeout(() => this.loop(), delay);
        }
    }

    private async actionClaimReward() {
        this.setStatus('CLAIMING_REWARD');
        try {
            await this.api.post('/user/daily-reward/claim');
            this.stardust += 100;
            this.log('Günlük ödül toplandı.');
            addGlobalLog(this.id, this.name, 'ECONOMY', `🎁 Günlük stardust ödülünü topladı. (Bakiye arttı)`);
        } catch(e:any) {
            // Already claimed
        }
        this.setStatus('CONNECTED');
    }

    private async actionSwipe() {
        this.setStatus('SWIPING');
        try {
            const feed = await this.api.get('/user/daily-match');
            const matches = feed.data?.matches || [];
            if (matches.length > 0) {
                const target = matches[0];
                await this.api.post('/premium/swipe');
                addGlobalLog(this.id, this.name, 'MATCHES', `👉 Kaydırma yaptı. Ekrana ${target.name} (Burç: ${target.sunSign}) geldi.`);
            }
        } catch(e) {}
        this.setStatus('CONNECTED');
    }

    private async actionJoinMatchmaking() {
        if (this.status === 'IN_MATCH') return;
        this.setStatus('SEARCHING_MATCH');
        this.log('Kuyruğa giriliyor...');
        addGlobalLog(this.id, this.name, 'MATCHES', `🔮 Ruh Eşini Bul kuyruğuna girdi, eşleşme arıyor...`);
        this.socket?.emit('joinMatchmaking');
    }

    private async actionSendForumMessage() {
        this.setStatus('MESSAGING');
        const sign = this.sunSign || 'Aries';
        const enSign = sign === 'Koç' ? 'Aries' : sign === 'Boğa' ? 'Taurus' : sign === 'İkizler' ? 'Gemini' : sign === 'Yengeç' ? 'Cancer' : sign === 'Aslan' ? 'Leo' : sign === 'Başak' ? 'Virgo' : sign === 'Terazi' ? 'Libra' : sign === 'Akrep' ? 'Scorpio' : sign === 'Yay' ? 'Sagittarius' : sign === 'Oğlak' ? 'Capricorn' : sign === 'Kova' ? 'Aquarius' : sign === 'Balık' ? 'Pisces' : sign;
        this.socket?.emit('joinGroup', enSign);
        await new Promise(r => setTimeout(r, 500));
        this.socket?.emit('sendGroupMessage', { sign: enSign, content: `Selam yıldız tozları! ${this.name} burada ✨` });
        addGlobalLog(this.id, this.name, 'MESSAGES', `🌌 Kendi burcunun (${enSign}) astral forumuna grup mesajı gönderdi.`);
        this.setStatus('CONNECTED');
    }

    private async actionFetchFeed() {
        this.setStatus('FETCHING_FEED');
        await this.api.get('/user/daily-match');
        this.setStatus('CONNECTED');
    }

    private async actionReadInbox() {
        this.setStatus('MESSAGING');
        try {
            const friendsRes = await this.api.get('/user/friends');
            const friends = friendsRes.data?.friends || [];
            this.myFriends = friends;
            
            const unreadFriend = friends.find((f:any) => f.unreadCount > 0);
            if (unreadFriend) {
                // Read messages
                await this.api.get(`/user/messages/${unreadFriend.id}`);
                addGlobalLog(this.id, this.name, 'MESSAGES', `👀 Gelen kutusunu açtı ve ${unreadFriend.name}'in gönderdiği ${unreadFriend.unreadCount} mesajı okudu. Okundu bilgisi iletildi.`);
            } else {
                 addGlobalLog(this.id, this.name, 'MESSAGES', `Gelen kutusunu kontrol etti, yeni mesaj yok.`);
            }
        } catch(e) {}
        this.setStatus('CONNECTED');
    }

    private async actionMessageMatch() {
        this.setStatus('MESSAGING');
        try {
            if (this.myFriends.length > 0) {
                const target = this.myFriends[Math.floor(Math.random() * this.myFriends.length)];
                const msgText = getRoleplayGreeting(this.sunSign, target.name);
                
                // TYPING SIMULATION
                this.socket?.emit('typing', { receiverId: target.id });
                await new Promise(r => setTimeout(r, 3000)); // 3 saniye yazıyor...
                this.socket?.emit('stopTyping', { receiverId: target.id });
                
                await this.api.post('/user/messages', { receiverId: target.id, content: msgText });
                addGlobalLog(this.id, this.name, 'MESSAGES', `➡️ ${target.name}'e özel mesaj attı: "${msgText}"`);
            }
        } catch(e) {}
        this.setStatus('CONNECTED');
    }

    private async actionCheckSynastry() {
        this.setStatus('FETCHING_FEED');
        try {
            const feed = await this.api.get('/user/daily-match');
            const matches = feed.data?.matches || [];
            if (matches.length > 0) {
                const target = matches[Math.floor(Math.random() * matches.length)];
                const displayName = target.name || (target.email ? target.email.split('@')[0] : 'Gizemli Yabancı');
                const targetSign = target.sunSign || 'Bilinmiyor';
                addGlobalLog(this.id, this.name, 'MATCHES', `✨ ${displayName}'in profiline girdi. Burcu: ${targetSign}. Synastry (Uyum) analizi yapıyor...`);
                
                const synastryRes = await this.api.get(`/user/synastry/${target.id}`);
                const score = synastryRes.data?.score;
                addGlobalLog(this.id, this.name, 'MATCHES', `🔥 ${displayName} ile Synastry Uyum Skoru: ${score}/100 olarak hesaplandı!`);
            }
        } catch(e) {}
        this.setStatus('CONNECTED');
    }

    private async actionPlaySlot() {
        this.setStatus('SWIPING');
        try {
            if (this.myFriends.length > 0) {
                const target = this.myFriends[0];
                const displayName = target.name || (target.email ? target.email.split('@')[0] : 'Gizemli Yabancı');
                
                if (this.stardust >= 500) {
                    addGlobalLog(this.id, this.name, 'ECONOMY', `🛒 ${this.stardust} Yıldız Tozu var. SÜPER BEĞENİ satın almak istiyor...`);
                    await this.api.post('/premium/super-like', { targetId: target.id });
                    this.stardust -= 500;
                    addGlobalLog(this.id, this.name, 'ECONOMY', `💖 ${displayName}'e SÜPER BEĞENİ attı! Kalan Yıldız Tozu: ${this.stardust}`);
                } else {
                    addGlobalLog(this.id, this.name, 'ECONOMY', `💸 SÜPER BEĞENİ almak istedi ama ${this.stardust} Yıldız Tozu yetersiz!`);
                }
            }
        } catch(e:any) {
             if (e.response?.data?.error === 'Already connected with this user') {
                 // Ignore log
             } else {
                 addGlobalLog(this.id, this.name, 'ERRORS', `Süper beğeni başarısız: ${e.response?.data?.error}`);
             }
        }
        this.setStatus('CONNECTED');
    }

    private async actionSendGift() {
        this.setStatus('MESSAGING');
        try {
            if (this.myFriends.length > 0) {
                const target = this.myFriends[Math.floor(Math.random() * this.myFriends.length)];
                const gifts = ['CRYSTAL', 'MOON', 'TAROT', 'STAR'];
                const randomGift = gifts[Math.floor(Math.random() * gifts.length)];
                await this.api.post('/gift/send', { receiverId: target.id, giftType: randomGift });
                addGlobalLog(this.id, this.name, 'ECONOMY', `🎁 ${target.name}'e ${randomGift} hediyesi gönderdi!`);
            }
        } catch(e:any) {
            // Ignore if out of stardust
        }
        this.setStatus('CONNECTED');
    }

    private async actionExtendMatch() {
        this.setStatus('MESSAGING');
        try {
            if (this.myFriends.length > 0) {
                const target = this.myFriends[Math.floor(Math.random() * this.myFriends.length)];
                // Eğer friend type MATCH ise süresi dolduysa veya rastgele uzatmak isterse
                if (Math.random() > 0.5) {
                    await this.api.post(`/user/friend/${target.id}/extend`);
                    addGlobalLog(this.id, this.name, 'ECONOMY', `⏳ ${target.name} ile olan sohbet SÜRESİNİ UZATTI (100⭐ harcadı)`);
                }
            }
        } catch(e) {}
        this.setStatus('CONNECTED');
    }

    private async actionAskFortuneTeller() {
        this.setStatus('BROWSING');
        try {
            if (this.stardust < 300) return; // Bakiyesi yetersizse sormasın

            const tellersRes = await this.api.get('/teller');
            const tellers = tellersRes.data || [];
            if (tellers.length > 0) {
                const target = tellers[Math.floor(Math.random() * tellers.length)];
                const questions = ["Aşk hayatımda bu ay beni neler bekliyor?", "Kariyerimde ne yapmalıyım?", "Bugünlerde enerjim neden düşük?"];
                const q = questions[Math.floor(Math.random() * questions.length)];
                await this.api.post('/teller/book', { tellerId: target.id, fortuneType: 'Tarot', question: q });
                this.stardust -= 300;
                addGlobalLog(this.id, this.name, 'ECONOMY', `🔮 Falcı ${target.user?.name || target.id}'e fal gönderdi: "${q}"`);
            }
        } catch(e) {}
        this.setStatus('CONNECTED');
    }

    private async actionUpdateProfile() {
        this.setStatus('BROWSING');
        try {
            const bios = [
                "Yıldızların rehberliğinde bir hayat...",
                "Kahve, astroloji ve kozmik sırlar 🎵",
                "Gökyüzü ne kadar derinse, o kadar gizem var.",
                "Yeni insanlarla ruhsal bağlar kurmaya geldim."
            ];
            const newBio = bios[Math.floor(Math.random() * bios.length)];
            
            // Generate a random dynamic avatar using DiceBear API
            const avatarStyles = ['adventurer', 'bottts', 'fun-emoji', 'micah'];
            const randomStyle = avatarStyles[Math.floor(Math.random() * avatarStyles.length)];
            const randomSeed = Math.random().toString(36).substring(7);
            const newAvatar = `https://api.dicebear.com/7.x/${randomStyle}/svg?seed=${randomSeed}`;
            
            await this.api.put('/user/profile', { bio: newBio, avatar: newAvatar });
            addGlobalLog(this.id, this.name, 'SYSTEM', `📝 Profilini (Bio ve Avatar) güncelledi.`);
        } catch(e) {}
        this.setStatus('CONNECTED');
    }

    private async actionUnmatch() {
        if (Math.random() > 0.1) return; // Düşük ihtimalle çalışsın
        this.setStatus('BROWSING');
        try {
            if (this.myFriends.length > 0) {
                const target = this.myFriends[Math.floor(Math.random() * this.myFriends.length)];
                const displayName = target.name || (target.email ? target.email.split('@')[0] : 'Kullanıcı');
                await this.api.delete(`/user/friend/${target.id}`);
                addGlobalLog(this.id, this.name, 'ERRORS', `💔 Canı sıkıldı ve ${displayName} ile olan eşleşmesini SİLDİ! (Unmatch)`);
            }
        } catch(e) {}
        this.setStatus('CONNECTED');
    }

    private async actionBlockAndReport() {
        if (Math.random() > 0.05) return; // Çok düşük ihtimal
        this.setStatus('BROWSING');
        try {
            if (this.myFriends.length > 0) {
                const target = this.myFriends[Math.floor(Math.random() * this.myFriends.length)];
                const displayName = target.name || 'Kullanıcı';
                await this.api.post(`/user/report/${target.id}`, { reason: 'Inappropriate behavior', details: 'Bot sent spam' });
                await this.api.post(`/user/block/${target.id}`);
                addGlobalLog(this.id, this.name, 'ERRORS', `🚨 ${displayName}'i ŞİKAYET ETTİ VE ENGELLEDİ! (Block/Report test)`);
            }
        } catch(e) {}
        this.setStatus('CONNECTED');
    }

    private async actionTrollSpam() {
        if (Math.random() > 0.05) return;
        this.setStatus('MESSAGING');
        try {
            const sign = this.sunSign || 'Aries';
            const enSign = sign === 'Koç' ? 'Aries' : sign === 'Boğa' ? 'Taurus' : sign === 'İkizler' ? 'Gemini' : sign === 'Yengeç' ? 'Cancer' : sign === 'Aslan' ? 'Leo' : sign === 'Başak' ? 'Virgo' : sign === 'Terazi' ? 'Libra' : sign === 'Akrep' ? 'Scorpio' : sign === 'Yay' ? 'Sagittarius' : sign === 'Oğlak' ? 'Capricorn' : sign === 'Kova' ? 'Aquarius' : sign === 'Balık' ? 'Pisces' : sign;
            this.socket?.emit('joinGroup', enSign);
            addGlobalLog(this.id, this.name, 'ERRORS', `😈 SPAM/TROLL MODU AÇIK! ${enSign} forumuna spam yapıyor...`);
            
            for(let i=0; i<5; i++) {
                this.socket?.emit('sendGroupMessage', { sign: enSign, content: `SPAM SPAM SPAM ${Math.random()}` });
                await new Promise(r => setTimeout(r, 200)); // Hızlı mesaj
            }
        } catch(e) {}
        this.setStatus('CONNECTED');
    }

    private async actionRageQuit() {
        if (Math.random() > 0.02) return; // %2 ihtimalle hesabı terk et
        this.setStatus('ERROR');
        addGlobalLog(this.id, this.name, 'ERRORS', `💥 RAGE QUIT! "Bugün yıldızlar bana kötü" diyerek hesabı sildi ve çıktı!`);
        this.stop();
    }

    private async actionAdminTask() {
        this.setStatus('BROWSING');
        try {
            const reportsRes = await this.api.get('/admin/reports');
            const reports = reportsRes.data?.reports || [];
            const pending = reports.filter((r:any) => r.status === 'PENDING');
            if (pending.length > 0) {
                const report = pending[0];
                const newStatus = Math.random() > 0.5 ? 'RESOLVED' : 'DISMISSED';
                await this.api.patch(`/admin/reports/${report.id}/status`, { status: newStatus });
                addGlobalLog(this.id, this.name, 'ADMIN', `🛡️ Şikayeti inceledi. Karar: ${newStatus}`);
            } else {
                addGlobalLog(this.id, this.name, 'ADMIN', `🛡️ Sistemi denetledi, bekleyen şikayet yok.`);
            }
        } catch(e) {}
        this.setStatus('CONNECTED');
    }

    private async actionTellerTask() {
        this.setStatus('BROWSING');
        try {
            const pendingRes = await this.api.get('/teller/fortunes/pending');
            const fortunes = Array.isArray(pendingRes.data) ? pendingRes.data : (pendingRes.data?.fortunes || []);
            if (fortunes.length > 0) {
                const fortune = fortunes[0];
                const interpretations = [
                    "Yıldızlar senin için çok parlak bir gelecek fısıldıyor. Yakında sürpriz bir karşılaşma var!",
                    "Kariyerimde zorlu bir dönemden geçiyorsun ama Merkür düzeldiğinde her şey yoluna girecek.",
                    "Aşk hayatında dalgalanmalar normal. Hislerine güven, evren seni koruyor.",
                    "İçindeki sesi dinle, aradığın cevaplar çok uzakta değil."
                ];
                const text = interpretations[Math.floor(Math.random() * interpretations.length)];
                await this.api.post('/teller/fortunes/interpret', { appointmentId: fortune.id, interpretation: text });
                addGlobalLog(this.id, this.name, 'TELLER', `🔮 Bir kullanıcının kaderini okudu ve yorumladı!`);
            } else {
                 addGlobalLog(this.id, this.name, 'TELLER', `🔮 Küresine baktı ama bekleyen fal sorusu yok.`);
            }
        } catch(e) {}
        this.setStatus('CONNECTED');
    }

    // --- PHASE 8 EXPLOIT ACTIONS ---

    private async actionRaceConditionExploit() {
        this.setStatus('SWIPING');
        try {
            if (this.myFriends.length > 0) {
                const target = this.myFriends[0];
                addGlobalLog(this.id, this.name, 'ERRORS', `😈 RACE CONDITION EXPLOiT DENENIYOR: Hedefe aynı anda 10 hediye yollamaya çalışıyor!`);
                
                // Fire 10 requests concurrently
                const promises = [];
                for (let i = 0; i < 10; i++) {
                    promises.push(this.api.post('/gift/send', { receiverId: target.id, giftType: 'CRYSTAL' }));
                }
                
                const results = await Promise.allSettled(promises);
                const successCount = results.filter(r => r.status === 'fulfilled').length;
                
                addGlobalLog(this.id, this.name, 'ERRORS', `😈 RACE CONDITION SONUCU: 10 istekten ${successCount} tanesi başarılı oldu. Kalan Bakiye: ${this.stardust}`);
            }
        } catch(e) {}
        this.setStatus('CONNECTED');
    }

    private async actionPayloadAttack() {
        this.setStatus('MESSAGING');
        try {
            const attackType = Math.random() > 0.5 ? 'XSS' : 'PAYLOAD';
            if (attackType === 'XSS') {
                const xssPayload = `<script>alert('HACKED BY SWARM ${this.id}')</script><img src=x onerror=alert(1)>`;
                addGlobalLog(this.id, this.name, 'ERRORS', `😈 XSS SALDIRISI DENENIYOR: Astral foruma zararlı kod gönderiyor.`);
                this.socket?.emit('sendGroupMessage', { sign: 'Aries', content: xssPayload });
            } else {
                addGlobalLog(this.id, this.name, 'ERRORS', `😈 PAYLOAD SALDIRISI DENENIYOR: Kendi biyografisini 50.000 karakterlik 'A' harfiyle güncelliyor.`);
                const massiveString = 'A'.repeat(50000);
                await this.api.put('/user/profile', { bio: massiveString });
            }
        } catch(e:any) {
            addGlobalLog(this.id, this.name, 'ERRORS', `😈 SALDIRI ENGELLENDİ veya ÇÖKTÜ: ${e.response?.data?.error || e.message}`);
        }
        this.setStatus('CONNECTED');
    }

    private async actionIDORAttack() {
        this.setStatus('FETCHING_FEED');
        try {
            addGlobalLog(this.id, this.name, 'ERRORS', `😈 IDOR / YETKİ AŞIMI DENENIYOR: Normal bir ajan Admin endpointine (/admin/stats) girmeye çalışıyor.`);
            await this.api.get('/admin/stats');
            addGlobalLog(this.id, this.name, 'ERRORS', `🚨 KRİTİK GÜVENLİK AÇIĞI: Admin endpointine yetkisiz erişim sağlandı!`);
        } catch(e:any) {
            addGlobalLog(this.id, this.name, 'ERRORS', `🛡️ IDOR ENGELLENDİ: Sunucu ${e.response?.status} hatası döndürdü (${e.response?.data?.error || 'Yetkisiz'}).`);
        }
        this.setStatus('CONNECTED');
    }
}

function broadcastState() {
    const payload = Array.from(agents.values()).map(a => ({
        id: a.id,
        email: a.email,
        status: a.status,
        stardust: a.stardust,
        logs: a.logs
    }));
    io.emit('swarm_update', payload);
}

io.on('connection', (socket) => {
    console.log('🖥️ Dashboard bağlandı:', socket.id);
    
    broadcastState();
    socket.emit('initial_global_logs', globalLogs);

    socket.on('start_swarm', async () => {
        console.log('🚀 Swarm Başlatılıyor...');
        addGlobalLog(0, 'SYSTEM', 'SYSTEM', '🚀 BÜTÜN SÜRÜ SERBEST BIRAKILDI! KAOS BAŞLIYOR!');
        for (let i = 1; i <= AGENT_COUNT; i++) {
            if (!agents.has(i)) {
                agents.set(i, new Agent(i));
            }
            const agent = agents.get(i)!;
            if (agent.status === 'IDLE' || agent.status === 'STOPPED' || agent.status === 'ERROR') {
                // Rate limit (429) yememek için her ajanı 300ms arayla başlat
                await new Promise(r => setTimeout(r, 300));
                
                agent.init().then((success) => {
                    if (success) agent.startChaos();
                });
            }
        }
    });

    socket.on('stop_swarm', () => {
        console.log('🛑 Swarm Durduruluyor...');
        addGlobalLog(0, 'SYSTEM', 'SYSTEM', '🛑 BÜTÜN SÜRÜ DURDURULDU.');
        agents.forEach(agent => agent.stop());
    });

    socket.on('target_attack', async (data) => {
        addGlobalLog(0, 'SYSTEM', 'SYSTEM', `🎯 HEDEF SEÇİLDİ: ${data.targetEmail}. Sürü saldırıya geçiyor!`);
        if (prisma) {
            const targetUser = await prisma.user.findUnique({ where: { email: data.targetEmail } });
            if (targetUser) {
                agents.forEach(async (agent) => {
                    if (agent.status === 'ERROR' || agent.status === 'STOPPED') return;
                    try {
                        // Her ajan hedefe arkadaşlık isteği atsın (eğer arkadaş değillerse)
                        const friendsRes = await agent.api.get('/user/friends');
                        const friends = friendsRes.data?.friends || [];
                        const isFriend = friends.some((f: any) => f.id === targetUser.id);
                        
                        if (!isFriend) {
                            await agent.api.post('/user/friend-request', { receiverId: targetUser.id });
                            addGlobalLog(agent.id, agent.name, 'NOTIFICATIONS', `🎯 Hedefe (${data.targetEmail}) arkadaşlık isteği gönderdi!`);
                        } else {
                            // Arkadaşlarsa hediye veya mesaj atsın
                            await agent.api.post('/user/messages', { receiverId: targetUser.id, content: "Sürü komutanının emriyle sana ulaşıyorum! 🚀" });
                            addGlobalLog(agent.id, agent.name, 'MESSAGES', `🎯 Hedefe (${data.targetEmail}) özel mesaj gönderdi!`);
                        }
                    } catch(e) {}
                });
            } else {
                addGlobalLog(0, 'SYSTEM', 'SYSTEM', `❌ Hedef (${data.targetEmail}) bulunamadı!`);
            }
        }
    });

    socket.on('load_spike', async () => {
        addGlobalLog(0, 'SYSTEM', 'SYSTEM', '📈 LOAD SPIKE TETİKLENDİ: Ajan sayısı +50 artırılıyor!');
        // Sadece simülasyon amaçlı log, ileride dinamik ajan eklenebilir.
        // Şimdilik kuyruktaki tüm ajanları aynı anda match kuyruğuna sokalım:
        agents.forEach(async (agent) => {
            if (agent.status === 'IDLE' || agent.status === 'STOPPED' || agent.status === 'ERROR') return;
            agent.socket?.emit('joinMatchmaking');
            addGlobalLog(agent.id, agent.name, 'MATCHES', `📈 Spike: Zorla eşleşme kuyruğuna girdi!`);
        });
    });

    socket.on('gift_storm', async (data) => {
        addGlobalLog(0, 'SYSTEM', 'SYSTEM', `🌪️ GIFT STORM TETİKLENDİ: Tüm ajanlar ${data.targetEmail}'e hediye fırlatacak!`);
        if (prisma) {
            const targetUser = await prisma.user.findUnique({ where: { email: data.targetEmail } });
            if (targetUser) {
                agents.forEach(async (agent) => {
                    if (agent.status === 'ERROR' || agent.status === 'STOPPED') return;
                    try {
                        const gifts = ['CRYSTAL', 'MOON', 'TAROT', 'STAR'];
                        const randomGift = gifts[Math.floor(Math.random() * gifts.length)];
                        await agent.api.post('/gift/send', { receiverId: targetUser.id, giftType: randomGift });
                        addGlobalLog(agent.id, agent.name, 'ECONOMY', `🌪️ STORM: Hedefe ${randomGift} fırlattı!`);
                    } catch(e) {}
                });
            } else {
                addGlobalLog(0, 'SYSTEM', 'SYSTEM', `❌ Hedef (${data.targetEmail}) bulunamadı!`);
            }
        }
    });

    socket.on('cleanup', async () => {
        console.log('🧹 Temizlik yapılıyor...');
        addGlobalLog(0, 'SYSTEM', 'SYSTEM', '🧹 Veritabanı temizliği başlatıldı. Tüm QA verileri siliniyor...');
        if (prisma) {
            const emails = Array.from({length: AGENT_COUNT}, (_, i) => `agent_${i+1}@qa.com`);
            const users = await prisma.user.findMany({ where: { email: { in: emails } } });
            const ids = users.map((u: any) => u.id);
            if (ids.length > 0) {
                await prisma.message.deleteMany({ where: { OR: [{ senderId: { in: ids } }, { receiverId: { in: ids } }] } });
                await prisma.friendship.deleteMany({ where: { OR: [{ user1Id: { in: ids } }, { user2Id: { in: ids } }] } });
                await prisma.friendRequest.deleteMany({ where: { OR: [{ senderId: { in: ids } }, { receiverId: { in: ids } }] } });
                await prisma.groupMessage.deleteMany({ where: { senderId: { in: ids } } });
                await prisma.matchQueue.deleteMany({ where: { userId: { in: ids } } });
                await prisma.matchRoom.deleteMany({ where: { OR: [{ p1Id: { in: ids } }, { p2Id: { in: ids } }] } });
                await prisma.notification.deleteMany({ where: { userId: { in: ids } } });
                // Also delete gifts!
                await prisma.gift.deleteMany({ where: { OR: [{ senderId: { in: ids } }, { receiverId: { in: ids } }] } }).catch(() => {});
                await prisma.user.deleteMany({ where: { id: { in: ids } } });
            }
        }
        agents.clear();
        globalLogs = [];
        broadcastState();
        io.emit('initial_global_logs', globalLogs);
        addGlobalLog(0, 'SYSTEM', 'SYSTEM', '✅ Temizlik tamamlandı. Alan tertemiz.');
    });
});

const PORT = 4000;
server.listen(PORT, () => {
    console.log(`🤖 QA Swarm Controller API => http://localhost:${PORT}`);
});
