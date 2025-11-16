// src/components/ChatWindow.jsx
import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { Link } from "react-router-dom";
import "../ChatWindow.css";

import { IoArrowBack, IoCall, IoVideocam, IoMoon, IoSunny, IoSend } from "react-icons/io5";
import {
  BsThreeDotsVertical,
  BsEmojiSmile,
  BsPaperclip,
  BsFillMicFill,
} from "react-icons/bs";
import { MdDoneAll, MdDonutLarge, MdChat, MdMoreVert } from "react-icons/md";
import { FaBars, FaPalette, FaFileImage, FaFileAlt, FaCamera } from "react-icons/fa";

const nehanshiProfilePic = process.env.PUBLIC_URL + '/girl-avatar.png';
const BACKEND_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

const ChatWindow = () => {
  // core state
  const [messages, setMessages] = useState([]); // message objects { id, sender, text, timestamp, status, replyTo?, deleted? }
  const [inputText, setInputText] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [lastSeen, setLastSeen] = useState("online");
  const [showMenu, setShowMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [search, setSearch] = useState("");
  const [profileDrawer, setProfileDrawer] = useState(false);
  const [wallpaper, setWallpaper] = useState('pattern');
  const [showWallpaperPicker, setShowWallpaperPicker] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 900);
  const [selectedChat, setSelectedChat] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentPicker, setShowAttachmentPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  // new features state
  const [replyTo, setReplyTo] = useState(null); // { id, sender, text }
  const [reactionPickerFor, setReactionPickerFor] = useState(null); // message id
  const [reactionsMap, setReactionsMap] = useState({}); // { messageId: { counts: {emoji: num} } }

  // refs
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const menuRef = useRef(null);
  const messageSound = useRef(new Audio(process.env.PUBLIC_URL + '/send.mp3'));
  const prevMessagesRef = useRef([]);
  const inputRef = useRef();

  // emoji options (cleaned)
  const emojiOptions = ['😀','😁','😂','🤣','😊','😍','😘','😜','🤔','😎','😢','😭','😡','👏','❤️','🎉'];
  const availableReacts = ['👍','❤️','😂','😮','😢','👏'];

  // scroll
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  /* ---------- socket init & handlers (dedupe + replace temp messages) ---------- */
  useEffect(() => {
    const socket = io(BACKEND_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    // initial history
    socket.on("initialHistory", (history) => {
      setMessages(history || []);
    });

    // helper to match optimistic temp messages to server final message
    const similarMessageMatch = (localMsg, incoming) => {
      if (!localMsg || !incoming) return false;

      // 1) server provides clientTempId
      if (incoming.clientTempId && localMsg.id === incoming.clientTempId) return true;

      // 2) exact id match
      if (localMsg.id && incoming.id && String(localMsg.id) === String(incoming.id)) return true;

      // 3) fallback: match by sender + text + close timestamp (within 5s)
      try {
        const localTs = new Date(localMsg.timestamp).getTime();
        const incTs = new Date(incoming.timestamp).getTime();
        const timeDiff = Math.abs((localTs || 0) - (incTs || 0));
        if (localMsg.sender === incoming.sender && localMsg.text === incoming.text && timeDiff <= 5000) return true;
      } catch (e) {
        // ignore parse errors
      }

      return false;
    };

    // new message arrives
    socket.on("newMessage", (newMessage) => {
      setIsAiTyping(false);

      setMessages(prev => {
        // ignore exact duplicate by id
        if (newMessage.id && prev.some(m => String(m.id) === String(newMessage.id))) return prev;

        // if a temp message exists that matches the incoming final message, replace it
        const tempIndex = prev.findIndex(m => String(m.id).startsWith('temp-') && similarMessageMatch(m, newMessage));
        if (tempIndex !== -1) {
          const next = [...prev];
          next[tempIndex] = { ...newMessage };
          return next;
        }

        // otherwise append normally
        return [...prev, newMessage];
      });
    });

    // ai typing indicator
    socket.on("aiTyping", ({ isTyping }) => {
      setIsAiTyping(isTyping);
      if (!isTyping) {
        setLastSeen(
          `last seen at ${new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })}`
        );
      }
    });

    // reaction update from server
    socket.on("reactMessage", ({ messageId, counts }) => {
      setReactionsMap(prev => ({ ...prev, [messageId]: { counts } }));
    });

    // delete-message broadcast
    socket.on("deleteMessage", ({ messageId, deletedText = 'This message was deleted' }) => {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, deleted: true, text: deletedText } : m));
    });

    // message status updates (sent/delivered/read)
    socket.on("messageStatus", ({ messageId, status }) => {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, status } : m));
    });

    // server ack: replace temp id with final message if server emits messageAck
    socket.on("messageAck", ({ clientTempId, finalMessage }) => {
      if (clientTempId && finalMessage) {
        setMessages(prev => prev.map(m => String(m.id) === String(clientTempId) ? finalMessage : m));
      }
    });

    // click outside menu to close
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
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

  /* ---------- scroll and sound ---------- */
  useEffect(scrollToBottom, [messages, isAiTyping]);

  useEffect(() => {
    if (prevMessagesRef.current.length && messages.length > prevMessagesRef.current.length) {
      messageSound.current.currentTime = 0;
      messageSound.current.play().catch(() => {/* autoplay prevented */});
    }
    prevMessagesRef.current = messages;
  }, [messages]);

  /* ---------- responsive ---------- */
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 900);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /* ---------- helpers ---------- */
  const formatTimestamp = (isoString) => {
    if (!isoString) return "";
    return new Date(isoString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
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
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const handleFunctionalityAlert = (feature) => {
    alert(`${feature} feature is coming soon!`);
    setShowMenu(false);
  };

  /* ---------- sending messages (optimistic) ---------- */
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (inputText.trim() === "") return;

    const tempId = `temp-${Date.now()}`;
    const userMessage = {
      id: tempId,
      sender: "Akash",
      text: inputText,
      timestamp: new Date().toISOString(),
      replyTo: replyTo ? { id: replyTo.id, sender: replyTo.sender, text: replyTo.text } : null,
      status: 'sending',
      clientTempId: tempId // include so server can echo back if you use it
    };

    // optimistic UI
    setMessages(prev => [...prev, userMessage]);

    // emit to server; include callback ack possibility
    socketRef.current?.emit("sendMessage", userMessage, (ack) => {
      // optional ack callback - server can return final id and status
      if (ack && ack.id) {
        setMessages(prev => prev.map(m => String(m.id) === String(tempId) ? { ...m, id: ack.id, status: ack.status || 'sent' } : m));
      }
    });

    setInputText("");
    setReplyTo(null);
  };

  /* ---------- reactions ---------- */
  const toggleReactionPicker = (messageId) => setReactionPickerFor(prev => prev === messageId ? null : messageId);

  const handleReact = (messageId, emoji) => {
    // optimistic update local counts
    setReactionsMap(prev => {
      const cur = prev[messageId] || { counts: {} };
      const counts = { ...cur.counts };
      counts[emoji] = (counts[emoji] || 0) + 1;
      return { ...prev, [messageId]: { counts } };
    });

    socketRef.current?.emit('reactMessage', { messageId, emoji, user: 'Akash' });
    setReactionPickerFor(null);
  };

  /* ---------- delete message ---------- */
  const handleDeleteMessage = (messageId) => {
    const confirmDelete = window.confirm('Delete this message for everyone?');
    if (!confirmDelete) return;
    // optimistic
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, deleted: true, text: 'This message was deleted' } : m));
    socketRef.current?.emit('deleteMessage', { messageId, forEveryone: true });
  };

  /* ---------- UI small helpers ---------- */
  const renderStatusIcon = (status) => {
    if (!status) return null;
    if (status === 'read') return <span title="Read">✔✔</span>;
    if (status === 'delivered') return <span title="Delivered">✔✔</span>;
    if (status === 'sent') return <span title="Sent">✔</span>;
    if (status === 'sending') return <span title="Sending">…</span>;
    return null;
  };

  /* ---------- JSX ---------- */
  return (
    <div className={`main-layout${darkMode ? ' dark' : ''}`}>
      <aside className={`sidebar${sidebarOpen ? " open" : ""}${isMobile && selectedChat ? ' hide' : ''}`}>
        <div className="sidebar-header">
          <img src={process.env.PUBLIC_URL + '/user-girl-avatar.png'} alt="User" className="sidebar-user-pic clickable" onClick={() => setProfileDrawer(true)} />
          <div className="sidebar-header-icons">
            {isMobile && sidebarOpen && (
              <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar">&times;</button>
            )}
            <span onClick={() => setDarkMode((d) => !d)} className="sidebar-header-icon dark-toggle" title="Toggle dark mode">
              {darkMode ? <IoSunny /> : <IoMoon />}
            </span>
            <MdDonutLarge className="sidebar-header-icon" />
            <MdChat className="sidebar-header-icon" />
            <MdMoreVert className="sidebar-header-icon" />
          </div>
        </div>

        <div className="sidebar-search-bar">
          <input
            type="text"
            className="sidebar-search-input"
            placeholder="Search or start new chat"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <ul className="chat-list">
          {[1,2,3,4].map((i) => ({
            name: "Nehanshi Sharma",
            last: "Hey Akash! 😊",
            time: `09:3${i}`,
            unread: i === 1 ? 2 : 0
          })).filter(chat => chat.name.toLowerCase().includes(search.toLowerCase()) || chat.last.toLowerCase().includes(search.toLowerCase())).map((chat, idx) => (
            <li className={`chat-list-item${chat.unread ? ' highlight' : ''}${selectedChat===idx?' active':''}`} key={idx} onClick={() => {
              setSelectedChat(idx);
              if(isMobile) setSidebarOpen(false);
            }}>
              <img src={process.env.PUBLIC_URL + '/girl-avatar.png'} alt={chat.name} className="sidebar-profile-pic" />
              <div className="chat-list-content">
                <div className="chat-list-row">
                  <span className="chat-list-name">{chat.name}</span>
                  <span className="chat-list-time">{chat.time}</span>
                </div>
                <div className="chat-list-row">
                  <span className="chat-list-last">{chat.last}</span>
                  {chat.unread ? <span className="chat-list-unread">{chat.unread}</span> : null}
                </div>
              </div>
            </li>
          ))}
        </ul>

        {profileDrawer && (
          <div className="profile-drawer" onClick={() => setProfileDrawer(false)}>
            <div className="profile-drawer-content" onClick={e => e.stopPropagation()}>
              <div className="profile-drawer-cover">
                <img src={process.env.PUBLIC_URL + '/user-girl-avatar.png'} alt="User" className="profile-drawer-pic" />
              </div>
              <div className="profile-drawer-main">
                <h2 className="profile-drawer-name">Nehanshi Sharma</h2>
                <p className="profile-drawer-about">Available | Girl Avatar</p>
                <div className="profile-drawer-qr">
                  <img src="https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=Nehanshi" alt="QR Code" />
                </div>
              </div>
              <button className="profile-drawer-close" onClick={() => setProfileDrawer(false)}>&times;</button>
            </div>
          </div>
        )}
      </aside>

      <div className="whatsapp-container">
        <header className="chat-header">
          {isMobile && selectedChat !== null && (
            <IoArrowBack className="header-icon" onClick={() => { setSidebarOpen(true); setSelectedChat(null); }} />
          )}
          <FaBars className="header-icon hamburger" onClick={() => setSidebarOpen(true)} />
          <Link to="/profile" className="profile-link">
            <img src={nehanshiProfilePic} alt="Profile" className="profile-pic profile-pic-animate" />
            <div className="contact-info">
              <div className="contact-name">Nehanshi</div>
              <div className="contact-status">{isAiTyping ? "typing..." : lastSeen}</div>
            </div>
          </Link>

          <div className="header-icons-right">
            <IoVideocam className="header-icon" onClick={() => handleFunctionalityAlert("Video Call")} />
            <IoCall className="header-icon" onClick={() => handleFunctionalityAlert("Voice Call")} />
            <div className="menu-container" ref={menuRef}>
              <BsThreeDotsVertical className="header-icon" onClick={() => setShowMenu(!showMenu)} />
              {showMenu && (
                <ul className="dropdown-menu">
                  <li className="dropdown-item" onClick={() => handleFunctionalityAlert("Contact Info")}>View contact</li>
                  <li className="dropdown-item" onClick={() => handleFunctionalityAlert("Media, links, and docs")}>Media, links, and docs</li>
                  <li className="dropdown-item" onClick={() => handleFunctionalityAlert("Search")}>Search</li>
                  <li className="dropdown-item" onClick={() => handleFunctionalityAlert("Mute notifications")}>Mute notifications</li>
                  <li className="dropdown-item" onClick={() => handleFunctionalityAlert("Disappearing messages")}>Disappearing messages</li>
                  <li className="dropdown-item" onClick={() => handleFunctionalityAlert("Wallpaper")}>Wallpaper</li>
                </ul>
              )}
            </div>
          </div>
        </header>

        <main className="chat-body">
          {messages.map((msg, index) => (
            <React.Fragment key={msg.id || index}>
              {isNewDay(messages[index - 1], msg) && (
                <div className="date-separator">
                  <span>{formatDateSeparator(msg.timestamp)}</span>
                </div>
              )}

              <div className={`message-row ${msg.sender === "Nehanshi" ? "left" : "right"}`}>
                <div className={`message-bubble ${msg.sender === "Nehanshi" ? "nehanshi" : "akash"}`}>

                  {/* replied message preview inside bubble */}
                  {msg.replyTo && (
                    <div className="bubble-reply">
                      <div className="bubble-reply-sender">{msg.replyTo.sender}</div>
                      <div className="bubble-reply-text">{msg.replyTo.text.length > 120 ? msg.replyTo.text.slice(0,120) + '…' : msg.replyTo.text}</div>
                    </div>
                  )}

                  {/* deleted message */}
                  {msg.deleted ? (
                    <p className="message-deleted">{msg.text || 'This message was deleted'}</p>
                  ) : (
                    <p className="message-text">{msg.text}</p>
                  )}

                  {/* reactions pills */}
                  {reactionsMap[msg.id] && (
                    <div className="bubble-reactions">
                      {Object.entries(reactionsMap[msg.id].counts || {}).map(([emoji, count]) => (
                        <div key={emoji} className="reaction-pill" onClick={() => handleReact(msg.id, emoji)}>{emoji} {count}</div>
                      ))}
                    </div>
                  )}

                  <div className="message-meta">
                    <span className="timestamp">{formatTimestamp(msg.timestamp)}</span>
                    {msg.sender === "Akash" && <span className="status-text" style={{marginLeft:8}}>{renderStatusIcon(msg.status)}</span>}
                    {msg.sender === "Akash" && <MdDoneAll className="read-receipt" style={{marginLeft:6, verticalAlign:'middle', opacity: msg.status === 'read' ? 1 : 0.6}} />}
                  </div>

                  {/* bubble actions (hover) */}
                  <div className="bubble-actions" role="group" aria-label="Message actions">
                    <button className="action-btn" onClick={() => setReplyTo({ id: msg.id, sender: msg.sender, text: msg.text })} aria-label="Reply">↩</button>
                    <button className="action-btn" onClick={() => toggleReactionPicker(msg.id)} aria-label="React">😊</button>
                    <button className="action-btn" onClick={() => handleDeleteMessage(msg.id)} aria-label="Delete">🗑</button>
                  </div>

                  {/* inline reaction picker */}
                  {reactionPickerFor === msg.id && (
                    <div className="reaction-inline-picker">
                      {availableReacts.map(r => <button key={r} className="react-btn" onClick={() => handleReact(msg.id, r)} aria-label={`React ${r}`}>{r}</button>)}
                    </div>
                  )}
                </div>
              </div>
            </React.Fragment>
          ))}

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

            {/* Reply preview */}
            {replyTo && (
              <div className={`reply-preview${darkMode ? ' dark' : ''}`}>
                <div className="reply-meta">
                  Replying to <strong>{replyTo.sender}</strong>
                  <button className="reply-cancel" type="button" onClick={() => setReplyTo(null)} aria-label="Cancel reply">✕</button>
                </div>
                <div className="reply-text">{replyTo.text.length > 120 ? replyTo.text.slice(0,120) + '…' : replyTo.text}</div>
              </div>
            )}

            <div className="input-area">
              <BsEmojiSmile
                className="footer-icon"
                onClick={() => setShowEmojiPicker(v => !v)}
                aria-label="Emoji"
              />
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

              <input
                type="text"
                className="chat-input"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Message"
                autoFocus
                ref={inputRef}
              />

              <BsPaperclip
                className="footer-icon attach-icon"
                onClick={() => setShowAttachmentPicker(v => !v)}
                aria-label="Attach"
              />
              {showAttachmentPicker && (
                <div className={`attachment-picker${darkMode ? ' dark' : ''}`}>
                  <label className="attachment-option">
                    <FaFileImage /> Image
                    <input type="file" accept="image/*" style={{display:'none'}} onChange={e => {
                      setSelectedFile(e.target.files[0]);
                      setShowAttachmentPicker(false);
                    }} />
                  </label>
                  <label className="attachment-option">
                    <FaFileAlt /> File
                    <input type="file" style={{display:'none'}} onChange={e => {
                      setSelectedFile(e.target.files[0]);
                      setShowAttachmentPicker(false);
                    }} />
                  </label>
                  <label className="attachment-option">
                    <FaCamera /> Camera
                    <input type="file" accept="image/*" capture="environment" style={{display:'none'}} onChange={e => {
                      setSelectedFile(e.target.files[0]);
                      setShowAttachmentPicker(false);
                    }} />
                  </label>
                  {selectedFile && (
                    <div className="attachment-preview">
                      {selectedFile.type && selectedFile.type.startsWith('image') ? (
                        <img src={URL.createObjectURL(selectedFile)} alt="preview" />
                      ) : (
                        <span>{selectedFile.name}</span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <button type="submit" className="mic-send-button" onClick={(e) => { if (inputText.trim() === "") { e.preventDefault(); handleFunctionalityAlert("Voice Message"); } }} aria-label="Send message">
              {inputText.trim() !== "" ? <IoSend /> : <BsFillMicFill />}
            </button>

            <FaPalette className="footer-icon palette-icon" title="Change wallpaper" onClick={() => setShowWallpaperPicker(v => !v)} />
            {showWallpaperPicker && (
              <div className={`wallpaper-picker${darkMode ? ' dark' : ''}`}>
                <div className={`wallpaper-option${wallpaper==='pattern'?' selected':''}`} onClick={()=>{setWallpaper('pattern');setShowWallpaperPicker(false);}}>
                  <div className="wallpaper-thumb pattern"></div> Pattern
                </div>
                <div className={`wallpaper-option${wallpaper==='solid'?' selected':''}`} onClick={()=>{setWallpaper('solid');setShowWallpaperPicker(false);}}>
                  <div className="wallpaper-thumb solid"></div> Solid
                </div>
                <div className={`wallpaper-option${wallpaper==='gradient'?' selected':''}`} onClick={()=>{setWallpaper('gradient');setShowWallpaperPicker(false);}}>
                  <div className="wallpaper-thumb gradient"></div> Gradient
                </div>
              </div>
            )}
          </form>
        </footer>

        <button className="fab-new-chat" onClick={() => alert('New chat coming soon!')}>
          <MdChat />
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;
