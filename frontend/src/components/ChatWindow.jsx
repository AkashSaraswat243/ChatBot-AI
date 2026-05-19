// src/components/ChatWindow.jsx
import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { Link } from "react-router-dom";
import "../ChatWindow.css";

import { 
  IoArrowBack, 
  IoCall, 
  IoVideocam, 
  IoMoon, 
  IoSunny, 
  IoSend,
  IoMic,
  IoMicOff,
  IoVideocamOff
} from "react-icons/io5";
import {
  BsThreeDotsVertical,
  BsEmojiSmile,
  BsPaperclip,
  BsFillMicFill,
  BsMic,
} from "react-icons/bs";
import { 
  MdDone, 
  MdDoneAll, 
  MdDonutLarge, 
  MdChat, 
  MdMoreVert,
  MdCallEnd,
  MdVolumeUp,
  MdVolumeOff
} from "react-icons/md";
import { 
  FaBars, 
  FaPalette, 
  FaFileImage, 
  FaFileAlt, 
  FaCamera,
  FaPlay,
  FaPause,
  FaTrash,
  FaPlus
} from "react-icons/fa";

const BACKEND_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

// Contact List definitions with distinct avatars, status and descriptions
const contactsList = [
  { 
    id: 'nehanshi', 
    name: "Nehanshi Sharma", 
    avatar: process.env.PUBLIC_URL + '/girl-avatar.png', 
    lastSeen: "online",
    statusText: "Hey Akash! Kesa hai? 😊 All good?",
    description: "Best Friend | Hinglish & Emojis",
    stories: [
      { url: "https://images.unsplash.com/photo-1498804103079-a6351b050096?w=500&h=800&fit=crop&q=80", caption: "Chilling with coffee ☕️" },
      { url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&h=800&fit=crop&q=80", caption: "Vibe today is amazing 🌊" }
    ]
  },
  { 
    id: 'rohan', 
    name: "Rohan (Gym Bro)", 
    avatar: process.env.PUBLIC_URL + '/rohan-avatar.png', 
    lastSeen: "last seen today at 18:30",
    statusText: "Yo Akash! Bro chest day today 💪",
    description: "Gym Partner | Beast Mode 🏋️‍♂️",
    stories: [
      { url: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500&h=800&fit=crop&q=80", caption: "No pain no gain! 💪" }
    ]
  },
  { 
    id: 'mom', 
    name: "Mom ❤️", 
    avatar: process.env.PUBLIC_URL + '/mom-avatar.png', 
    lastSeen: "online",
    statusText: "Beta khana kha liya? 🍲",
    description: "Family | Caring Mother 🧿",
    stories: [
      { url: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&h=800&fit=crop&q=80", caption: "Made delicious Kheer today! 🥣" }
    ]
  },
  { 
    id: 'papa', 
    name: "Papa 🙏", 
    avatar: process.env.PUBLIC_URL + '/papa-avatar.png', 
    lastSeen: "last seen today at 09:15",
    statusText: "Beta, khana khaya? God bless you. 👍",
    description: "Family | Father 🙏",
    stories: [
      { url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=500&h=800&fit=crop&q=80", caption: "Suprabhat beta 🌅" }
    ]
  },
  { 
    id: 'boss', 
    name: "Mr. Verma (Boss)", 
    avatar: process.env.PUBLIC_URL + '/boss-avatar.png', 
    lastSeen: "online",
    statusText: "Akash, please share the status of the ChatBot UI development by EOD today.",
    description: "Work | Office Manager 📁",
    stories: []
  },
  { 
    id: 'cse_group', 
    name: "CSE Batch 2026 🎓", 
    avatar: process.env.PUBLIC_URL + '/group-avatar.png', 
    lastSeen: "online",
    statusText: "Group Admin: Guys, mid-term assignment upload deadline is tonight...",
    description: "Group Chat | College Batchmates 🎓",
    stories: [
      { url: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=500&h=800&fit=crop&q=80", caption: "Mass bunk tomorrow? 😂" }
    ]
  },
  { 
    id: 'delivery', 
    name: "Domino's Delivery 🍕", 
    avatar: process.env.PUBLIC_URL + '/delivery-avatar.png', 
    lastSeen: "online",
    statusText: "Thank you for your order! Your pizza is in the oven...",
    description: "Business Account | Pizza Delivery updates 🍕",
    stories: []
  },
  { 
    id: 'support', 
    name: "ChatBot AI Support", 
    avatar: process.env.PUBLIC_URL + '/support-avatar.png', 
    lastSeen: "online",
    statusText: "Automated Support Panel",
    description: "Official Helpdesk | English Only",
    stories: []
  }
];

const EMPTY_ARRAY = [];

const ChatWindow = () => {
  // Contact States
  const [activeContactId, setActiveContactId] = useState('nehanshi');
  const [chatHistories, setChatHistories] = useState({});
  const [typingStates, setTypingStates] = useState({ nehanshi: false, rohan: false, mom: false, papa: false, boss: false, cse_group: false, delivery: false, support: false });
  const [lastSeenTimes, setLastSeenTimes] = useState({
    nehanshi: "online",
    rohan: "last seen today at 18:30",
    mom: "online",
    papa: "last seen today at 09:15",
    boss: "online",
    cse_group: "online",
    delivery: "online",
    support: "online"
  });

  // UI / Inputs
  const [inputText, setInputText] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth <= 900);
  const [darkMode, setDarkMode] = useState(false);
  const [search, setSearch] = useState("");
  const [profileDrawer, setProfileDrawer] = useState(false);
  const [wallpaper, setWallpaper] = useState('pattern');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 900);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentPicker, setShowAttachmentPicker] = useState(false);
  const [attachmentMenuMode, setAttachmentMenuMode] = useState("main");
  const [selectedFile, setSelectedFile] = useState(null);
  const [showContactInfo, setShowContactInfo] = useState(false);

  // Advanced features state
  const [replyTo, setReplyTo] = useState(null); 
  const [reactionPickerFor, setReactionPickerFor] = useState(null); 
  const [reactionsMap, setReactionsMap] = useState({}); 
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [voicePlayingId, setVoicePlayingId] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageCaption, setImageCaption] = useState("");

  // Status Stories State
  const [viewingStoryContact, setViewingStoryContact] = useState(null); 
  const [storyIndex, setStoryIndex] = useState(0);
  const [storyProgress, setStoryProgress] = useState(0);
  const [readStories, setReadStories] = useState([]);

  // calling simulation states
  const [activeCall, setActiveCall] = useState(null); 
  const [callDuration, setCallDuration] = useState(0);
  const [callMuted, setCallMuted] = useState(false);
  const [callVideoOff, setCallVideoOff] = useState(false);
  const [callTranscription, setCallTranscription] = useState("");

  // Refs
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const menuRef = useRef(null);
  const inputRef = useRef();
  const fileInputRef = useRef(null);
  const prevMessagesLength = useRef({});
  const messageSound = useRef(new Audio(process.env.PUBLIC_URL + '/send.mp3'));
  
  // Call simulation refs
  const callAudioContext = useRef(null);
  const ringtoneIntervalRef = useRef(null);
  const callTimerIntervalRef = useRef(null);
  const storyProgressIntervalRef = useRef(null);
  const activeCallRef = useRef(null);

  useEffect(() => {
    activeCallRef.current = activeCall;
  }, [activeCall]);

  useEffect(() => {
    if (!showAttachmentPicker) {
      setAttachmentMenuMode("main");
    }
  }, [showAttachmentPicker]);

  useEffect(() => {
    let interval;
    if (isRecording) {
      setRecordingTime(0);
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = '20px'; // Set base height
      const scrollHeight = inputRef.current.scrollHeight;
      if (scrollHeight > 120) {
        inputRef.current.style.height = '120px';
        inputRef.current.style.overflowY = 'auto';
      } else {
        // Offset padding and border
        inputRef.current.style.height = `${scrollHeight - 4}px`;
        inputRef.current.style.overflowY = 'hidden';
      }
    }
  }, [inputText]);

  const formatRecordingTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins}:${remaining < 10 ? '0' : ''}${remaining}`;
  };

  // Emojis
  const emojiOptions = ['😀','😁','😂','🤣','😊','😍','😘','😜','🤔','😎','😢','😭','😡','👏','❤️','🎉','💪','🍲','✨','🔥'];
  const availableReacts = ['👍','❤️','😂','😮','😢','👏'];

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  /* ---------- WEB AUDIO API TONE GENERATION (No assets needed for calling tone!) ---------- */
  const startRingtone = () => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContextClass();
      callAudioContext.current = ctx;

      const playRingCycle = () => {
        if (!callAudioContext.current) return;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gainNode = ctx.createGain();

        // US standard Ringback tone frequencies: 440Hz + 480Hz
        osc1.frequency.value = 440;
        osc2.frequency.value = 480;

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc1.start();
        osc2.start();

        gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.8);

        setTimeout(() => {
          try {
            osc1.stop();
            osc2.stop();
          } catch(e){}
        }, 2000);
      };

      playRingCycle();
      ringtoneIntervalRef.current = setInterval(playRingCycle, 4000);
    } catch(e) {
      console.warn("Web Audio API not supported", e);
    }
  };

  const stopRingtone = () => {
    if (ringtoneIntervalRef.current) {
      clearInterval(ringtoneIntervalRef.current);
      ringtoneIntervalRef.current = null;
    }
    if (callAudioContext.current) {
      try {
        callAudioContext.current.close();
      } catch(e){}
      callAudioContext.current = null;
    }
  };

  /* ---------- Speech Synthesis (Text-to-Speech) for Call Mode ---------- */
  const speakText = (text, langCode = 'hi-IN') => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel(); 
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    let selectedVoice = null;
    
    if (langCode.startsWith('hi')) {
      selectedVoice = voices.find(v => v.lang.includes('IN') && (v.lang.startsWith('hi') || v.name.toLowerCase().includes('hindi')));
    }
    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('female'));
    }
    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.lang.startsWith('en'));
    }

    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.rate = 1.0;
    utterance.pitch = 1.15;
    window.speechSynthesis.speak(utterance);
  };

  /* ---------- CALL SIMULATION HANDLERS ---------- */
  const initiateCall = (type) => {
    const contact = contactsList.find(c => c.id === activeContactId);
    setActiveCall({ contactId: activeContactId, type, status: 'ringing', contact });
    setCallDuration(0);
    setCallTranscription("Ringing...");
    startRingtone();

    // Answer call simulation after 4 seconds
    setTimeout(() => {
      stopRingtone();
      setActiveCall(prev => {
        if (!prev) return null;
        return { ...prev, status: 'connected' };
      });
      setCallTranscription("Connected! Talk to me.");
      
      // Start call duration clock
      callTimerIntervalRef.current = setInterval(() => {
        setCallDuration(d => d + 1);
      }, 1000);

      // Trigger TTS greeting
      const contactGreeting = contact ? contact.statusText : "Hello!";
      speakText(contactGreeting, activeContactId === 'mom' ? 'hi-IN' : 'en-US');
      setCallTranscription(contactGreeting);
    }, 4000);
  };

  const endCall = () => {
    stopRingtone();
    if (callTimerIntervalRef.current) {
      clearInterval(callTimerIntervalRef.current);
      callTimerIntervalRef.current = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setActiveCall(null);
    setCallDuration(0);
    setCallTranscription("");
  };

  /* ---------- STORIES TABS PROGRESS ---------- */
  useEffect(() => {
    if (viewingStoryContact) {
      setStoryProgress(0);
      storyProgressIntervalRef.current = setInterval(() => {
        setStoryProgress(p => {
          if (p >= 100) {
            // Next story slide
            setStoryIndex(idx => {
              const totalSlides = viewingStoryContact.stories.length;
              if (idx + 1 < totalSlides) {
                return idx + 1;
              } else {
                // finished all slides, close
                setViewingStoryContact(null);
                return 0;
              }
            });
            return 0;
          }
          return p + 2; 
        });
      }, 100); 
    } else {
      if (storyProgressIntervalRef.current) {
        clearInterval(storyProgressIntervalRef.current);
      }
      setStoryIndex(0);
      setStoryProgress(0);
    }
    return () => {
      if (storyProgressIntervalRef.current) clearInterval(storyProgressIntervalRef.current);
    };
  }, [viewingStoryContact, storyIndex]);

  const openStoriesFor = (contact) => {
    if (!contact.stories || contact.stories.length === 0) return;
    setStoryIndex(0);
    setViewingStoryContact(contact);
    if (!readStories.includes(contact.id)) {
      setReadStories(prev => [...prev, contact.id]);
    }
  };

  /* ---------- SOCKET SETUP ---------- */
  useEffect(() => {
    const socket = io(BACKEND_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on("initialHistory", (histories) => {
      setChatHistories(histories || {});
    });

    const similarMessageMatch = (localMsg, incoming) => {
      if (!localMsg || !incoming) return false;
      if (incoming.clientTempId && localMsg.id === incoming.clientTempId) return true;
      if (localMsg.id && incoming.id && String(localMsg.id) === String(incoming.id)) return true;
      try {
        const localTs = new Date(localMsg.timestamp).getTime();
        const incTs = new Date(incoming.timestamp).getTime();
        if (localMsg.sender === incoming.sender && localMsg.text === incoming.text && Math.abs(localTs - incTs) <= 5000) return true;
      } catch (e) {}
      return false;
    };

    socket.on("newMessage", ({ activeContact, message }) => {
      // clear typing status
      setTypingStates(prev => ({ ...prev, [activeContact]: false }));

      setChatHistories(prev => {
        const history = prev[activeContact] || [];
        if (message.id && history.some(m => String(m.id) === String(message.id))) return prev;

        const tempIndex = history.findIndex(m => String(m.id).startsWith('temp-') && similarMessageMatch(m, message));
        let nextHistory = [...history];
        if (tempIndex !== -1) {
          nextHistory[tempIndex] = { ...message };
        } else {
          nextHistory.push(message);
        }

        // If an active call is connected to this specific sender, trigger speech synthesis!
        if (activeCallRef.current && activeCallRef.current.contactId === activeContact && activeCallRef.current.status === 'connected') {
          if (message.sender !== 'Akash') {
            setCallTranscription(message.text);
            speakText(message.text, activeContact === 'mom' ? 'hi-IN' : 'en-US');
          }
        }

        return { ...prev, [activeContact]: nextHistory };
      });
    });

    socket.on("aiTyping", ({ activeContact, isTyping }) => {
      setTypingStates(prev => ({ ...prev, [activeContact]: isTyping }));
      
      // Update read status for user messages once the contact starts typing/replies
      if (isTyping) {
        setChatHistories(prev => {
          const history = prev[activeContact] || [];
          const updated = history.map(m => (m.sender === 'Akash' && m.status !== 'read') ? { ...m, status: 'read' } : m);
          return { ...prev, [activeContact]: updated };
        });
      } else {
        setLastSeenTimes(prev => ({
          ...prev,
          [activeContact]: `last seen at ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}`
        }));
      }
    });

    socket.on("reactMessage", ({ messageId, counts }) => {
      setReactionsMap(prev => ({ ...prev, [messageId]: { counts } }));
    });

    socket.on("deleteMessage", ({ messageId, deletedText }) => {
      setChatHistories(prev => {
        const next = { ...prev };
        for (const contactId in next) {
          next[contactId] = next[contactId].map(m => m.id === messageId ? { ...m, deleted: true, text: deletedText } : m);
        }
        return next;
      });
    });

    // Click outside dropdown handler
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      socket.off();
      socket.disconnect();
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  /* ---------- OPTIMISTIC TICK SIMULATOR (sent -> delivered) ---------- */
  const simulateReceipts = (contactId, tempId) => {
    // Transition to Sent (single tick) after 150ms
    setTimeout(() => {
      setChatHistories(prev => {
        const history = prev[contactId] || [];
        return {
          ...prev,
          [contactId]: history.map(m => m.id === tempId ? { ...m, status: 'sent' } : m)
        };
      });
    }, 150);

    // Transition to Delivered (double tick) after 800ms
    setTimeout(() => {
      setChatHistories(prev => {
        const history = prev[contactId] || [];
        return {
          ...prev,
          [contactId]: history.map(m => (m.id === tempId && m.status === 'sent') ? { ...m, status: 'delivered' } : m)
        };
      });
      
      // Play send audio only when delivered
      messageSound.current.currentTime = 0;
      messageSound.current.play().catch(() => {});
    }, 800);
  };

  /* ---------- SEND MESSAGE HANDLER ---------- */
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (inputText.trim() === "") {
      inputRef.current?.focus();
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const userMessage = {
      id: tempId,
      sender: "Akash",
      text: inputText,
      timestamp: new Date().toISOString(),
      replyTo: replyTo ? { id: replyTo.id, sender: replyTo.sender, text: replyTo.text } : null,
      status: 'sending',
      clientTempId: tempId
    };

    // Add locally to the active contact's history
    setChatHistories(prev => {
      const history = prev[activeContactId] || [];
      return { ...prev, [activeContactId]: [...history, userMessage] };
    });

    // Send payload containing text and contact ID to Gemini routing backend
    socketRef.current?.emit("sendMessage", {
      text: inputText,
      contactId: activeContactId,
      clientTempId: tempId,
      replyTo
    });

    simulateReceipts(activeContactId, tempId);

    setInputText("");
    setReplyTo(null);
    setShowEmojiPicker(false);
    
    // Retain focus on message submit
    setTimeout(() => {
      inputRef.current?.focus();
    }, 10);
  };

  const handleSendVoiceMessage = () => {
    if (recordingTime < 1) {
      setIsRecording(false);
      return;
    }
    const tempId = `temp-voice-${Date.now()}`;
    const userMessage = {
      id: tempId,
      sender: "Akash",
      text: "🎤 Voice message",
      type: "voice",
      duration: formatRecordingTime(recordingTime),
      timestamp: new Date().toISOString(),
      replyTo: null,
      status: 'sending',
      clientTempId: tempId
    };

    setChatHistories(prev => {
      const history = prev[activeContactId] || [];
      return { ...prev, [activeContactId]: [...history, userMessage] };
    });

    socketRef.current?.emit("sendMessage", {
      text: "🎤 Sent a voice message (" + formatRecordingTime(recordingTime) + ")",
      contactId: activeContactId,
      clientTempId: tempId,
      replyTo: null
    });

    simulateReceipts(activeContactId, tempId);
    setIsRecording(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImagePreview({ file, url });
      setImageCaption("");
      setShowAttachmentPicker(false);
    }
  };

  const handleSendImageMessage = (e) => {
    e.preventDefault();
    if (!imagePreview) return;

    const tempId = `temp-img-${Date.now()}`;
    const userMessage = {
      id: tempId,
      sender: "Akash",
      text: imageCaption || "Sent an image",
      type: "image",
      mediaUrl: imagePreview.url,
      timestamp: new Date().toISOString(),
      replyTo: null,
      status: 'sending',
      clientTempId: tempId
    };

    setChatHistories(prev => {
      const history = prev[activeContactId] || [];
      return { ...prev, [activeContactId]: [...history, userMessage] };
    });

    socketRef.current?.emit("sendMessage", {
      text: imageCaption ? `🖼️ Sent an image with caption: ${imageCaption}` : "🖼️ Sent an image",
      contactId: activeContactId,
      clientTempId: tempId,
      replyTo: null
    });

    simulateReceipts(activeContactId, tempId);

    setImagePreview(null);
    setImageCaption("");
  };

  const handlePlayVoice = (msgId) => {
    setVoicePlayingId(prev => prev === msgId ? null : msgId);
  };

  /* ---------- CORE REACTIONS / DELETIONS ---------- */
  const toggleReactionPicker = (messageId) => setReactionPickerFor(prev => prev === messageId ? null : messageId);

  const handleReact = (messageId, emoji) => {
    setReactionsMap(prev => {
      const cur = prev[messageId] || { counts: {} };
      const counts = { ...cur.counts };
      counts[emoji] = (counts[emoji] || 0) + 1;
      return { ...prev, [messageId]: { counts } };
    });
    socketRef.current?.emit('reactMessage', { messageId, emoji });
    setReactionPickerFor(null);
  };

  const handleDeleteMessage = (messageId) => {
    if (!window.confirm('Delete this message for everyone?')) return;
    setChatHistories(prev => {
      const history = prev[activeContactId] || [];
      return {
        ...prev,
        [activeContactId]: history.map(m => m.id === messageId ? { ...m, deleted: true, text: 'This message was deleted' } : m)
      };
    });
    socketRef.current?.emit('deleteMessage', { messageId });
  };

  /* ---------- HELPERS ---------- */
  const activeContact = contactsList.find(c => c.id === activeContactId) || contactsList[0];
  const messages = chatHistories[activeContactId] || EMPTY_ARRAY;
  const isAiTyping = typingStates[activeContactId] || false;

  useEffect(scrollToBottom, [messages, isAiTyping]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 900);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isMobile && activeContactId) {
      inputRef.current?.focus();
    }
  }, [activeContactId, isMobile]);

  const formatTimestamp = (isoString) => {
    if (!isoString) return "";
    return new Date(isoString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  };

  const isNewDay = (prevMsg, currentMsg) => {
    if (!prevMsg) return true;
    const prevDate = new Date(prevMsg.timestamp).toDateString();
    const currentDate = new Date(currentMsg.timestamp).toDateString();
    return prevDate !== currentDate;
  };

  const formatDateSeparator = (isoString) => {
    const date = new Date(isoString);
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    if (date.toDateString() === today) return "Today";
    if (date.toDateString() === yesterday) return "Yesterday";
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  };

  const formatCallTimer = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const handleFunctionalityAlert = (feature) => {
    alert(`${feature} feature is simulated. Build triggers are fully operational.`);
    setShowMenu(false);
    setShowAttachmentPicker(false);
  };

  // Render Checkmark Ticks (Sent ➔ Delivered ➔ Read) without duplicate icons
  const renderReadReceiptTicks = (status) => {
    if (status === 'sending') return <span className="tick-sending">…</span>;
    if (status === 'sent') return <MdDone className="tick-grey" />;
    if (status === 'delivered') return <MdDoneAll className="tick-grey" />;
    if (status === 'read') return <MdDoneAll className="tick-blue" />;
    return null;
  };

  return (
    <div className={`main-layout${darkMode ? ' dark' : ''}`}>
      
      {/* ----------------- SIDEBAR ----------------- */}
      <aside className={`sidebar${sidebarOpen ? " open" : ""}`}>
        
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <img 
            src={process.env.PUBLIC_URL + '/akash-avatar.png'} 
            alt="Akash User" 
            className="sidebar-user-pic clickable" 
            onClick={() => setProfileDrawer(true)} 
          />
          <div className="sidebar-header-icons">
            {isMobile && sidebarOpen && (
              <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar">&times;</button>
            )}
            <span onClick={() => setDarkMode((d) => !d)} className="sidebar-header-icon dark-toggle" title="Toggle dark mode">
              {darkMode ? <IoSunny /> : <IoMoon />}
            </span>
            <MdDonutLarge className="sidebar-header-icon" onClick={() => handleFunctionalityAlert("Status Updates")} title="Status Updates" />
            <MdChat className="sidebar-header-icon" onClick={() => handleFunctionalityAlert("New Chat")} title="New Chat" />
            <MdMoreVert className="sidebar-header-icon" onClick={() => handleFunctionalityAlert("Settings Menu")} />
          </div>
        </div>

        {/* Dynamic Status/Stories Tray (Premium WhatsApp Feature) */}
        <div className="status-stories-tray">
          <div className="status-story-wrapper self">
            <div className="story-ring empty">
              <img src={process.env.PUBLIC_URL + '/akash-avatar.png'} alt="My Status" />
              <span className="story-add-badge">+</span>
            </div>
            <span className="story-owner">My Status</span>
          </div>

          {contactsList.filter(c => c.stories && c.stories.length > 0).map(contact => {
            const hasBeenRead = readStories.includes(contact.id);
            return (
              <div key={contact.id} className="status-story-wrapper" onClick={() => openStoriesFor(contact)}>
                <div className={`story-ring ${hasBeenRead ? 'read' : 'unread'}`}>
                  <img src={contact.avatar} alt={contact.name} />
                </div>
                <span className="story-owner">{contact.name.split(' ')[0]}</span>
              </div>
            );
          })}
        </div>

        {/* Sidebar Search Bar */}
        <div className="sidebar-search-bar">
          <input
            type="text"
            className="sidebar-search-input"
            placeholder="Search or start new chat"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Chat List (Multiple Contacts) */}
        <ul className="chat-list">
          {contactsList.filter(chat => 
            chat.name.toLowerCase().includes(search.toLowerCase()) || 
            chat.statusText.toLowerCase().includes(search.toLowerCase())
          ).map((chat) => {
            const lastMsgObject = chatHistories[chat.id]?.[chatHistories[chat.id].length - 1];
            const displayLastMsg = lastMsgObject ? lastMsgObject.text : chat.statusText;
            const displayTime = lastMsgObject ? formatTimestamp(lastMsgObject.timestamp) : "12:00";

            return (
              <li 
                className={`chat-list-item${activeContactId === chat.id ? ' active' : ''}`} 
                key={chat.id} 
                onClick={() => {
                  setActiveContactId(chat.id);
                  if (isMobile) setSidebarOpen(false);
                }}
              >
                <img src={chat.avatar} alt={chat.name} className="sidebar-profile-pic" />
                <div className="chat-list-content">
                  <div className="chat-list-row">
                    <span className="chat-list-name">{chat.name}</span>
                    <span className="chat-list-time">{displayTime}</span>
                  </div>
                  <div className="chat-list-row">
                    <span className="chat-list-last">{displayLastMsg.length > 36 ? displayLastMsg.slice(0, 36) + '…' : displayLastMsg}</span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {/* Profile Details Drawer */}
        {profileDrawer && (
          <div className="profile-drawer" onClick={() => setProfileDrawer(false)}>
            <div className="profile-drawer-content" onClick={e => e.stopPropagation()}>
              <div className="profile-drawer-cover">
                <img src={process.env.PUBLIC_URL + '/akash-avatar.png'} alt="User Profile" className="profile-drawer-pic" />
              </div>
              <div className="profile-drawer-main">
                <h2 className="profile-drawer-name">Akash Saraswat</h2>
                <p className="profile-drawer-about">Web Developer | Coding at Antigravity 🚀</p>
                <div className="profile-drawer-qr">
                  <img src="https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=AkashSaraswat" alt="My QR Code" />
                </div>
              </div>
              <button className="profile-drawer-close" onClick={() => setProfileDrawer(false)}>&times;</button>
            </div>
          </div>
        )}
      </aside>

      {/* ----------------- CHAT BOX ----------------- */}
      <div className="whatsapp-container">
        
        {/* Chat Header */}
        <header className="chat-header">
          {isMobile && (
            <IoArrowBack className="header-icon back-arrow-btn" onClick={() => setSidebarOpen(true)} style={{ marginRight: '12px', fontSize: '1.4rem', cursor: 'pointer' }} />
          )}
          
          <div className="profile-link" onClick={() => setShowContactInfo(!showContactInfo)}>
            <img src={activeContact.avatar} alt="Profile" className="profile-pic profile-pic-animate" />
            <div className="contact-info">
              <div className="contact-name">{activeContact.name}</div>
              <div className="contact-status">{isAiTyping ? "typing..." : (typingStates[activeContact.id] ? "typing..." : lastSeenTimes[activeContact.id])}</div>
            </div>
          </div>

          <div className="header-icons-right">
            <IoVideocam className="header-icon" onClick={() => initiateCall('video')} title="Video Call" />
            <IoCall className="header-icon" onClick={() => initiateCall('voice')} title="Voice Call" />
            <div className="menu-container" ref={menuRef}>
              <BsThreeDotsVertical className="header-icon" onClick={() => setShowMenu(!showMenu)} />
              {showMenu && (
                <ul className="dropdown-menu">
                  <li className="dropdown-item" onClick={() => { setShowContactInfo(true); setShowMenu(false); }}>View contact info</li>
                  <li className="dropdown-item" onClick={() => { setShowContactInfo(true); setShowMenu(false); }}>Media, links, and docs</li>
                  <li className="dropdown-item" onClick={() => handleFunctionalityAlert("Mute Notifications")}>Mute notifications</li>
                  <li className="dropdown-item" onClick={() => handleFunctionalityAlert("Disappearing messages")}>Disappearing messages</li>
                  <li className="dropdown-item" onClick={() => { setShowAttachmentPicker(true); setAttachmentMenuMode("wallpaper"); setShowMenu(false); }}>Wallpaper Settings</li>
                </ul>
              )}
            </div>
          </div>
        </header>

        {/* Chat Screen Frame with Dynamic Wallpapers */}
        <main className={`chat-body wallpaper-${wallpaper}`}>
          {messages.map((msg, index) => (
            <React.Fragment key={msg.id || index}>
              {isNewDay(messages[index - 1], msg) && (
                <div className="date-separator">
                  <span>{formatDateSeparator(msg.timestamp)}</span>
                </div>
              )}

              <div className={`message-row ${msg.sender === "Akash" ? "right" : "left"}`}>
                <div className={`message-bubble ${msg.sender === "Akash" ? "akash" : "nehanshi"}`}>

                  {/* Message Reply Preview */}
                  {msg.replyTo && (
                    <div className="bubble-reply">
                      <div className="bubble-reply-sender">{msg.replyTo.sender}</div>
                      <div className="bubble-reply-text">{msg.replyTo.text.length > 100 ? msg.replyTo.text.slice(0, 100) + '…' : msg.replyTo.text}</div>
                    </div>
                  )}

                  {/* Main Bubble Content */}
                  {msg.deleted ? (
                    <p className="message-deleted">{msg.text || 'This message was deleted'}</p>
                  ) : msg.type === 'voice' ? (
                    <div className="voice-message-player">
                      <button type="button" className="voice-play-btn" onClick={() => handlePlayVoice(msg.id)}>
                        {voicePlayingId === msg.id ? <FaPause /> : <FaPlay />}
                      </button>
                      <div className="voice-wave-progress">
                        <svg viewBox="0 0 100 20" className="voice-wave-svg">
                          <rect x="0" y="8" width="2" height="4" rx="1" fill={msg.sender === "Akash" ? "#00a884" : "#8696a0"} />
                          <rect x="4" y="5" width="2" height="10" rx="1" fill={msg.sender === "Akash" ? "#00a884" : "#8696a0"} />
                          <rect x="8" y="2" width="2" height="16" rx="1" fill={msg.sender === "Akash" ? "#00a884" : "#8696a0"} />
                          <rect x="12" y="6" width="2" height="8" rx="1" fill={msg.sender === "Akash" ? "#00a884" : "#8696a0"} />
                          <rect x="16" y="4" width="2" height="12" rx="1" fill={msg.sender === "Akash" ? "#00a884" : "#8696a0"} />
                          <rect x="20" y="8" width="2" height="4" rx="1" fill={msg.sender === "Akash" ? "#00a884" : "#8696a0"} />
                          <rect x="24" y="3" width="2" height="14" rx="1" fill={msg.sender === "Akash" ? "#00a884" : "#8696a0"} />
                          <rect x="28" y="6" width="2" height="8" rx="1" fill={msg.sender === "Akash" ? "#00a884" : "#8696a0"} />
                          <rect x="32" y="2" width="2" height="16" rx="1" fill={msg.sender === "Akash" ? "#00a884" : "#8696a0"} />
                          <rect x="36" y="7" width="2" height="6" rx="1" fill={msg.sender === "Akash" ? "#00a884" : "#8696a0"} />
                          <rect x="40" y="4" width="2" height="12" rx="1" fill={msg.sender === "Akash" ? "#00a884" : "#8696a0"} />
                          <rect x="44" y="8" width="2" height="4" rx="1" fill={msg.sender === "Akash" ? "#00a884" : "#8696a0"} />
                          <rect x="48" y="5" width="2" height="10" rx="1" fill={msg.sender === "Akash" ? "#00a884" : "#8696a0"} />
                          <rect x="52" y="2" width="2" height="16" rx="1" fill={msg.sender === "Akash" ? "#00a884" : "#8696a0"} />
                          <rect x="56" y="6" width="2" height="8" rx="1" fill={msg.sender === "Akash" ? "#00a884" : "#8696a0"} />
                          <rect x="60" y="3" width="2" height="14" rx="1" fill={msg.sender === "Akash" ? "#00a884" : "#8696a0"} />
                          <rect x="64" y="8" width="2" height="4" rx="1" fill={msg.sender === "Akash" ? "#00a884" : "#8696a0"} />
                          <rect x="68" y="5" width="2" height="10" rx="1" fill={msg.sender === "Akash" ? "#00a884" : "#8696a0"} />
                          <rect x="72" y="2" width="2" height="16" rx="1" fill={msg.sender === "Akash" ? "#00a884" : "#8696a0"} />
                          <rect x="76" y="6" width="2" height="8" rx="1" fill={msg.sender === "Akash" ? "#00a884" : "#8696a0"} />
                          <rect x="80" y="4" width="2" height="12" rx="1" fill={msg.sender === "Akash" ? "#00a884" : "#8696a0"} />
                          <rect x="84" y="7" width="2" height="6" rx="1" fill={msg.sender === "Akash" ? "#00a884" : "#8696a0"} />
                          <rect x="88" y="3" width="2" height="14" rx="1" fill={msg.sender === "Akash" ? "#00a884" : "#8696a0"} />
                          <rect x="92" y="8" width="2" height="4" rx="1" fill={msg.sender === "Akash" ? "#00a884" : "#8696a0"} />
                        </svg>
                        <div className="voice-meta-row">
                          <span className="voice-duration">{msg.duration || '0:05'}</span>
                        </div>
                      </div>
                      <div className="voice-avatar-wrap">
                        <img 
                          src={msg.sender === "Akash" ? "https://cdn-icons-png.flaticon.com/512/149/149071.png" : activeContact.avatar} 
                          alt="avatar" 
                          className="voice-avatar" 
                        />
                        <span className="voice-mic-badge"><BsFillMicFill /></span>
                      </div>
                    </div>
                  ) : msg.type === 'image' || msg.mediaUrl ? (
                    <div className="bubble-image-message">
                      <img src={msg.mediaUrl} alt="chat media" className="message-bubble-image" />
                      {msg.text && msg.text !== "Sent an image" && <p className="message-text caption">{msg.text}</p>}
                    </div>
                  ) : (
                    <p className="message-text">{msg.text}</p>
                  )}

                  {/* Reaction Badges */}
                  {reactionsMap[msg.id] && (
                    <div className="bubble-reactions">
                      {Object.entries(reactionsMap[msg.id].counts || {}).map(([emoji, count]) => (
                        <div key={emoji} className="reaction-pill" onClick={() => handleReact(msg.id, emoji)}>{emoji} {count}</div>
                      ))}
                    </div>
                  )}

                  {/* Metadata & Receipt Checks */}
                  <div className="message-meta">
                    <span className="timestamp">{formatTimestamp(msg.timestamp)}</span>
                    {msg.sender === "Akash" && (
                      <span className="read-receipt-wrap">
                        {renderReadReceiptTicks(msg.status)}
                      </span>
                    )}
                  </div>

                  {/* Message Action triggers on Hover */}
                  <div className="bubble-actions" role="group" aria-label="Message options">
                    <button className="action-btn" onClick={() => setReplyTo({ id: msg.id, sender: msg.sender, text: msg.text })} title="Reply">↩</button>
                    <button className="action-btn" onClick={() => toggleReactionPicker(msg.id)} title="React">😊</button>
                    <button className="action-btn" onClick={() => handleDeleteMessage(msg.id)} title="Delete">🗑</button>
                  </div>

                  {/* Reaction Selector Drawer */}
                  {reactionPickerFor === msg.id && (
                    <div className="reaction-inline-picker">
                      {availableReacts.map(r => <button key={r} className="react-btn" onClick={() => handleReact(msg.id, r)}>{r}</button>)}
                    </div>
                  )}
                </div>
              </div>
            </React.Fragment>
          ))}

          {/* Typing Indicator with Bouncing Dots */}
          {isAiTyping && (
            <div className="message-row left">
              <div className="message-bubble nehanshi typing-bubble">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </main>

        <footer className="chat-footer">
          <form onSubmit={handleSendMessage} className="message-form">

            {/* Reply Preview Card */}
            {replyTo && (
              <div className={`reply-preview${darkMode ? ' dark' : ''}`}>
                <div className="reply-meta">
                  Replying to <strong>{replyTo.sender}</strong>
                  <button className="reply-cancel" type="button" onClick={() => setReplyTo(null)}>✕</button>
                </div>
                <div className="reply-text">{replyTo.text}</div>
              </div>
            )}

            {/* Image Preview Overlay Card */}
            {imagePreview && (
              <div className={`image-upload-preview${darkMode ? ' dark' : ''}`}>
                <div className="preview-header">
                  <span>Preview Image</span>
                  <button type="button" className="close-preview-btn" onClick={() => setImagePreview(null)}>✕</button>
                </div>
                <div className="preview-body">
                  <div className="preview-thumbnail-container">
                    <img src={imagePreview.url} alt="upload preview" className="preview-img-thumbnail" />
                  </div>
                  <input 
                    type="text" 
                    className="caption-input" 
                    placeholder="Add a caption..." 
                    value={imageCaption} 
                    onChange={(e) => setImageCaption(e.target.value)} 
                    autoFocus
                  />
                  <button type="button" className="send-image-btn" onClick={handleSendImageMessage}>
                    <IoSend />
                  </button>
                </div>
              </div>
            )}

            {isRecording ? (
              <div className="recording-container">
                <div className="recording-status">
                  <span className="recording-dot"></span>
                  <span className="recording-timer">{formatRecordingTime(recordingTime)}</span>
                  <div className="recording-wave">
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
                <div className="recording-cancel-slide">
                  Slide to cancel
                </div>
                <div className="recording-actions">
                  <button type="button" className="recording-btn cancel" onClick={() => setIsRecording(false)}>
                    <FaTrash />
                  </button>
                  <button type="button" className="recording-btn send" onClick={handleSendVoiceMessage}>
                    <IoSend />
                  </button>
                </div>
              </div>
            ) : (
              <div className="whatsapp-input-capsule">
                {/* Plus Trigger Button */}
                <div className="icon-wrapper">
                  <button 
                    type="button" 
                    className="footer-action-btn attach-btn-trigger" 
                    onClick={() => setShowAttachmentPicker(v => !v)}
                    title="Attachments"
                  >
                    <FaPlus className="footer-icon plus-icon" />
                  </button>
                  {showAttachmentPicker && (
                    <div className={`attachment-picker-whatsapp${darkMode ? ' dark' : ''}`}>
                      {attachmentMenuMode === "main" ? (
                        <>
                          <button 
                            type="button" 
                            className="attachment-btn document" 
                            onClick={() => { setShowAttachmentPicker(false); handleFunctionalityAlert("Send Files"); }} 
                            title="Document"
                          >
                            <FaFileAlt />
                          </button>
                          <button 
                            type="button" 
                            className="attachment-btn camera" 
                            onClick={() => { setShowAttachmentPicker(false); handleFunctionalityAlert("Open Camera"); }} 
                            title="Camera"
                          >
                            <FaCamera />
                          </button>
                          <button 
                            type="button" 
                            className="attachment-btn gallery" 
                            onClick={() => fileInputRef.current.click()} 
                            title="Photos & Videos"
                          >
                            <FaFileImage />
                          </button>
                          <button 
                            type="button" 
                            className="attachment-btn wallpaper" 
                            onClick={() => setAttachmentMenuMode("wallpaper")} 
                            title="Wallpaper"
                          >
                            <FaPalette />
                          </button>
                        </>
                      ) : (
                        <div className="attachment-wallpaper-submenu">
                          <button 
                            type="button" 
                            className="attachment-submenu-back" 
                            onClick={() => setAttachmentMenuMode("main")}
                          >
                            ← Back
                          </button>
                          <div className="wallpaper-menu-options">
                            <div className="wallpaper-menu-option pattern" onClick={() => { setWallpaper('pattern'); setShowAttachmentPicker(false); }}>
                              Pattern
                            </div>
                            <div className="wallpaper-menu-option solid" onClick={() => { setWallpaper('solid'); setShowAttachmentPicker(false); }}>
                              Solid
                            </div>
                            <div className="wallpaper-menu-option gradient" onClick={() => { setWallpaper('gradient'); setShowAttachmentPicker(false); }}>
                              Gradient
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Emoji Smile Trigger Button */}
                <div className="icon-wrapper">
                  <button 
                    type="button" 
                    className="footer-action-btn" 
                    onClick={() => setShowEmojiPicker(v => !v)}
                    title="Emojis"
                  >
                    <BsEmojiSmile className="footer-icon emoji-icon" />
                  </button>
                  {showEmojiPicker && (
                    <div className={`emoji-picker${darkMode ? ' dark' : ''}`}>
                      {emojiOptions.map((e, i) => (
                        <span key={i} className="emoji-picker-emoji" onClick={() => {
                          const el = inputRef.current;
                          const start = el.selectionStart ?? inputText.length;
                          const end = el.selectionEnd ?? inputText.length;
                          setInputText(t => t.slice(0, start) + e + t.slice(end));
                          setShowEmojiPicker(false);
                          setTimeout(() => {
                            el.focus();
                            el.selectionStart = el.selectionEnd = (start + e.length);
                          }, 0);
                        }}>{e}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Textarea Input area */}
                <textarea
                  className="chat-input"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  placeholder="Type a message"
                  autoFocus
                  autoComplete="off"
                  ref={inputRef}
                  rows={1}
                />

                {/* Dynamic Mic to Send button transitions */}
                <button 
                  type="submit" 
                  className="footer-send-btn" 
                  onClick={(e) => { 
                    if (inputText.trim() === "") { 
                      e.preventDefault(); 
                      setIsRecording(true); 
                    } 
                  }}
                >
                  {inputText.trim() !== "" ? <IoSend className="send-icon active" /> : <BsMic className="send-icon mic-icon" />}
                </button>
              </div>
            )}
          </form>
          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            onChange={handleImageChange} 
            style={{ display: "none" }} 
          />
        </footer>
      </div>

      {/* Right sliding Contact Info panel */}
      {showContactInfo && (
        <aside className={`contact-info-panel${darkMode ? ' dark' : ''}`}>
          <div className="info-header">
            <button className="info-close-btn" onClick={() => setShowContactInfo(false)}>✕</button>
            <h3>Contact Info</h3>
          </div>
          <div className="info-body">
            <div className="info-avatar-section">
              <img src={activeContact.avatar} alt={activeContact.name} className="info-avatar" />
              <h2>{activeContact.name}</h2>
              <p className="info-lastseen">{typingStates[activeContactId] ? "typing..." : activeContact.lastSeen}</p>
            </div>
            <hr className="info-divider" />
            <div className="info-section">
              <h4>About</h4>
              <p className="info-text">{activeContact.description}</p>
            </div>
            <hr className="info-divider" />
            <div className="info-section">
              <h4>Media, links and docs</h4>
              <div className="info-media-grid">
                <div className="media-placeholder-item">🖼️</div>
                <div className="media-placeholder-item">📄</div>
                <div className="media-placeholder-item">🔗</div>
              </div>
            </div>
            <hr className="info-divider" />
            <div className="info-section actions-section">
              <button className="info-action-btn danger" onClick={() => handleFunctionalityAlert("Block Contact")}>Block {activeContact.name.split(' ')[0]}</button>
              <button className="info-action-btn danger" onClick={() => handleFunctionalityAlert("Report Contact")}>Report {activeContact.name.split(' ')[0]}</button>
            </div>
          </div>
        </aside>
      )}

      {/* ----------------- FULLSCREEN STORY VIEW MODAL ----------------- */}
      {viewingStoryContact && (
        <div className="story-viewer-modal" onClick={() => setViewingStoryContact(null)}>
          <div className="story-viewer-content" onClick={e => e.stopPropagation()}>
            
            {/* Story Header Progress segments */}
            <div className="story-progress-bar">
              {viewingStoryContact.stories.map((s, idx) => (
                <div key={idx} className="story-progress-segment-bg">
                  <div 
                    className="story-progress-segment-fill" 
                    style={{ 
                      width: idx < storyIndex ? '100%' : (idx === storyIndex ? `${storyProgress}%` : '0%') 
                    }} 
                  />
                </div>
              ))}
            </div>

            {/* Owner Details */}
            <div className="story-viewer-header">
              <img src={viewingStoryContact.avatar} alt={viewingStoryContact.name} />
              <div className="story-owner-info">
                <span className="story-owner-name">{viewingStoryContact.name}</span>
                <span className="story-owner-time">Recent Status</span>
              </div>
              <button className="story-close-btn" onClick={() => setViewingStoryContact(null)}>&times;</button>
            </div>

            {/* Slide Body */}
            <div className="story-viewer-body">
              <img 
                src={viewingStoryContact.stories[storyIndex].url} 
                alt="Story Media" 
                className="story-media-image" 
              />
              <p className="story-caption">{viewingStoryContact.stories[storyIndex].caption}</p>
            </div>

            {/* Click Navigation controllers */}
            <div className="story-nav-btn prev" onClick={() => setStoryIndex(i => Math.max(0, i - 1))}></div>
            <div className="story-nav-btn next" onClick={() => {
              setStoryIndex(i => {
                if (i + 1 < viewingStoryContact.stories.length) return i + 1;
                setViewingStoryContact(null); // Finished slides
                return 0;
              });
            }}></div>
          </div>
        </div>
      )}

      {/* ----------------- FULLSCREEN CALL OVERLAY MODAL ----------------- */}
      {activeCall && (
        <div className="call-overlay">
          <div className="call-card-container">
            <div className="call-card-blur-bg" style={{ backgroundImage: `url(${activeCall.contact.avatar})` }} />
            
            <div className="call-card-content">
              <div className="call-contact-details">
                <h1 className="call-contact-name">{activeCall.contact.name}</h1>
                <p className="call-status">
                  {activeCall.status === 'ringing' ? 'Ringing...' : `Connected | ${formatCallTimer(callDuration)}`}
                </p>
              </div>

              {/* Contact Avatar Circle with Wave animations */}
              <div className="call-avatar-outer">
                <div className={`call-avatar-pulse-ring ${activeCall.status === 'ringing' ? 'active' : ''}`} />
                <div className={`call-avatar-pulse-ring-2 ${activeCall.status === 'ringing' ? 'active' : ''}`} />
                <img src={activeCall.contact.avatar} alt="Calling Target" className="call-avatar-pic" />
              </div>

              {/* Call Transcription Speech Bubble */}
              {callTranscription && (
                <div className="call-transcription-bubble">
                  <p className="transcription-text">{callTranscription}</p>
                </div>
              )}

              {/* Action Buttons Panel */}
              <div className="call-actions-row">
                <button 
                  className={`call-action-btn ${callMuted ? 'active' : ''}`} 
                  onClick={() => setCallMuted(!callMuted)} 
                  title={callMuted ? "Unmute" : "Mute"}
                >
                  {callMuted ? <IoMicOff /> : <IoMic />}
                </button>

                <button className="call-action-btn end-call-btn animate-bounce-slow" onClick={endCall} title="Decline / Hang up">
                  <MdCallEnd />
                </button>

                <button 
                  className={`call-action-btn ${callVideoOff ? 'active' : ''}`} 
                  onClick={() => setCallVideoOff(!callVideoOff)} 
                  title={callVideoOff ? "Turn Video On" : "Turn Video Off"}
                >
                  {callVideoOff ? <IoVideocamOff /> : <IoVideocam />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ChatWindow;
