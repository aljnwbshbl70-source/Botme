const handleCommand = async (sock, from, command, args, msg) => {
    const text = args.join(" ");
    switch (command) {
        case 'الاوامر':
            await sock.sendMessage(from, { text: "*📜 ميزات البوت المتاحة (V1.8.2)*\n\n.جيميني | .بلاك | .فيديو | .تيكتوك | .بنك | .منشن" });
            break;
        case 'بنج':
            await sock.sendMessage(from, { text: "⚡ Online & High Speed" });
            break;
        case 'بنك':
            await sock.sendMessage(from, { text: "💰 رصيدك: 10,000 نقطة" });
            break;
        case 'جيميني':
            await sock.sendMessage(from, { text: "🤖 أنا أسمعك، كيف أساعدك؟" });
            break;
    }
};
module.exports = { handleCommand };
