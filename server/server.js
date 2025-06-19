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
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
    
    // --- Yahan bhi badlav hai ---

    // Step 1: Starter messages ke array se ek random message chunein.
    const randomIndex = Math.floor(Math.random() * starterMessages.length);
    const randomStarterText = starterMessages[randomIndex];

    // Step 2: Uss random message ko welcome message ke taur par set karein.
    const welcomeMessage = {
        id: 1, 
        sender: 'Nehanshi',
        text: randomStarterText, // Yahan random text use kiya hai
        timestamp: new Date().toISOString()
    };
    
    // Step 3: Har naye connection ki history is welcome message ke saath shuru karein.
    let messages = [welcomeMessage]; 
    let nextId = 2;

    // Step 4: Client ko connect hote hi ye initial message bhejein.
    socket.emit('initialHistory', messages);

    // ----------------------------


    socket.on('sendMessage', async (messageData) => {
        try {
            const userMessage = { ...messageData, sender: 'Akash', id: nextId++, timestamp: new Date().toISOString() };
            messages.push(userMessage);
            
            io.to(socket.id).emit('newMessage', userMessage);
            io.to(socket.id).emit('aiTyping', { isTyping: true });

            const chatHistoryForAI = messages.map(msg => `${msg.sender}: ${msg.text}`).join('\n');
            
            const prompt = `You are role-playing as Nehanshi, talking to your best friend Akash Saraswat. Their tone is casual, caring, and they use Hinglish (mix of Hindi and English) and emojis. Learn from the style of these examples:\n---\n${conversationExamples}\n---\nNow, continue the following conversation naturally. \n\nONGOING CHAT HISTORY:\n${chatHistoryForAI}\n\nGenerate Nehanshi's next single message as a response. IMPORTANT: Your response must be ONLY the message text. Do NOT include "Nehanshi:" in your output.`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const aiText = response.text().trim();

            const aiMessage = { id: nextId++, sender: 'Nehanshi', text: aiText, timestamp: new Date().toISOString() };
            messages.push(aiMessage);

            io.to(socket.id).emit('aiTyping', { isTyping: false });
            io.to(socket.id).emit('newMessage', aiMessage);

        } catch (error) {
            console.error("Error handling message or calling Gemini API:", error);
            io.to(socket.id).emit('aiTyping', { isTyping: false });
        }
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}. Chat session ended.`);
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});