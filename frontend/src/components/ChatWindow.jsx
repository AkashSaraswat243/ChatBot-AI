// src/components/ChatWindow.jsx (Corrected Code)

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

const BACKEND_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";
const socket = io(BACKEND_URL);

const ChatWindow = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [lastSeen, setLastSeen] = useState("online");
  const [showMenu, setShowMenu] = useState(false);
  const messagesEndRef = useRef(null);
  const menuRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [search, setSearch] = useState("");
  const [profileDrawer, setProfileDrawer] = useState(false);
  const [wallpaper, setWallpaper] = useState('pattern');
  const [showWallpaperPicker, setShowWallpaperPicker] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 900);
  const [selectedChat, setSelectedChat] = useState(null);
  const messageSound = useRef(new Audio(process.env.PUBLIC_URL + '/send.mp3'));
  const prevMessagesRef = useRef([]);
  const [reactions, setReactions] = useState({});
  const [showReactionPicker, setShowReactionPicker] = useState({});
  const emojiOptions = ['😀','😁','😂','🤣','😊','😍','😘','😜','🤔','😎','😢','😭','😡','👍','🙏','👏','💯','🔥','❤️','🎉','🥳','😇','😅','😆','😉','😋','😏','😌','😃','😄','😅','😆','😇','😈','😎','😐','😑','😒','😓','😔','😕','😖','😗','😘','😙','😚','😛','😜','😝','😞','😟','😠','😡','😢','😣','😤','😥','😦','😧','😨','😩','😪','😫','😬','😭','😮','😯','😰','😱','😲','😳','😴','😵','😶','😷','😸','😹','😺','😻','😼','😽','😾','😿','🙀','🙈','🙉','🙊','💀','👻','👽','🤖','💩','😺','😸','😹','😻','😼','😽','🙀','😿','😾','👍','👎','👌','✌️','🤞','🤟','🤘','🤙','🖐️','✋','🖖','👋','🤚','🖕','👏','🙌','👐','🤲','🙏','💪','🦾','🦵','🦶','👂','👃','🧠','🦷','🦴','👀','👁️','👅','👄','💋','🩸','🩹','🩺','🦠','🧬','🦠','🧫','🧪','🧴','🧷','🧹','🧺','🧻','🧼','🧽','🧯','🛀','🛁','🛀','🧖','🧗','🧘','🛌','🛏️','🛋️','🚽','🚿','🧴','🧵','🧶','🧷','🧸','🧹','🧺','🧻','🧼','🧽','🧯','🛀','🛁','🛀','🧖','🧗','🧘','🛌','🛏️','🛋️','🚽','🚿'];
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef();
  const [showAttachmentPicker, setShowAttachmentPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    socket.off("initialHistory").on("initialHistory", setMessages);
    socket.off("newMessage").on("newMessage", (newMessage) => {
      setIsAiTyping(false);
      setMessages((prev) => [...prev, newMessage]);
    });
    socket.off("aiTyping").on("aiTyping", ({ isTyping }) => {
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

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      socket.off("initialHistory");
      socket.off("newMessage");
      socket.off("aiTyping");
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(scrollToBottom, [messages, isAiTyping]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 900);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (prevMessagesRef.current.length && messages.length > prevMessagesRef.current.length) {
      messageSound.current.currentTime = 0;
      messageSound.current.play();
    }
    prevMessagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    setDarkMode(true);
  }, []);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (inputText.trim() === "") return;

    const userMessage = {
      sender: "Akash",
      text: inputText,
      timestamp: new Date().toISOString(),
    };

    socket.emit("sendMessage", userMessage);

    // setMessages((prev) => [...prev, userMessage]); // <-- FIX: This line was removed.
    // We no longer add the message to the state manually.
    // We wait for the server to send it back via the "newMessage" socket event.
    // This prevents the message from being displayed twice.

    setInputText("");
  };

  const formatTimestamp = (isoString) => {
    if (!isoString) return "";
    return new Date(isoString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const handleFunctionalityAlert = (feature) => {
    alert(`${feature} feature is coming soon!`);
    setShowMenu(false);
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
            <div
                className={`message-row ${msg.sender === "Nehanshi" ? "left" : "right"}`}
                onMouseEnter={() => setShowReactionPicker(p => ({...p, [msg.id]: true}))}
                onMouseLeave={() => setShowReactionPicker(p => ({...p, [msg.id]: false}))}
                onTouchStart={() => setShowReactionPicker(p => ({...p, [msg.id]: true}))}
                onTouchEnd={() => setTimeout(() => setShowReactionPicker(p => ({...p, [msg.id]: false})), 1200)}
              >
                <div className={`message-bubble ${msg.sender === "Nehanshi" ? "nehanshi" : "akash"}`}>
                <p className="message-text">{msg.text}</p>
                <div className="message-meta">
                    <span className="timestamp">{formatTimestamp(msg.timestamp)}</span>
                    {msg.sender === "Akash" && <MdDoneAll className="read-receipt" />}
                  </div>
                  {showReactionPicker[msg.id] && (
                    <div className={`reaction-picker${darkMode ? ' dark' : ''}`}>
                      {emojiOptions.map(e => (
                        <span key={e} className="reaction-emoji" onClick={() => setReactions(r => ({...r, [msg.id]: e}))}>{e}</span>
                      ))}
                    </div>
                  )}
                  {reactions[msg.id] && (
                    <div className="bubble-reaction">{reactions[msg.id]}</div>
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
          <div className="input-area">
            <BsEmojiSmile
              className="footer-icon"
                onClick={() => setShowEmojiPicker(v => !v)}
              />
              {showEmojiPicker && (
                <div className={`emoji-picker${darkMode ? ' dark' : ''}`}> 
                  {emojiOptions.map((e, i) => (
                    <span key={i} className="emoji-picker-emoji" onClick={() => {
                      const el = inputRef.current;
                      const start = el.selectionStart;
                      const end = el.selectionEnd;
                      setInputText(t => t.slice(0, start) + e + t.slice(end));
                      setShowEmojiPicker(false);
                      setTimeout(() => {
                        el.focus();
                        el.selectionStart = el.selectionEnd = start + e.length;
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
            <button type="submit" className="mic-send-button" onClick={(e) => { if (inputText.trim() === "") { e.preventDefault(); handleFunctionalityAlert("Voice Message"); } }}>
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
