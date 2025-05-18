// js/script.js
document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('nav button');
    const tabContents = document.querySelectorAll('.tab-content');

    const newTaskTitleInput = document.getElementById('new-task-title');
    const newTaskBodyInput = document.getElementById('new-task-body');
    const prioritySelect = document.getElementById('priority');
    const dueDateInput = document.getElementById('due-date');
    const addButton = document.getElementById('add-button');
    const todoList = document.getElementById('todo-list');
    const filterButtons = document.querySelectorAll('.filter-controls button');

    // Set today's date as the default date
    dueDateInput.valueAsDate = new Date();
    
    let todos = loadTodos();
    let currentDate = getCurrentDate();
    
    // Initially render todos for today
    renderTodos(filterTodosByDate(todos, currentDate));

    tabs.forEach(tab => {
        tab.addEventListener('click', switchTab);
    });

    addButton.addEventListener('click', addTask);
    
    filterButtons.forEach(button => {
        button.addEventListener('click', filterTodos);
    });

    // Add event listener for date change
    dueDateInput.addEventListener('change', function() {
        currentDate = dueDateInput.value;
        renderTodos(filterTodosByDate(todos, currentDate));
    });

    function switchTab(event) {
        const tabId = event.target.dataset.tab;
        tabs.forEach(tab => tab.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));

        event.target.classList.add('active');
        document.getElementById(tabId).classList.add('active');

        if (tabId === 'calendar') {
            generateCalendar();
        } else if (tabId === 'daily-view') {
            populateWeekSelector();
            showDailyTasks();
        } else if (tabId === 'list') {
            renderTodos(filterTodosByDate(todos, currentDate));
        }
    }

    function loadTodos() {
        const storedTodos = localStorage.getItem('todos');
        return storedTodos ? JSON.parse(storedTodos) : [];
    }

    function saveTodos() {
        localStorage.setItem('todos', JSON.stringify(todos));
    }

    function filterTodosByDate(todosArray, date) {
        return todosArray.filter(todo => todo.dueDate === date);
    }

    function renderTodos(tasks) {
        todoList.innerHTML = '';
        
        if (tasks.length === 0) {
            const emptyMessage = document.createElement('li');
            emptyMessage.classList.add('empty-list');
            emptyMessage.textContent = 'No tasks for this day';
            todoList.appendChild(emptyMessage);
            return;
        }
        
        tasks.forEach((todo, index) => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <div class="task-details">
                    <span class="task-title">${todo.title}</span>
                    <span class="task-body">${todo.body}</span>
                    <span class="priority priority-${todo.priority}">${todo.priority} Priority</span>
                    ${todo.dueDate ? `<span class="due-date">Due: ${formatDate(todo.dueDate)}</span>` : ''}
                </div>
                <div class="actions">
                    <button class="complete-button" data-index="${index}">✓</button>
                    <button class="delete-button" data-index="${index}">×</button>
                </div>
            `;
            
            if (todo.completed) {
                listItem.classList.add('completed');
            }
            
            todoList.appendChild(listItem);
        });

        // Attach event listeners to the newly created buttons
        document.querySelectorAll('.delete-button').forEach(button => {
            button.addEventListener('click', deleteTask);
        });
        
        document.querySelectorAll('.complete-button').forEach(button => {
            button.addEventListener('click', toggleTaskCompletion);
        });
    }

    function addTask() {
        const taskTitle = newTaskTitleInput.value.trim();
        const taskBody = newTaskBodyInput.value.trim();
        const priority = prioritySelect.value;
        const dueDate = dueDateInput.value || getCurrentDate();

        if (taskTitle) {
            const newTodo = {
                title: taskTitle,
                body: taskBody,
                priority: priority,
                dueDate: dueDate,
                completed: false
            };
            todos.push(newTodo);
            saveTodos();
            
            // Update current date to the date of the new task
            currentDate = dueDate;
            
            // Re-render todos for this date
            renderTodos(filterTodosByDate(todos, currentDate));
            
            // Clear inputs
            newTaskTitleInput.value = '';
            newTaskBodyInput.value = '';
            // Keep the date as is for consistent UX
        }
    }

    function toggleTaskCompletion(event) {
        const tasks = filterTodosByDate(todos, currentDate);
        const indexToToggle = parseInt(event.target.dataset.index);
        
        if (indexToToggle >= 0 && indexToToggle < tasks.length) {
            const todoIndex = todos.findIndex(todo => 
                todo.title === tasks[indexToToggle].title && 
                todo.dueDate === tasks[indexToToggle].dueDate);
                
            if (todoIndex !== -1) {
                todos[todoIndex].completed = !todos[todoIndex].completed;
                saveTodos();
                renderTodos(filterTodosByDate(todos, currentDate));
            }
        }
    }

    function deleteTask(event) {
        const tasks = filterTodosByDate(todos, currentDate);
        const indexToDelete = parseInt(event.target.dataset.index);
        
        if (indexToDelete >= 0 && indexToDelete < tasks.length) {
            const todoIndex = todos.findIndex(todo => 
                todo.title === tasks[indexToDelete].title && 
                todo.dueDate === tasks[indexToDelete].dueDate);
                
            if (todoIndex !== -1) {
                todos.splice(todoIndex, 1);
                saveTodos();
                renderTodos(filterTodosByDate(todos, currentDate));
            }
        }
    }

    function filterTodos(event) {
        const filter = event.target.dataset.filter;
        document.querySelectorAll('.filter-controls button').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');

        let filteredTodos;
        if (filter === 'all') {
            filteredTodos = filterTodosByDate(todos, currentDate);
        } else {
            filteredTodos = todos.filter(todo => 
                todo.priority === filter && todo.dueDate === currentDate);
        }
        renderTodos(filteredTodos);
    }

    function getCurrentDate() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    }
});