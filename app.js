import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, push, onValue, get, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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

// রেজিস্ট্রেশন লজিক
document.getElementById('startBtn').onclick = async () => {
    const name = document.getElementById('regName').value;
    const phone = document.getElementById('regPhone').value;
    const pass = document.getElementById('regPass').value;
    if(!phone || !pass) return alert("Phone and Password required!");

    const dbId = phone.replace(/[^a-zA-Z0-9]/g, "");
    const userRef = ref(db, 'users/' + dbId);
    const snap = await get(userRef);

    if(snap.exists() && snap.val().password === pass) {
        currentUser = snap.val();
    } else {
        currentUser = { id: dbId, username: name || phone, password: pass, profilePic: "https://cdn-icons-png.flaticon.com/512/149/149071.png" };
        await set(userRef, currentUser);
    }
    startApp();
};

function startApp() {
    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('app-interface').style.display = 'block';
    document.getElementById('myPic').src = currentUser.profilePic;
    loadUsers();
}

// অটোমেটিক অন্য অ্যাকাউন্টগুলো দেখাবে
function loadUsers() {
    onValue(ref(db, 'users/'), (snap) => {
        const list = document.getElementById('users-list');
        list.innerHTML = "";
        snap.forEach(child => {
            const u = child.val();
            if(u.id !== currentUser.id) {
                list.innerHTML += `<div class="chat-item" onclick="openChat('${u.id}','${u.username}','${u.profilePic}')" style="display:flex; align-items:center; padding:15px; border-bottom:1px solid #eee; cursor:pointer;">
                    <img src="${u.profilePic}" style="width:50px; height:50px; border-radius:50%; margin-right:15px;">
                    <b>${u.username}</b>
                </div>`;
            }
        });
    });
}

// প্রোফাইল এডিট অপশন
document.getElementById('editProfileBtn').onclick = () => {
    document.getElementById('edit-modal').style.display = 'flex';
    document.getElementById('editName').value = currentUser.username;
    document.getElementById('editPic').value = currentUser.profilePic;
};

document.getElementById('saveProfileBtn').onclick = async () => {
    const newName = document.getElementById('editName').value;
    const newPic = document.getElementById('editPic').value;
    await update(ref(db, 'users/' + currentUser.id), { username: newName, profilePic: newPic });
    currentUser.username = newName;
    currentUser.profilePic = newPic;
    document.getElementById('myPic').src = newPic;
    document.getElementById('edit-modal').style.display = 'none';
};

document.getElementById('closeModal').onclick = () => document.getElementById('edit-modal').style.display = 'none';

// চ্যাট ওপেন এবং নোটিফিকেশন লজিক
window.openChat = (id, name, pic) => {
    document.getElementById('chat-list-page').style.display = 'none';
    document.getElementById('inbox-page').style.display = 'block';
    document.getElementById('pName').innerText = name;
    document.getElementById('pPic').src = pic;
    document.getElementById('notif-dot').style.display = 'none'; // চ্যাট ওপেন করলে লাল ডট চলে যাবে
    currentChatId = [currentUser.id, id].sort().join("_");
    loadMsg();
};

function loadMsg() {
    onValue(ref(db, 'chats/' + currentChatId), (snap) => {
        const box = document.getElementById('chat-box');
        box.innerHTML = "";
        snap.forEach(m => {
            const d = m.val();
            box.innerHTML += `<div class="msg ${d.s === currentUser.id ? 'sent' : 'received'}">${d.t}</div>`;
            if(d.s !== currentUser.id && document.getElementById('inbox-page').style.display === 'none') {
                document.getElementById('notif-dot').style.display = 'block'; // নতুন মেসেজ আসলে লাল ডট দেখাবে
            }
        });
        box.scrollTop = box.scrollHeight;
    });
}

document.getElementById('sendBtn').onclick = () => {
    const t = document.getElementById('messageInput').value;
    if(!t) return;
    push(ref(db, 'chats/' + currentChatId), { s: currentUser.id, t, time: new Date().toLocaleTimeString() });
    document.getElementById('messageInput').value = "";
};

document.getElementById('backBtn').onclick = () => {
    document.getElementById('inbox-page').style.display = 'none';
    document.getElementById('chat-list-page').style.display = 'block';
};
