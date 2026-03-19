import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, push, onValue, get, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyD62pLbwBDSyszTVuN4pi83SIBxFMjjfqQ",
  authDomain: "tariful-4f6c2.firebaseapp.com",
  databaseURL: "https://tariful-4f6c2-default-rtdb.firebaseio.com",
  projectId: "tariful-4f6c2",
  storageBucket: "tariful-4f6c2.firebasestorage.app",
  messagingSenderId: "882412147422",
  appId: "1:882412147422:web:3100db9391ccd0bdc4684f",
  measurementId: "G-TDF69WJXNP"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let currentUser = null;
let chatPartner = null;
let currentChatId = null;

// --- ১. রেজিস্ট্রেশন ও লগইন ---
document.getElementById('authBtn').onclick = async () => {
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const phone = document.getElementById('regPhone').value;
    const pass = document.getElementById('regPass').value;

    if(!phone || !pass) return alert("Phone and Password required!");

    const userRef = ref(db, 'users/' + phone);
    const snapshot = await get(userRef);

    if (snapshot.exists()) {
        if(snapshot.val().password === pass) {
            currentUser = snapshot.val();
            loginSuccess();
        } else {
            alert("Wrong Password!");
        }
    } else {
        const newUser = { username: name, email, phone, password: pass, profilePic: "https://cdn-icons-png.flaticon.com/512/149/149071.png", status: "online" };
        await set(userRef, newUser);
        currentUser = newUser;
        loginSuccess();
    }
};

function loginSuccess() {
    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('chat-interface').style.display = 'flex';
    document.getElementById('myName').innerText = currentUser.username;
    document.getElementById('myPic').src = currentUser.profilePic;
    updateStatus("online");
    loadUsers();
}

// --- ২. ইউজার লিস্ট লোড করা ---
function loadUsers() {
    onValue(ref(db, 'users/'), (snapshot) => {
        const listDiv = document.getElementById('users-list');
        listDiv.innerHTML = "";
        snapshot.forEach(child => {
            const user = child.val();
            if(user.phone !== currentUser.phone) {
                const div = document.createElement('div');
                div.className = 'user-item';
                div.innerHTML = `
                    <img src="${user.profilePic}" width="40" style="border-radius:50%; margin-right:10px;">
                    <span>${user.username}</span>
                    <div class="status-dot ${user.status === 'online' ? 'status-online' : ''}"></div>
                `;
                div.onclick = () => openChat(user);
                listDiv.appendChild(div);
            }
        });
    });
}

// --- ৩. চ্যাট ওপেন ও মেসেজ পাঠানো ---
function openChat(partner) {
    chatPartner = partner;
    document.getElementById('chat-header').innerText = partner.username;
    document.getElementById('message-input-area').style.display = 'flex';
    
    const ids = [currentUser.phone, partner.phone].sort();
    currentChatId = ids[0] + "_" + ids[1];

    onValue(ref(db, 'chats/' + currentChatId), (snapshot) => {
        const box = document.getElementById('chat-box');
        box.innerHTML = "";
        snapshot.forEach(msgChild => {
            const msg = msgChild.val();
            const div = document.createElement('div');
            div.className = `msg ${msg.sender === currentUser.phone ? 'my-msg' : 'other-msg'}`;
            div.innerText = msg.text;
            box.appendChild(div);
        });
        box.scrollTop = box.scrollHeight;
    });
}

document.getElementById('sendBtn').onclick = () => {
    const text = document.getElementById('messageInput').value;
    if(!text || !currentChatId) return;
    push(ref(db, 'chats/' + currentChatId), { sender: currentUser.phone, text, time: Date.now() });
    document.getElementById('messageInput').value = "";
};

// --- ৪. সেটিংস (Update/Delete/Logout) ---
document.getElementById('updateBtn').onclick = async () => {
    const newName = document.getElementById('newName').value;
    const newPic = document.getElementById('newPic').value;
    if(newName) currentUser.username = newName;
    if(newPic) currentUser.profilePic = newPic;
    await set(ref(db, 'users/' + currentUser.phone), currentUser);
    alert("Updated!");
    location.reload();
};

document.getElementById('logoutBtn').onclick = () => {
    updateStatus("offline");
    location.reload();
};

document.getElementById('deleteBtn').onclick = async () => {
    if(confirm("Delete account?")) {
        await remove(ref(db, 'users/' + currentUser.phone));
        location.reload();
    }
};

function updateStatus(s) {
    if(currentUser) set(ref(db, 'users/' + currentUser.phone + '/status'), s);
}
