const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
const pino = require('pino');
const { Boom } = require('@hapi/boom');
const express = require('express');
const path = require('path');
const { handleCommand } = require('./commands'); 

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '/public/index.html')));
app.listen(PORT, () => console.log(`Camouflage System active on port: ${PORT}`));

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session_auth');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
        },
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    if (!sock.authState.creds.registered) {
        const phoneNumber = "201xxxxxxxxx"; // ضع رقمك هنا بالصيغة الدولية
        setTimeout(async () => {
            let code = await sock.requestPairingCode(phoneNumber);
            console.log(`\n\n🔗 PAIRING CODE: ${code}\n\n`);
        }, 5000);
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message || m.key.fromMe) return;
        const from = m.key.remoteJid;
        const body = m.message.conversation || m.message.extendedTextMessage?.text || "";
        const prefix = ".";

        if (body.startsWith(prefix)) {
            const args = body.slice(prefix.length).trim().split(/ +/);
            const cmd = args.shift().toLowerCase();
            await handleCommand(sock, from, cmd, args, m);
        }
    });

    sock.ev.on('connection.update', (u) => {
        const { connection, lastDisconnect } = u;
        if (connection === 'close') {
            if ((new Boom(lastDisconnect?.error)?.output?.statusCode) !== DisconnectReason.loggedOut) startBot();
        } else if (connection === 'open') { console.log('✅ Connected!'); }
    });
}
startBot();
