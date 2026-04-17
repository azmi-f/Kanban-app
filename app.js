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
  get,
  set,
  update
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";


// 🔑 CONFIG (PAKAI PUNYA KAMU)
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


// ELEMENT
const email = document.getElementById("email");
const password = document.getElementById("password");
const nameInput = document.getElementById("name");

const registerBtn = document.getElementById("registerBtn");
const loginBtn = document.getElementById("loginBtn");

const board = document.getElementById("board");
const header = document.getElementById("header");

const welcomeText = document.getElementById("welcomeText");


// 🔐 REGISTER
window.register = () => {
  createUserWithEmailAndPassword(auth, email.value, password.value)
    .then(res => {
      const user = res.user;

      set(ref(db, "users/" + user.uid), {
        name: nameInput.value || "User",
        avatar: "https://i.pravatar.cc/150"
      });
    });
};


// 🔐 LOGIN
window.login = () => {
  signInWithEmailAndPassword(auth, email.value, password.value);
};


// 🔓 LOGOUT
window.logout = () => signOut(auth);


// 🔥 AUTH STATE
onAuthStateChanged(auth, user => {
  if (user) {
    header.style.display = "flex";
    board.style.display = "flex";

    email.style.display = "none";
    password.style.display = "none";
    nameInput.style.display = "none";
    registerBtn.style.display = "none";
    loginBtn.style.display = "none";

    get(ref(db, "users/" + user.uid)).then(snap => {
      const data = snap.val();
      welcomeText.innerText = "Welcome, " + (data?.name || user.email);
      document.getElementById("avatar").src = data?.avatar || "";
    });

    loadTasks(user.uid);
  } else {
    header.style.display = "none";
    board.style.display = "none";

    email.style.display = "inline-block";
    password.style.display = "inline-block";
    nameInput.style.display = "inline-block";
    registerBtn.style.display = "inline-block";
    loginBtn.style.display = "inline-block";
  }
  document.getElementById("stats").style.display = "block";
  document.getElementById("stats").style.display = "none";
});


// ➕ ADD TASK
window.addTask = (status) => {
  const user = auth.currentUser;

  const title = document.getElementById(status + "Input").value;
  const date = document.getElementById(status + "Date").value;
  const priority = document.getElementById(status + "Priority").value;

  if (!title) return;

  push(ref(db, `tasks/${user.uid}/${status}`), {
    title,
    date,
    priority
  });

  document.getElementById(status + "Input").value = "";
};


// 📥 LOAD TASK
function loadTasks(uid) {
  ["todo", "inprogress", "done"].forEach(status => {
    const list = document.getElementById(status + "List");

    onValue(ref(db, `tasks/${uid}/${status}`), snapshot => {
      list.innerHTML = "";

      if (!snapshot.exists()) {
        list.innerHTML = "<p>No task 😎</p>";
        return;
      }

      snapshot.forEach(child => {
        const task = child.val();

        const div = document.createElement("div");
        div.className = "task";

        div.innerHTML = `
          <div id="view-${child.key}">
            <strong>${task.title}</strong>
            <p>📅 ${task.date || "-"}</p>
            <p>${getPriorityIcon(task.priority)} ${task.priority}</p>

            <div>
              <button onclick="showEdit('${status}','${child.key}')">✏️</button>
              ${status !== "todo" ? `<button onclick="moveTask('${status}','${child.key}','back')">⬅</button>` : ""}
              ${status !== "done" ? `<button onclick="moveTask('${status}','${child.key}','forward')">➡</button>` : ""}
              ${status === "done" ? `<button onclick="deleteTask('${status}','${child.key}')">❌</button>` : ""}
            </div>
          </div>

          <div id="edit-${child.key}" style="display:none;">
            <input id="editTitle-${child.key}" value="${task.title}">
            <input type="date" id="editDate-${child.key}" value="${task.date || ""}">

            <select id="editPriority-${child.key}">
              <option ${task.priority === "Low" ? "selected" : ""}>Low</option>
              <option ${task.priority === "Medium" ? "selected" : ""}>Medium</option>
              <option ${task.priority === "High" ? "selected" : ""}>High</option>
            </select>

            <button onclick="saveEdit('${status}','${child.key}')">Save</button>
            <button onclick="cancelEdit('${child.key}')">Cancel</button>
          </div>
        `;

        list.appendChild(div);
      });
    });
  });
}


// ❌ DELETE
window.deleteTask = (status, id) => {
  const user = auth.currentUser;
  remove(ref(db, `tasks/${user.uid}/${status}/${id}`));
};


// 🔄 MOVE
window.moveTask = (status, id, direction) => {
  const user = auth.currentUser;

  let next = direction === "forward"
    ? (status === "todo" ? "inprogress" : "done")
    : (status === "done" ? "inprogress" : "todo");

  const oldRef = ref(db, `tasks/${user.uid}/${status}/${id}`);
  const newRef = ref(db, `tasks/${user.uid}/${next}/${id}`);

  onValue(oldRef, snap => {
    set(newRef, snap.val());
    remove(oldRef);
  }, { onlyOnce: true });
};

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

  const title = document.getElementById(`editTitle-${id}`).value;
  const date = document.getElementById(`editDate-${id}`).value;
  const priority = document.getElementById(`editPriority-${id}`).value;

  if (!title.trim()) {
    alert("Title tidak boleh kosong");
    return;
  }

  update(ref(db, `tasks/${user.uid}/${status}/${id}`), {
    title,
    date,
    priority
  });
};

// ✏️ EDIT (UPDATE ALL)
window.editTask = (status, id) => {
  const user = auth.currentUser;

  const newTitle = prompt("Edit task title:");
  const newDate = prompt("Edit deadline (YYYY-MM-DD):");
  const newPriority = prompt("Priority (Low/Medium/High):");

  const updates = {};

  // hanya update kalau tidak kosong
  if (newTitle && newTitle.trim() !== "") {
    updates.title = newTitle;
  }

  if (newDate && newDate.trim() !== "") {
    updates.date = newDate;
  }

  if (newPriority && ["Low", "Medium", "High"].includes(newPriority)) {
    updates.priority = newPriority;
  }

  // kalau semua kosong → jangan update
  if (Object.keys(updates).length === 0) {
    alert("Tidak ada perubahan");
    return;
  }

  update(ref(db, `tasks/${user.uid}/${status}/${id}`), updates);
};


// 🎨 PRIORITY ICON
function getPriorityIcon(p) {
  if (p === "High") return "🔴";
  if (p === "Medium") return "🟡";
  return "🟢";
}