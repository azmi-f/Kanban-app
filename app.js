// DATA LOCAL
let data = JSON.parse(localStorage.getItem("kanban")) || {
  todo: [],
  inprogress: [],
  done: []
};

// SIMPAN KE LOCALSTORAGE
function saveData() {
  localStorage.setItem("kanban", JSON.stringify(data));
}

// RENDER UI
function render() {
  ["todo", "inprogress", "done"].forEach(status => {
    const list = document.getElementById(status + "List");
    list.innerHTML = "";

    data[status].forEach((task, index) => {
      const div = document.createElement("div");
      div.className = "task";

    div.innerHTML = `
        <strong>${task}</strong>
        <div style="margin-top:8px;">
            ${status !== "todo" ? `<button onclick="moveTask('${status}', ${index}, 'back')">⬅</button>` : ""}
            ${status !== "done" ? `<button onclick="moveTask('${status}', ${index}, 'forward')">➡</button>` : ""}
            <button onclick="deleteTask('${status}', ${index})">❌</button>
        </div>
    `;

      list.appendChild(div);
    });
  });
}

// TAMBAH TASK
window.addTask = (status) => {
  const input = document.getElementById(status + "Input");
  if (!input.value) return;

  data[status].push(input.value);
  input.value = "";

  saveData();
  render();
};

// HAPUS TASK
window.deleteTask = (status, index) => {
  data[status].splice(index, 1);
  saveData();
  render();
};

// PINDAH TASK
window.moveTask = (status, index, direction = "forward") => {
  let next;

  if (direction === "forward") {
    next =
      status === "todo"
        ? "inprogress"
        : status === "inprogress"
        ? "done"
        : "done";
  } else {
    next =
      status === "done"
        ? "inprogress"
        : status === "inprogress"
        ? "todo"
        : "todo";
  }

  const task = data[status][index];
  data[status].splice(index, 1);
  data[next].push(task);

  saveData();
  render();
};

// INIT
render();