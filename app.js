"use strict";

const byId = (id) => document.getElementById(id);
let role = null;

const api = window.taskLabDemo.request;

async function perform(action) {
  byId("message").textContent = "";
  try {
    await action();
  } catch (error) {
    byId("message").textContent = error.message;
  }
}

function taskRow(task) {
  const row = document.createElement("li");
  const label = document.createElement("label");
  const state = document.createElement("input");
  const title = document.createElement("span");
  const endpoint = "tasks/" + task.id;
  state.type = "checkbox";
  state.checked = task.done;
  state.disabled = role !== "editor";
  title.textContent = task.title;
  label.append(state, title);
  row.append(label);

  if (role === "editor") {
    state.addEventListener("change", () => perform(async () => {
      const done = state.checked;
      state.checked = task.done;
      state.disabled = true;
      try {
        await api(endpoint, "PUT", { title: task.title, done });
        await refreshTasks();
      } finally {
        state.disabled = false;
      }
    }));
    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "secondary";
    edit.textContent = "Изменить";
    edit.addEventListener("click", () => perform(async () => {
      const name = window.prompt("Название задачи", task.title);
      if (name === null) return;
      await api(endpoint, "PUT", { title: name, done: task.done });
      await refreshTasks();
    }));
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "secondary danger";
    remove.textContent = "Удалить";
    remove.addEventListener("click", () => perform(async () => {
      if (!window.confirm("Удалить эту задачу?")) return;
      await api(endpoint, "DELETE", {});
      await refreshTasks();
    }));
    row.append(edit, remove);
  }
  return row;
}

async function refreshTasks() {
  const tasks = await api("tasks");
  byId("tasks").replaceChildren(...tasks.map(taskRow));
  byId("empty").hidden = tasks.length !== 0;
}

async function showSession(nextRole) {
  role = nextRole;
  byId("auth").hidden = Boolean(role);
  byId("board").hidden = !role;
  byId("create").hidden = role !== "editor";
  if (role) {
    byId("role").textContent = role === "editor" ? "Редактор" : "Наблюдатель · только чтение";
    await refreshTasks();
  } else {
    byId("tasks").replaceChildren();
    byId("create").reset();
  }
}

document.querySelectorAll("[data-role]").forEach((button) => {
  button.addEventListener("click", () => perform(async () => {
    const session = await api("session", "POST", { role: button.dataset.role });
    await showSession(session.role);
  }));
});

byId("create").addEventListener("submit", (event) => {
  event.preventDefault();
  perform(async () => {
    await api("tasks", "POST", { title: byId("title").value, done: false });
    event.target.reset();
    await refreshTasks();
  });
});

byId("logout").addEventListener("click", () => perform(async () => {
  await api("session", "DELETE", {});
  await showSession(null);
}));

perform(async () => {
  byId("auth").hidden = false;
  await showSession((await api("session")).role);
});
