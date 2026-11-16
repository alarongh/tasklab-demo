"use strict";

(() => {
  const storageKey = "tasklab-browser-demo-v1";
  const roleKey = "tasklab-browser-demo-role";
  const initial = [
    { id: 1, title: "Подготовить конфигурацию кластера", done: true },
    { id: 2, title: "Проверить запуск конвейера", done: false },
    { id: 3, title: "Сверить версию на стенде", done: false },
  ];

  function load() {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : { tasks: initial, nextId: 4 };
  }

  function validate(data) {
    const title = data.title.trim();
    if (title.length < 1 || title.length > 120) {
      throw new Error("Название должно содержать от 1 до 120 символов.");
    }
    return { title, done: data.done };
  }

  async function request(path, method = "GET", data) {
    const role = sessionStorage.getItem(roleKey);
    if (path === "session") {
      if (method === "POST") {
        if (data.role !== "editor" && data.role !== "viewer") {
          throw new Error("Выберите роль.");
        }
        sessionStorage.setItem(roleKey, data.role);
        return { role: data.role };
      }
      if (method === "DELETE") {
        sessionStorage.removeItem(roleKey);
        return null;
      }
      return { role };
    }

    if (!role) throw new Error("Выберите роль для входа.");
    const state = load();
    if (path === "tasks" && method === "GET") return state.tasks;
    if (role !== "editor") throw new Error("Наблюдатель может только просматривать задачи.");

    if (path === "tasks" && method === "POST") {
      const task = { id: state.nextId++, ...validate(data) };
      state.tasks = [...state.tasks, task];
    } else {
      const index = state.tasks.findIndex((task) => path === "tasks/" + task.id);
      if (index < 0) throw new Error("Задача не найдена.");
      if (method === "PUT") {
        state.tasks[index] = { id: state.tasks[index].id, ...validate(data) };
      } else if (method === "DELETE") {
        state.tasks.splice(index, 1);
      } else {
        throw new Error("Неизвестное действие.");
      }
    }

    localStorage.setItem(storageKey, JSON.stringify(state));
    return null;
  }

  window.taskLabDemo = { request };
})();
