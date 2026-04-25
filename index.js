const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs-extra');

// ===== CONFIG =====
const TOKEN = '8633185755:AAHZtRotWFY2kXvgdW-Le1enQeE4R5GvsvAN';
const ADMIN_ID = 5077548751; // your Telegram user ID

const bot = new TelegramBot(TOKEN, { polling: true });

// ===== LOAD DB =====
const DB_FILE = './data.json';

function loadDB() {
    return fs.readJsonSync(DB_FILE);
}

function saveDB(data) {
    fs.writeJsonSync(DB_FILE, data, { spaces: 2 });
}

// ===== START MENU =====
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "📁 Welcome! Choose a category:", {
        reply_markup: {
            keyboard: [
                ["📁 HR", "📁 Finance"],
                ["📁 Reports", "🔍 Search"]
            ],
            resize_keyboard: true
        }
    });
});

// ===== CATEGORY HANDLER =====
bot.on('message', (msg) => {
    const text = msg.text;

    if (!text) return;

    if (text.startsWith("📁")) {
        const category = text.replace("📁 ", "").toLowerCase();
        const db = loadDB();

        const files = db.files.filter(f => f.category === category);

        if (files.length === 0) {
            bot.sendMessage(msg.chat.id, "No files in this category.");
            return;
        }

        files.forEach(file => {
            bot.sendDocument(msg.chat.id, file.file_id, {
                caption: `📄 ${file.name}`
            });
        });
    }
});

// ===== SEARCH =====
bot.onText(/\/search (.+)/, (msg, match) => {
    const query = match[1].toLowerCase();
    const db = loadDB();

    const results = db.files.filter(f =>
        f.name.toLowerCase().includes(query)
    );

    if (results.length === 0) {
        bot.sendMessage(msg.chat.id, "No results found.");
        return;
    }

    results.forEach(file => {
        bot.sendDocument(msg.chat.id, file.file_id, {
            caption: `📄 ${file.name}`
        });
    });
});

// ===== ADMIN UPLOAD =====
bot.on('document', (msg) => {
    if (msg.from.id !== ADMIN_ID) {
        bot.sendMessage(msg.chat.id, "❌ Not authorized.");
        return;
    }

    const file = msg.document;

    bot.sendMessage(msg.chat.id,
        "Send details in this format:\n\n" +
        "name | category\n\n" +
        "Example:\nInvoice April | finance"
    );

    bot.once('message', (reply) => {
        const parts = reply.text.split("|");

        if (parts.length < 2) {
            bot.sendMessage(msg.chat.id, "Invalid format.");
            return;
        }

        const name = parts[0].trim();
        const category = parts[1].trim().toLowerCase();

        const db = loadDB();

        db.files.push({
            name,
            category,
            file_id: file.file_id
        });

        saveDB(db);

        bot.sendMessage(msg.chat.id, "✅ File saved!");
    });
});

// ===== SEARCH BUTTON TRIGGER =====
bot.on('message', (msg) => {
    if (msg.text === "🔍 Search") {
        bot.sendMessage(msg.chat.id, "Use:\n/search keyword");
    }
});
