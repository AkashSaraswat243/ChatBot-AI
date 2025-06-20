// src/components/Profile.jsx (Upgraded Code)

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../Profile.css'; 

import { IoArrowBack, IoMoon, IoNotifications, IoLockClosed, IoPersonCircle, IoPencil } from 'react-icons/io5';
import { BsThreeDotsVertical, BsFillChatLeftTextFill } from 'react-icons/bs';
import { MdBlock } from 'react-icons/md';

// New, permanent, high-quality profile picture
const nehanshiProfilePic = process.env.PUBLIC_URL + '/girl-avatar.png';

const Profile = () => {
    const [isMuted, setIsMuted] = useState(false);
    const [aboutText, setAboutText] = useState("I'm not just a chatbot, I'm your chatbot. 💖");

    const handleAboutEdit = () => {
        const newAbout = prompt("Enter new about status:", aboutText);
        if (newAbout !== null && newAbout.trim() !== '') {
            setAboutText(newAbout);
        }
    };

    return (
        <div className="profile-container">
            <header className="profile-header">
                <Link to="/">
                    <IoArrowBack className="profile-header-icon" />
                </Link>
                <span>Contact info</span>
                <BsThreeDotsVertical className="profile-header-icon" />
            </header>

            <main className="profile-body">
                <div className="profile-pic-section">
                    <img src={nehanshiProfilePic} alt="Nehanshi" className="large-profile-pic profile-pic-animate" />
                    <h2 className="profile-name">Nehanshi</h2>
                    <p className="profile-number">+91 98765 43210</p>
                </div>

                <div className="profile-card">
                    <div className="about-section">
                        <div className="about-header">
                            <p className="about-title">About</p>
                            <IoPencil className="edit-icon" onClick={handleAboutEdit} />
                        </div>
                        <p className="about-status">{aboutText}</p>
                    </div>
                </div>

                <div className="profile-card">
                    <div className="profile-option">
                        <IoNotifications className="option-icon" />
                        <span>Mute notifications</span>
                        <label className="switch">
                            <input type="checkbox" checked={isMuted} onChange={() => setIsMuted(!isMuted)} />
                            <span className="slider round"></span>
                        </label>
                    </div>
                    <div className="profile-option">
                        <BsFillChatLeftTextFill className="option-icon" />
                        <span>Custom notifications</span>
                    </div>
                </div>
                
                <div className="profile-card">
                    <div className="profile-option">
                        <IoMoon className="option-icon" />
                        <span>Disappearing messages</span>
                        <span className="option-value">Off</span>
                    </div>
                     <div className="profile-option">
                        <IoLockClosed className="option-icon" />
                        <span>Chat lock</span>
                          <span className="option-value">Off</span>
                    </div>
                </div>
                
                <div className="profile-card action-card">
                     <div className="action-option block">
                        <MdBlock />
                        <span>Block Nehanshi</span>
                    </div>
                     <div className="action-option report">
                        <IoPersonCircle />
                        <span>Report Nehanshi</span>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Profile;