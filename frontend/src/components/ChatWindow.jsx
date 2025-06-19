// src/components/ChatWindow.jsx (Corrected Code)

import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { Link } from "react-router-dom";
import "../ChatWindow.css";

import { IoArrowBack, IoCall, IoVideocam, IoSend } from "react-icons/io5";
import {
  BsThreeDotsVertical,
  BsEmojiSmile,
  BsPaperclip,
  BsFillMicFill,
} from "react-icons/bs";
import { MdDoneAll } from "react-icons/md";

const nehanshiProfilePic =
  "https://i.pinimg.com/564x/49/8d/93/498d933f20d20875b35831517a26244c.jpg";

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
    <div className="whatsapp-container">
      <header className="chat-header">
        <IoArrowBack
          className="header-icon"
          onClick={() => alert("Exiting chat...")}
        />

        <Link to="/profile" className="profile-link">
          <img src={nehanshiProfilePic} alt="Profile" className="profile-pic" />
          <div className="contact-info">
            <div className="contact-name">Nehanshi</div>
            <div className="contact-status">
              {isAiTyping ? "typing..." : lastSeen}
            </div>
          </div>
        </Link>

        <div className="header-icons-right">
          <IoVideocam
            className="header-icon"
            onClick={() => handleFunctionalityAlert("Video Call")}
          />
          <IoCall
            className="header-icon"
            onClick={() => handleFunctionalityAlert("Voice Call")}
          />
          <div className="menu-container" ref={menuRef}>
            <BsThreeDotsVertical
              className="header-icon"
              onClick={() => setShowMenu(!showMenu)}
            />
            {showMenu && (
              <ul className="dropdown-menu">
                <li
                  className="dropdown-item"
                  onClick={() => handleFunctionalityAlert("Contact Info")}
                >
                  View contact
                </li>
                <li
                  className="dropdown-item"
                  onClick={() =>
                    handleFunctionalityAlert("Media, links, and docs")
                  }
                >
                  Media, links, and docs
                </li>
                <li
                  className="dropdown-item"
                  onClick={() => handleFunctionalityAlert("Search")}
                >
                  Search
                </li>
                <li
                  className="dropdown-item"
                  onClick={() => handleFunctionalityAlert("Mute notifications")}
                >
                  Mute notifications
                </li>
                <li
                  className="dropdown-item"
                  onClick={() =>
                    handleFunctionalityAlert("Disappearing messages")
                  }
                >
                  Disappearing messages
                </li>
                <li
                  className="dropdown-item"
                  onClick={() => handleFunctionalityAlert("Wallpaper")}
                >
                  Wallpaper
                </li>
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
              className={`message-row ${
                msg.sender === "Nehanshi" ? "left" : "right"
              }`}
            >
              <div
                className={`message-bubble ${
                  msg.sender === "Nehanshi" ? "nehanshi" : "akash"
                }`}
              >
                <p className="message-text">{msg.text}</p>
                <div className="message-meta">
                  <span className="timestamp">
                    {formatTimestamp(msg.timestamp)}
                  </span>
                  {msg.sender === "Akash" && (
                    <MdDoneAll className="read-receipt" />
                  )}
                </div>
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
              onClick={() => handleFunctionalityAlert("Emoji Picker")}
            />
            <input
              type="text"
              className="chat-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Message"
              autoFocus
            />
            <BsPaperclip
              className="footer-icon attach-icon"
              onClick={() => handleFunctionalityAlert("Attachments")}
            />
            {inputText.trim() === "" && (
              <IoVideocam
                className="footer-icon camera-icon"
                onClick={() => handleFunctionalityAlert("Camera")}
              />
            )}
          </div>
          <button
            type="submit"
            className="mic-send-button"
            onClick={(e) => {
              if (inputText.trim() === "") {
                e.preventDefault();
                handleFunctionalityAlert("Voice Message");
              }
            }}
          >
            {inputText.trim() !== "" ? <IoSend /> : <BsFillMicFill />}
          </button>
        </form>
      </footer>
    </div>
  );
};

export default ChatWindow;
