import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-analytics.js";
import { getDatabase, ref, set, push, remove, update, onValue } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCk3b-zqvTDDepEjiTDcW2YPRzySaxUlgI",
  authDomain: "vabe-coding.firebaseapp.com",
  projectId: "vabe-coding",
  storageBucket: "vabe-coding.firebasestorage.app",
  messagingSenderId: "914440644026",
  appId: "1:914440644026:web:fb21809372bfb5d667e983",
  databaseURL: "https://vabe-coding-default-rtdb.firebaseio.com/",
  measurementId: "G-SEWKYSBE1Z"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const database = getDatabase(app);

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const dateElement = document.getElementById('current-date');
  const todoInput = document.getElementById('todo-input');
  const addBtn = document.getElementById('add-btn');
  const todoList = document.getElementById('todo-list');
  const emptyState = document.getElementById('empty-state');
  const filterBtns = document.querySelectorAll('.filter-btn');

  // State
  let todos = [];
  let currentFilter = 'all';

  // Initialize
  setFormattedDate();

  // Reference to 'todos' in Firebase
  const todosRef = ref(database, 'todos');

  // Listen for real-time changes
  onValue(todosRef, (snapshot) => {
    const data = snapshot.val();
    todos = [];
    if (data) {
      // Convert Firebase object to array
      for (const key in data) {
        todos.push({
          id: key,
          ...data[key]
        });
      }
      // Sort by creation time (descending)
      todos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    renderTodos();
  });

  // Set Current Date
  function setFormattedDate() {
    const options = { weekday: 'long', month: 'short', day: 'numeric' };
    const today = new Date();
    dateElement.textContent = today.toLocaleDateString('en-US', options);
  }

  // Add Task to Firebase
  function addTask() {
    const text = todoInput.value.trim();
    if (!text) return;

    // Push generates a unique key
    const newTodoRef = push(todosRef);
    set(newTodoRef, {
      text,
      completed: false,
      createdAt: new Date().toISOString()
    });

    todoInput.value = '';

    // Switch to 'all' or 'pending' view if we are on 'completed' view
    if (currentFilter === 'completed') {
      currentFilter = 'all';
      updateFilterUI();
    }
  }

  // Toggle Completed in Firebase
  function toggleTodo(id) {
    const todoRef = ref(database, 'todos/' + id);
    const todo = todos.find(t => t.id === id);
    if (todo) {
      update(todoRef, { completed: !todo.completed });
    }
  }

  // Delete Task in Firebase
  function deleteTodo(id, element) {
    // Add fade-out animation classes
    element.classList.add('fade-out');

    // Wait for animation to finish before removing from DB
    setTimeout(() => {
      const todoRef = ref(database, 'todos/' + id);
      remove(todoRef);
    }, 300);
  }

  // Edit Task in Firebase
  function startEdit(id, element, currentText) {
    const textContainer = element.querySelector('.todo-text');
    textContainer.style.display = 'none';

    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentText;
    input.className = 'edit-input';

    element.insertBefore(input, element.querySelector('.actions'));
    input.focus();

    // Handle saving edit
    const finishEdit = () => {
      const newText = input.value.trim();
      if (newText && newText !== currentText) {
        const todoRef = ref(database, 'todos/' + id);
        update(todoRef, { text: newText });
      } else {
        renderTodos(); // Re-render to revert input UI if text is empty/unchanged
      }
    };

    input.addEventListener('blur', finishEdit);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') finishEdit();
    });
  }

  // Filter Tasks
  function setFilter(filterType) {
    currentFilter = filterType;
    updateFilterUI();
    renderTodos();
  }

  function updateFilterUI() {
    filterBtns.forEach(btn => {
      if (btn.dataset.filter === currentFilter) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  // Render List
  function renderTodos() {
    todoList.innerHTML = '';

    let filteredTodos = todos;
    if (currentFilter === 'pending') {
      filteredTodos = todos.filter(t => !t.completed);
    } else if (currentFilter === 'completed') {
      filteredTodos = todos.filter(t => t.completed);
    }

    if (filteredTodos.length === 0) {
      emptyState.style.display = 'flex';
    } else {
      emptyState.style.display = 'none';

      filteredTodos.forEach(todo => {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        li.dataset.id = todo.id;

        li.innerHTML = `
          <label class="checkbox-container">
            <input type="checkbox" ${todo.completed ? 'checked' : ''}>
            <span class="checkmark"></span>
          </label>
          <div class="todo-text">${escapeHTML(todo.text)}</div>
          <div class="actions">
            <button class="action-btn edit-btn" aria-label="Edit">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button class="action-btn delete-btn" aria-label="Delete">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        `;

        // Event Listeners for the item
        const checkbox = li.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', () => toggleTodo(todo.id));

        const editBtn = li.querySelector('.edit-btn');
        editBtn.addEventListener('click', () => startEdit(todo.id, li, todo.text));

        const deleteBtn = li.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => deleteTodo(todo.id, li));

        todoList.appendChild(li);
      });
    }
  }

  // Utility to prevent XSS
  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Global Event Listeners
  addBtn.addEventListener('click', addTask);
  todoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
  });

  filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      setFilter(e.target.dataset.filter);
    });
  });

});
