import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, push, onValue, get, onDisconnect } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyD62pLbwBDSyszTVuN4pi83SIBxFMjjfqQ",
  authDomain: "tariful-4f6c2.firebaseapp.com",
  databaseURL: "https://tariful-4f6c2-default-rtdb.firebaseio.com",
  projectId: "tariful-4f6c2",
  storageBucket: "tariful-4f6c2.firebasestorage.app",
  messagingSenderId: "882412147422",
  appId: "1:882412147422:web:3100db9391ccd0bdc4684f"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let currentUser = null;
let currentChatId = null;

// ১২ ঘণ্টার টাইম ফরম্যাট ফাংশন
const formatTime = () => new Date().toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });

// লগইন ও রেজিস্ট্রেশন লজিক (Duplicate Check)
document.getElementById('authBtn').onclick = async () => {
    const userVal = document.getElementById('userVal').value;
    const pass = document.getElementById('userPass').value;
    if(!userVal || !pass) return alert("সব ঘর পূরণ করুন!");

    const dbId = userVal.replace(/[^a-zA-Z0-9]/g, ""); // ফোন বা জিমেইলকে আইডিতে রূপান্তর
    const userRef = ref(db, 'users/' + dbId);
    const snap = await get(userRef);

    if(snap.exists()){
        // অ্যাকাউন্ট থাকলে পাসওয়ার্ড চেক করে লগইন হবে
        if(snap.val().password === pass) {
            currentUser = snap.val();
            startApp();
        } else {
            alert("ভুল পাসওয়ার্ড অথবা এই নম্বরটি অন্য কেউ ব্যবহার করছে!");
        }
    } else {
        // নতুন রেজিস্ট্রেশন (Duplicate Blocked)
        currentUser = { 
            id: dbId, 
            username: userVal.split('@')[0], 
            password: pass, 
            profilePic: `https://ui-avatars.com/api/?name=${userVal}&background=random`,
            status: "online"
        };
        await set(userRef, currentUser);
        startApp();
    }
};

function startApp() {
    localStorage.setItem("m_user", JSON.stringify(currentUser));
    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('messenger-app').style.display = 'block';
    document.getElementById('myPic').src = currentUser.profilePic;
    document.getElementById('myName').innerText = currentUser.username;

    const statusRef = ref(db, 'users/' + currentUser.id + '/status');
    set(statusRef, "online");
    onDisconnect(statusRef).set("offline");

    loadUserList();
}

// চ্যাট লিস্ট ও স্টোরি বার লোড করা
function loadUserList() {
    onValue(ref(db, 'users/'), (snap) => {
        const list = document.getElementById('users-list');
        const stories = document.getElementById('active-users-bar');
        list.innerHTML = ""; stories.innerHTML = "";

        snap.forEach(child => {
            const user = child.val();
            if(user.id === currentUser.id) return;

            // স্টোরি বার
            stories.innerHTML += `<img src="${user.profilePic}" class="story-avatar" onclick="openInbox('${user.id}','${user.username}','${user.profilePic}')">`;

            // মেইন লিস্ট
            list.innerHTML += `
                <div class="user-item" onclick="openInbox('${user.id}','${user.username}','${user.profilePic}')">
                    <img src="${user.profilePic}">
                    <div><b>${user.username}</b><p style="color:gray; font-size:12px;">Active now</p></div>
                </div>`;
        });
    });
}

// ইনবক্স ফাংশন
window.openInbox = (id, name, pic) => {
    document.getElementById('chat-list-page').style.display = 'none';
    document.getElementById('inbox-page').style.display = 'block';
    document.getElementById('partnerName').innerText = name;
    document.getElementById('partnerPic').src = pic;
    
    currentChatId = [currentUser.id, id].sort().join("_");
    loadMessages();
};

function loadMessages() {
    onValue(ref(db, 'chats/' + currentChatId), (snap) => {
        const box = document.getElementById('chat-box');
        box.innerHTML = "";
        let lastT = "";
        snap.forEach(m => {
            const d = m.val();
            if(d.time !== lastT) {
                box.innerHTML += `<div class="time-stamp">${d.time}</div>`;
                lastT = d.time;
            }
            box.innerHTML += `<div class="msg ${d.sender === currentUser.id ? 'sent' : 'received'}">${d.text}</div>`;
        });
        box.scrollTop = box.scrollHeight;
    });
}

// মেসেজ পাঠানো
document.getElementById('sendBtn').onclick = () => {
    const text = document.getElementById('messageInput').value;
    if(!text) return;
    push(ref(db, 'chats/' + currentChatId), {
        sender: currentUser.id,
        text: text,
        time: formatTime()
    });
    document.getElementById('messageInput').value = "";
};

// ব্যাক বাটন ও লগআউট
document.getElementById('backBtn').onclick = () => {
    document.getElementById('inbox-page').style.display = 'none';
    document.getElementById('chat-list-page').style.display = 'block';
};

document.getElementById('logoutBtn').onclick = () => {
    set(ref(db, 'users/' + currentUser.id + '/status'), "offline");
    localStorage.clear();
    location.reload();
};

// অটো লগইন চেক
const saved = localStorage.getItem("m_user");
if(saved) { currentUser = JSON.parse(saved); startApp(); }
