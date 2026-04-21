// 🔥 IMPORT FIREBASE
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  updateProfile as updateUserProfile
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getDatabase,
  ref,
  push,
  onValue,
  remove,
  get,
  set,
  update
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// 🔑 CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyAmMN7ZI5XK0zOiXot6pXIULVFg1BDW9FA",
  authDomain: "kanban-2fdbe.firebaseapp.com",
  databaseURL: "https://kanban-2fdbe-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "kanban-2fdbe",
  storageBucket: "kanban-2fdbe.appspot.com",
  messagingSenderId: "749194970625",
  appId: "1:749194970625:web:ac22510a775cd3f6eaa200"
};

// INIT
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// ELEMENTS
const elements = {
  email: document.getElementById("email"),
  password: document.getElementById("password"),
  name: document.getElementById("name"),
  board: document.getElementById("board"),
  header: document.getElementById("header"),
  welcomeText: document.getElementById("welcomeText"),
  avatar: document.getElementById("avatar")
};

// ================= AUTH =================
window.register = async () => {
  const emailVal = elements.email.value.trim();
  const passwordVal = elements.password.value;
  const nameVal = elements.name.value.trim();

  if (!emailVal || !passwordVal || passwordVal.length < 6) {
    alert("❌ Email dan password (min 6 karakter) wajib diisi!");
    return;
  }

  try {
    const result = await createUserWithEmailAndPassword(auth, emailVal, passwordVal);
    const user = result.user;

    await sendEmailVerification(user);
    
    await set(ref(db, `users/${user.uid}`), {
      name: nameVal || "User",
      email: emailVal,
      createdAt: Date.now()
    });

    alert("✅ Registrasi berhasil! Cek email verifikasi.");
  } catch (error) {
    console.error("Register error:", error);
    alert("❌ Registrasi gagal: " + error.message);
  }
};

window.login = async () => {
  try {
    await signInWithEmailAndPassword(auth, elements.email.value.trim(), elements.password.value);
  } catch (error) {
    console.error("Login error:", error);
    alert("❌ Login gagal: " + error.message);
  }
};

window.logout = () => {
  signOut(auth);
};

// ================= AUTH STATE =================
onAuthStateChanged(auth, async (user) => {
  console.log("Auth state changed:", user ? user.uid : "logged out");
  
  if (user) {
    if (!user.emailVerified) {
      alert("⚠️ Silakan verifikasi email Anda!");
      signOut(auth);
      return;
    }

    // Show app
    elements.header.style.display = "flex";
    elements.board.style.display = "flex";
    
    // Hide auth form
    [elements.email, elements.password, elements.name].forEach(el => {
      if (el) el.style.display = "none";
    });

    // Load data
    loadUserData(user.uid);
    loadTasks(user.uid);
    loadCustomColumns(user.uid);

  } else {
    // Show auth form
    elements.header.style.display = "none";
    elements.board.style.display = "none";
    
    [elements.email, elements.password, elements.name].forEach(el => {
      if (el) el.style.display = "block";
    });
  }
});

// ================= USER DATA =================
function loadUserData(uid) {
  onValue(ref(db, `users/${uid}`), (snap) => {
    const data = snap.val();
    if (data) {
      elements.welcomeText.textContent = `Halo, ${data.name || user.email}`;
    }
  });
}

// ================= CUSTOM COLUMNS =================
window.addColumn = () => {
  const user = auth.currentUser;
  if (!user) return;

  const name = prompt("Nama kolom baru:");
  if (!name || name.trim().length < 2) {
    alert("Nama kolom minimal 2 karakter!");
    return;
  }

  push(ref(db, `customColumns/${user.uid}`), {
    name: name.trim(),
    createdAt: Date.now()
  });
};

function loadCustomColumns(uid) {
  onValue(ref(db, `customColumns/${uid}`), (snapshot) => {
    document.querySelectorAll(".custom-column").forEach(el => el.remove());

    if (!snapshot.exists()) return;

    snapshot.forEach((child) => {
      const col = child.val();
      const div = document.createElement("div");
      div.className = "column custom-column";
      div.id = `custom-${child.key}`;
      div.innerHTML = `
        <h2>
          ${col.name} 
          <button onclick="deleteCustomColumn('${child.key}')" style="background:#ef4444;font-size:12px;padding:4px 8px;">×</button>
        </h2>

        <textarea 
          id="note-input-${child.key}" 
          class="custom-column-notes" 
          placeholder="Tulis catatan..."
        ></textarea>

        <button onclick="addNote('${child.key}')" 
          style="margin-top:10px;background:#f59e0b;">
          ➕ Tambah Catatan
        </button>

        <div id="notes-${child.key}"></div>
      `;
      document.getElementById("board").appendChild(div);

      loadNotes(uid, child.key);
    });
  });
}

window.addNote = (colId) => {
  const user = auth.currentUser;
  if (!user) return;

  const input = document.getElementById(`note-input-${colId}`);
  const text = input.value.trim();

  if (!text) {
    alert("Catatan tidak boleh kosong!");
    return;
  }

  push(ref(db, `notes/${user.uid}/${colId}`), {
    text,
    createdAt: Date.now()
  });

  input.value = "";
};

window.deleteNote = (colId, noteId) => {
  const user = auth.currentUser;

  if (confirm("Hapus catatan ini?")) {
    remove(ref(db, `notes/${user.uid}/${colId}/${noteId}`));
  }
};

function loadNotes(uid, colId) {
  const list = document.getElementById(`notes-${colId}`);
  if (!list) return;

  onValue(ref(db, `notes/${uid}/${colId}`), (snapshot) => {
    list.innerHTML = "";

    if (!snapshot.exists()) {
      list.innerHTML = `<div class="empty-state">Belum ada catatan</div>`;
      return;
    }

    snapshot.forEach((child) => {
      const note = child.val();

      const div = document.createElement("div");
      div.className = "note-item";

      div.innerHTML = `
        <div id="note-view-${child.key}">
          <div>${note.text}</div>
          <button onclick="showEditNote('${colId}','${child.key}')">✏️</button>
          <button onclick="deleteNote('${colId}','${child.key}')">❌</button>
        </div>

        <div id="note-edit-${child.key}" style="display:none; margin-top:5px;">
          <input id="note-input-edit-${child.key}" value="${note.text}" style="width:70%;">
          <button onclick="saveNote('${colId}','${child.key}')" style="background:#10b981;">Save</button>
          <button onclick="cancelEditNote('${child.key}')" style="background:#6b7280;">Cancel</button>
        </div>
      `;

      list.appendChild(div);
    });
  });
}

window.showEditNote = (colId, noteId) => {
  document.getElementById(`note-view-${noteId}`).style.display = "none";
  document.getElementById(`note-edit-${noteId}`).style.display = "block";
};

window.cancelEditNote = (noteId) => {
  document.getElementById(`note-view-${noteId}`).style.display = "block";
  document.getElementById(`note-edit-${noteId}`).style.display = "none";
};

window.saveNote = (colId, noteId) => {
  const user = auth.currentUser;
  const newText = document.getElementById(`note-input-edit-${noteId}`).value.trim();

  if (!newText) {
    alert("Catatan tidak boleh kosong!");
    return;
  }

  update(ref(db, `notes/${user.uid}/${colId}/${noteId}`), {
    text: newText
  });
};

window.deleteCustomColumn = (id) => {
  const user = auth.currentUser;
  if (confirm("Hapus kolom ini?")) {
    remove(ref(db, `customColumns/${user.uid}/${id}`));
  }
};

// ================= TASKS =================
window.addTask = (status) => {
  const user = auth.currentUser;
  if (!user) return;

  const input = document.getElementById(`${status}Input`);
  const title = input.value.trim();

  if (!title) {
    alert("Task tidak boleh kosong!");
    return;
  }

  push(ref(db, `tasks/${user.uid}/${status}`), {
    title,
    createdAt: Date.now(),
    priority: document.getElementById(`${status}Priority`)?.value || "Medium"
  });

  input.value = "";
};

function loadTasks(uid) {
  ["todo", "inprogress", "done"].forEach(status => {
    const list = document.getElementById(`${status}List`);
    if (!list) return;

    onValue(ref(db, `tasks/${uid}/${status}`), (snapshot) => {
      list.innerHTML = "";
      
      if (!snapshot.exists()) {
        list.innerHTML = '<div class="empty-state">No tasks 😎</div>';
        return;
      }

      snapshot.forEach((child) => {
        const task = child.val();
        const div = document.createElement("div");
        div.className = "task";
        div.innerHTML = `
          <div id="view-${child.key}">
            <strong>${task.title}</strong>
            <small style="color:#94a3b8;">${new Date(task.createdAt).toLocaleDateString()}</small>
            <div class="task-controls">
              <button class="edit-btn" onclick="showEdit('${status}','${child.key}')">✏️</button>
              <button class="move-btn" onclick="moveTask('${status}','${child.key}','back')">⬅</button>
              <button class="move-btn" onclick="moveTask('${status}','${child.key}','forward')">➡</button>
              <button class="delete-btn" onclick="deleteTask('${status}','${child.key}')">❌</button>
            </div>
          </div>
          <div id="edit-${child.key}" style="display:none; margin-top:10px;">
            <input id="editTitle-${child.key}" value="${task.title}" style="width:70%;">
            <button onclick="saveEdit('${status}','${child.key}')" style="width:28%;background:#10b981;">Save</button>
            <button onclick="cancelEdit('${child.key}')" style="width:28%;background:#6b7280;">Cancel</button>
          </div>
        `;
        list.appendChild(div);
      });
    });
  });
}

// TASK ACTIONS
window.deleteTask = (status, id) => {
  const user = auth.currentUser;
  if (confirm("Hapus task ini?")) {
    remove(ref(db, `tasks/${user.uid}/${status}/${id}`));
  }
};

window.deleteAllTask = (status) => {
  const user = auth.currentUser;
  if (confirm("Hapus semua task di kolom ini?")) {
    remove(ref(db, `tasks/${user.uid}/${status}`));
  }
};

window.deleteAllTasks = () => {
  const user = auth.currentUser;
  if (confirm("⚠️ Hapus SEMUA task dari semua kolom?")) {
    remove(ref(db, `tasks/${user.uid}`));
  }
};

window.moveTask = (status, id, direction) => {
  const user = auth.currentUser;
  const statusOrder = ["todo", "inprogress", "done"];
  const currentIndex = statusOrder.indexOf(status);
  
  let nextStatus;
  if (direction === "forward") {
    nextStatus = statusOrder[currentIndex + 1] || statusOrder[0];
  } else {
    nextStatus = statusOrder[currentIndex - 1] || statusOrder[statusOrder.length - 1];
  }

  const oldRef = ref(db, `tasks/${user.uid}/${status}/${id}`);
  const newRef = ref(db, `tasks/${user.uid}/${nextStatus}/${id}`);

  get(oldRef).then((snap) => {
    if (snap.exists()) {
      set(newRef, snap.val());
      remove(oldRef);
    }
  });
};

// EDIT TASK
window.showEdit = (status, id) => {
  document.getElementById(`view-${id}`).style.display = "none";
  document.getElementById(`edit-${id}`).style.display = "block";
};

window.cancelEdit = (id) => {
  document.getElementById(`view-${id}`).style.display = "block";
  document.getElementById(`edit-${id}`).style.display = "none";
};

window.saveEdit = (status, id) => {
  const user = auth.currentUser;
  const title = document.getElementById(`editTitle-${id}`).value.trim();

  if (!title) {
    alert("Judul task tidak boleh kosong!");
    return;
  }

  update(ref(db, `tasks/${user.uid}/${status}/${id}`), {
    title
  });
};

window.updateProfile = () => {
  const user = auth.currentUser;
  const newName = prompt("Nama baru:", "");
  if (newName && newName.trim()) {
    update(ref(db, `users/${user.uid}`), {
      name: newName.trim()
    }).then(() => {
      alert("✅ Profile updated!");
    });
  }
};

// INIT
console.log("🚀 Kanban App Loaded!");
