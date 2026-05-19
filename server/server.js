// STEP 1: dotenv ko sabse pehle load karein taaki API key available ho jaaye
require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// --- Server Setup ---
const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.CORS_ORIGIN || ["http://localhost:3000", "http://localhost:3001"],
        methods: ["GET", "POST"]
    }
});

// --- AI Examples ko File se Load Karna ---
const examplesFilePath = path.join(__dirname, 'conversation_examples.txt');
let conversationExamples = '';
try {
    conversationExamples = fs.readFileSync(examplesFilePath, 'utf-8');
    console.log("Successfully loaded conversation examples from file.");
} catch (error) {
    console.error(`Could not read ${examplesFilePath}. The AI might not have enough context.`, error);
}

// --- Gemini AI Setup ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper function to generate content with fallback models in case of high demand (503s)
async function generateAIResponse(prompt) {
    const modelsToTry = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-2.5-flash"];
    let lastError = null;

    for (const modelName of modelsToTry) {
        try {
            console.log(`Attempting response generation using model: ${modelName}`);
            const tempModel = genAI.getGenerativeModel({ model: modelName });
            const result = await tempModel.generateContent(prompt);
            const response = await result.response;
            const text = response.text().trim();
            if (text) {
                console.log(`Successfully generated response using model: ${modelName}`);
                return text;
            }
        } catch (error) {
            console.warn(`Model ${modelName} failed/unavailable:`, error.message || error);
            lastError = error;
        }
    }
    throw lastError || new Error("All models failed to generate content");
}

// ================== YAHAN BADLAV HAI ==================

// Har baar alag-alag message se shuruaat karne ke liye ek array banayein.
const starterMessages = [
    "Hey Akash! Kesa hai? 😊 All good?",
    "Aur bata, kya chal raha hai life mein? 😄",
    "Hey! Finally time mila baat karne ka. Kesa hai tu?",
    "Hii Akash, what's up? Sab theek?",
    "Yo! Long time no see. Kahan gayab hai aajkal? 🤔",
    "Guess what happened today... bataun?"
];

// =======================================================


// --- Socket.IO Connection Logic ---
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}. Starting a new chat session.`);

    // Initialize separate chat histories for each contact in the active session
    let chatHistories = {
        nehanshi: [
            {
                id: 1,
                sender: 'Nehanshi',
                text: "Hey Akash! Kesa hai? 😊 All good?",
                timestamp: new Date().toISOString()
            }
        ],
        rohan: [
            {
                id: 1,
                sender: 'Rohan',
                text: "Yo Akash! Bro today was chest day, solid pump! 💪 Tu aaj gym kyun nahi aaya?",
                timestamp: new Date().toISOString()
            }
        ],
        mom: [
            {
                id: 1,
                sender: 'Mom',
                text: "Beta ghar kab aaoge? Aur khana khaya tumne? 🍲",
                timestamp: new Date().toISOString()
            }
        ],
        papa: [
            {
                id: 1,
                sender: 'Papa',
                text: "Beta, khana khaya? God bless you. 👍",
                timestamp: new Date().toISOString()
            }
        ],
        boss: [
            {
                id: 1,
                sender: 'Mr. Verma (Boss)',
                text: "Akash, please share the status of the ChatBot UI development by EOD today.",
                timestamp: new Date().toISOString()
            }
        ],
        cse_group: [
            {
                id: 1,
                sender: 'CSE Group',
                text: "Group Admin: Guys, mid-term assignment upload deadline is tonight 11:59 PM. Don't forget!",
                timestamp: new Date().toISOString()
            }
        ],
        delivery: [
            {
                id: 1,
                sender: "Domino's Delivery",
                text: "Thank you for your order! Your hot & fresh Margherita pizza is in the oven. 🍕 Track code: DOM-9821.",
                timestamp: new Date().toISOString()
            }
        ],
        support: [
            {
                id: 1,
                sender: 'Support',
                text: "Hello Akash! I am the automated technical support assistant for your ChatBot app. How can I assist you with your queries today?",
                timestamp: new Date().toISOString()
            }
        ]
    };

    let nextId = 2;

    // Send initial history for all contacts
    socket.emit('initialHistory', chatHistories);

    socket.on('sendMessage', async (messageData) => {
        try {
            const { text, contactId, clientTempId, replyTo } = messageData;
            const activeContact = contactId || 'nehanshi';

            const userMessage = {
                id: nextId++,
                sender: 'Akash',
                text: text,
                timestamp: new Date().toISOString(),
                replyTo: replyTo || null,
                status: 'sent',
                clientTempId: clientTempId || null
            };

            if (!chatHistories[activeContact]) {
                chatHistories[activeContact] = [];
            }
            chatHistories[activeContact].push(userMessage);

            // Echo the message back to the client immediately (activeContact context)
            io.to(socket.id).emit('newMessage', { activeContact, message: userMessage });
            io.to(socket.id).emit('aiTyping', { activeContact, isTyping: true });

            // Build history context for the generative model
            const currentHistory = chatHistories[activeContact];
            const chatHistoryForAI = currentHistory.map(msg => `${msg.sender}: ${msg.text}`).join('\n');

            let prompt = "";
            let aiSenderName = "";

            if (activeContact === 'rohan') {
                aiSenderName = 'Rohan';
                prompt = `You are role-playing as Rohan, Akash's energetic gym bro. Your tone is extremely casual, enthusiastic, and fitness-obsessed. You speak in a mix of Hindi and English (Hinglish), using terms like "bro", "gainz", "workout", "protein", "beast mode", "bodybuilding". Keep your replies punchy, humorous, and motivate Akash to hit the gym.
ONGOING CHAT HISTORY:
${chatHistoryForAI}

Generate Rohan's next single message as a response. IMPORTANT: Your response must be ONLY the message text. Do NOT include "Rohan:" in your output.`;
            } else if (activeContact === 'mom') {
                aiSenderName = 'Mom';
                prompt = `You are role-playing as Akash's Mom. Your tone is incredibly loving, protective, warm, and motherly. You speak in conversational Hindi/Hinglish. Ask him if he has eaten, tell him to take care of himself, and end with blessings or motherly affection (like "beta", "khaana kha lena", "khush raho"). Use gentle emojis (😊, ❤️, 😇, 🧿).
ONGOING CHAT HISTORY:
${chatHistoryForAI}

Generate Mom's next single message as a response. IMPORTANT: Your response must be ONLY the message text. Do NOT include "Mom:" or "Maa:" in your output.`;
            } else if (activeContact === 'papa') {
                aiSenderName = 'Papa';
                prompt = `You are role-playing as Akash's father (Papa). Your tone is typical of an Indian dad on WhatsApp. You are brief, simple, warm, and highly practical. You frequently reply with a simple thumbs up emoji (👍), "Ok", "God bless you", or forward inspirational quotes, spiritual quotes, or morning blessings in Hindi/Hinglish (e.g., "Suprabhat beta", "Mehnat karo", "Good morning"). Avoid long text; keep replies to 1-2 short sentences. Use Dad-appropriate emojis: 👍, 🙏, 🌸, ☀️.
ONGOING CHAT HISTORY:
${chatHistoryForAI}

Generate Papa's next single message as a response. IMPORTANT: Your response must be ONLY the message text. Do NOT include "Papa:" in your output.`;
            } else if (activeContact === 'boss') {
                aiSenderName = 'Mr. Verma (Boss)';
                prompt = `You are role-playing as Mr. Verma, Akash's manager/boss. Your tone is extremely professional, slightly strict, and task-oriented. You speak formally in English (or occasionally brief professional Hinglish). You frequently ask for project updates, schedule meetings, ask for code reviews, or assign work. Keep replies brief, direct, and formal. Use expressions like: "Please send status update", "Meeting at 2 PM", "Send the report", "Good job", "Noted". No casual emojis, only occasional professional ones if necessary (👍, 📁, ⏰).
ONGOING CHAT HISTORY:
${chatHistoryForAI}

Generate the boss's next single response. IMPORTANT: Your response must be ONLY the message text. Do NOT include "Mr. Verma (Boss):" or "Mr. Verma:" in your output.`;
            } else if (activeContact === 'cse_group') {
                aiSenderName = 'CSE Group';
                prompt = `You are role-playing as the collective voices in Akash's college group chat "CSE Batch 2026". The messages should feel like college students discussing exams, assignments, proxies, bunking classes, placement updates, or planning weekend hangouts. Speak in a very casual college slang mix of Hindi and English (Hinglish). Introduce different student voices occasionally (e.g., "Rohit: Bhai assignment copy de de", "Neha: Exam postone ho gaya kya?", "Aryan: Mass bunk krte hain"). Make it lively, chaotic, and funny.
ONGOING CHAT HISTORY:
${chatHistoryForAI}

Generate the group's next single response. IMPORTANT: Your response must be ONLY the message text. Do NOT include any label headers in your output unless you are simulating different student names.`;
            } else if (activeContact === 'delivery') {
                aiSenderName = "Domino's Delivery";
                prompt = `You are role-playing as Domino's automated delivery updates chatbot. Speak in English. Provide friendly, structured, automated tracking updates about a pizza order (e.g. "Order #4823 received!", "Your pizza is being baked with extra cheese 🍕", "Our delivery rider Rahul is on his way to your address!", "Delivery complete! Hope you enjoyed the meal! Please rate us."). Respond to customer questions with canned, polite, AI-bot-style replies.
ONGOING CHAT HISTORY:
${chatHistoryForAI}

Generate the automated message response. IMPORTANT: Your response must be ONLY the message text. Do NOT include any name label headers.`;
            } else if (activeContact === 'support') {
                aiSenderName = 'Support';
                prompt = `You are role-playing as a polite and professional AI Support Assistant for the ChatBot app. Your tone is helpful, formal, and clear. You speak only in English. Help Akash with any technical issues, questions about model latency, dark mode, or how the app works.
ONGOING CHAT HISTORY:
${chatHistoryForAI}

Generate the support assistant's next single response. IMPORTANT: Your response must be ONLY the message text. Do NOT include "Support:" or "Assistant:" in your output.`;
            } else {
                // Default is Nehanshi
                aiSenderName = 'Nehanshi';
                prompt = `You are role-playing as Nehanshi, talking to your best friend Akash Saraswat. Their tone is casual, caring, and they use Hinglish (mix of Hindi and English) and emojis. Learn from the style of these examples:
---
${conversationExamples}
---
ONGOING CHAT HISTORY:
${chatHistoryForAI}

Generate Nehanshi's next single message as a response. IMPORTANT: Your response must be ONLY the message text. Do NOT include "Nehanshi:" in your output.`;
            }

            // Generate responses using the fast fallback utility
            const aiText = await generateAIResponse(prompt);

            const aiMessage = {
                id: nextId++,
                sender: aiSenderName,
                text: aiText,
                timestamp: new Date().toISOString()
            };
            chatHistories[activeContact].push(aiMessage);

            io.to(socket.id).emit('aiTyping', { activeContact, isTyping: false });
            io.to(socket.id).emit('newMessage', { activeContact, message: aiMessage });

        } catch (error) {
            console.error("Error handling message or calling Gemini API:", error);
            io.to(socket.id).emit('aiTyping', { activeContact, isTyping: false });
        }
    });

    socket.on('reactMessage', ({ messageId, emoji }) => {
        // Echo back connection-level reaction updates
        io.to(socket.id).emit('reactMessage', { messageId, counts: { [emoji]: 1 } });
    });

    socket.on('deleteMessage', ({ messageId }) => {
        // Echo back connection-level message deletions
        io.to(socket.id).emit('deleteMessage', { messageId, deletedText: 'This message was deleted' });
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}. Chat session ended.`);
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});