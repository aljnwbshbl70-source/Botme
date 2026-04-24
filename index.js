const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { handleCommand } = require('./commands');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session_auth');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    // إرسال الكود لصفحة الويب فور توليده
    if (!sock.authState.creds.registered) {
        const phoneNumber = "4915511812468"; // الرقم هنا
        setTimeout(async () => {
            let code = await sock.requestPairingCode(phoneNumber);
            io.emit('pairing-code', code); // إرسال الكود للصفحة
            console.log("تم توليد الكود وإرساله للواجهة:", code);
        }, 5000);
    }

    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message || m.key.fromMe) return;
        const from = m.key.remoteJid;
        const body = m.message.conversation || m.message.extendedTextMessage?.text || "";
        if (body.startsWith(".")) {
            const args = body.slice(1).trim().split(/ +/);
            const cmd = args.shift().toLowerCase();
            await handleCommand(sock, from, cmd, args, m);
        }
    });

    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

startBot();
