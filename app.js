// 🔥 IMPORT FIREBASE
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  getDatabase,
  ref,
  push,
  onValue,
  remove,
  set
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";


// 🔑 CONFIG FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyAmMN7ZI5XK0zOiXot6pXIULVFg1BDW9FA",
  authDomain: "kanban-2fdbe.firebaseapp.com",
  databaseURL: "https://kanban-2fdbe-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "kanban-2fdbe",
  storageBucket: "kanban-2fdbe.appspot.com",
  messagingSenderId: "749194970625",
  appId: "1:749194970625:web:ac22510a775cd3f6eaa200"
};


// INIT FIREBASE
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

const registerBtn = document.getElementById("registerBtn");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");

// AMBIL ELEMENT HTML
const email = document.getElementById("email");
const password = document.getElementById("password");
const board = document.getElementById("board");

const userInfo = document.getElementById("userInfo");
const welcomeText = document.getElementById("welcomeText");

// AUTH FUNCTION
window.register = () => {
  createUserWithEmailAndPassword(auth, email.value, password.value)
    .then(() => alert("Register berhasil"))
    .catch(err => alert(err.message));
};

window.login = () => {
  signInWithEmailAndPassword(auth, email.value, password.value)
    .then(() => alert("Login berhasil"))
    .catch(err => alert(err.message));
};

window.logout = () => {
  signOut(auth);
};


// CEK USER LOGIN
onAuthStateChanged(auth, user => {
  if (user) {
    // TAMPILKAN BOARD
    board.style.display = "flex";

    // SEMBUNYIKAN INPUT
    email.style.display = "none";
    password.style.display = "none";

    registerBtn.style.display = "none";
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";

    // TAMPILKAN USER INFO
    userInfo.style.display = "block";
    welcomeText.innerText = "Welcome, " + user.email;

    loadTasks(user.uid);
  } else {
    // SEMBUNYIKAN BOARD
    board.style.display = "none";

    // TAMPILKAN INPUT
    email.style.display = "inline-block";
    password.style.display = "inline-block";

    registerBtn.style.display = "inline-block";
    loginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";

    // SEMBUNYIKAN USER INFO
    userInfo.style.display = "none";
    welcomeText.innerText = "";
  }
});

// TAMBAH TASK
window.addTask = (status) => {
  const user = auth.currentUser;
  const input = document.getElementById(status + "Input");

  if (!input.value) return;

  push(ref(db, `tasks/${user.uid}/${status}`), {
    title: input.value
  });

  input.value = "";
};


// LOAD DATA REALTIME
function loadTasks(uid) {
  ["todo", "inprogress", "done"].forEach(status => {
    const list = document.getElementById(status + "List");

    onValue(ref(db, `tasks/${uid}/${status}`), snapshot => {
      list.innerHTML = "";

      snapshot.forEach(child => {
        const task = child.val();

        const div = document.createElement("div");
        div.className = "task";

        div.innerHTML = `
          <strong>${task.title}</strong>
          <div style="margin-top:8px;">
            ${status !== "todo" ? `<button onclick="moveTask('${status}','${child.key}','back')">⬅</button>` : ""}
            ${status !== "done" ? `<button onclick="moveTask('${status}','${child.key}','forward')">➡</button>` : ""}
            ${status === "done" ? `<button onclick="deleteTask('${status}','${child.key}')">❌</button>` : ""}
          </div>
        `;

        list.appendChild(div);
      });
    });
  });
}


// HAPUS TASK
window.deleteTask = (status, id) => {
  const user = auth.currentUser;
  remove(ref(db, `tasks/${user.uid}/${status}/${id}`));
};


// PINDAH TASK
window.moveTask = (status, id, direction = "forward") => {
  const user = auth.currentUser;
  let next;

  if (direction === "forward") {
    next = status === "todo" ? "inprogress" : "done";
  } else {
    next = status === "done" ? "inprogress" : "todo";
  }

  const oldRef = ref(db, `tasks/${user.uid}/${status}/${id}`);
  const newRef = ref(db, `tasks/${user.uid}/${next}/${id}`);

  onValue(oldRef, snapshot => {
    set(newRef, snapshot.val());
    remove(oldRef);
  }, { onlyOnce: true });
};