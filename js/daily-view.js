// js/daily-view.js
document.addEventListener('DOMContentLoaded', () => {
    const weekSelector = document.getElementById('week-selector');
    const dayTasksContainer = document.querySelector('.day-tasks');

    populateWeekSelector();
    
    // If daily-view is active on page load, show the tasks
    if (document.getElementById('daily-view').classList.contains('active')) {
        showDailyTasks();
    }

    weekSelector.addEventListener('change', showDailyTasks);
    
    // Also show tasks when the tab is clicked
    document.querySelector('button[data-tab="daily-view"]').addEventListener('click', () => {
        populateWeekSelector();
        showDailyTasks();
    });

    function populateWeekSelector() {
        weekSelector.innerHTML = '';
        const today = new Date();
        const currentDayOfWeek = today.getDay(); // 0 (Sunday) to 6 (Saturday)
        const diff = today.getDate() - currentDayOfWeek + (currentDayOfWeek === 0 ? -6 : 1); // Adjust to Monday as start

        // Create options for current week and the next 3 weeks
        for (let i = 0; i < 4; i++) {
            const startOfWeek = new Date(today);
            startOfWeek.setDate(diff + (i * 7));
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);

            const startDateFormatted = startOfWeek.toLocaleDateString();
            const endDateFormatted = endOfWeek.toLocaleDateString();
            const option = document.createElement('option');
            option.value = formatDateForStorage(startOfWeek);
            option.textContent = `${startDateFormatted} - ${endDateFormatted}`;
            weekSelector.appendChild(option);

            // Select current week initially
            if (i === 0) {
                option.selected = true;
            }
        }
    }

    function showDailyTasks() {
        dayTasksContainer.innerHTML = '';
        const selectedWeekStart = new Date(weekSelector.value);
        
        // Create a container for each day of the week
        for (let i = 0; i < 7; i++) {
            const currentDate = new Date(selectedWeekStart);
            currentDate.setDate(selectedWeekStart.getDate() + i);
            const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
            const formattedDate = formatDateForStorage(currentDate);
            const tasksForDay = getTasksForDate(formattedDate);

            // Create day container
            const dayDiv = document.createElement('div');
            dayDiv.classList.add('day-container');
            
            // Add header with date info
            const isToday = checkIfToday(currentDate);
            dayDiv.innerHTML = `
                <h3>
                    ${dayName} (${currentDate.toLocaleDateString()})
                    ${isToday ? '<span class="today-marker">Today</span>' : ''}
                </h3>
            `;
            
            // Add tasks or show message if none
            if (tasksForDay.length > 0) {
                const taskList = document.createElement('ul');
                tasksForDay.forEach(task => {
                    const listItem = document.createElement('li');
                    listItem.className = task.completed ? 'completed' : '';
                    
                    listItem.innerHTML = `
                        <div class="task-info">
                            <span class="task-title">${task.title || task.text}</span>
                            ${task.body ? `<span class="task-body">${task.body}</span>` : ''}
                            <span class="priority-${task.priority}">${task.priority}</span>
                        </div>
                        <div class="task-actions">
                            <button class="task-toggle" data-date="${formattedDate}" data-id="${getTaskId(task)}">
                                ${task.completed ? '↩' : '✓'}
                            </button>
                        </div>
                    `;
                    taskList.appendChild(listItem);
                });
                dayDiv.appendChild(taskList);
                
                // Add quick add task input
                const quickAddForm = document.createElement('div');
                quickAddForm.classList.add('quick-add-form');
                quickAddForm.innerHTML = `
                    <input type="text" placeholder="Quick add task..." class="quick-add-input" data-date="${formattedDate}">
                    <button class="quick-add-btn" data-date="${formattedDate}">+</button>
                `;
                dayDiv.appendChild(quickAddForm);
            } else {
                dayDiv.innerHTML += `
                    <p class="no-tasks">No tasks for this day.</p>
                    <div class="quick-add-form">
                        <input type="text" placeholder="Quick add task..." class="quick-add-input" data-date="${formattedDate}">
                        <button class="quick-add-btn" data-date="${formattedDate}">+</button>
                    </div>
                `;
            }

            dayTasksContainer.appendChild(dayDiv);
        }
        
        // Add event listeners to the newly created buttons
        attachDailyViewEventListeners();
    }
    
    function attachDailyViewEventListeners() {
        // Toggle task completion status
        document.querySelectorAll('.task-toggle').forEach(button => {
            button.addEventListener('click', function() {
                const taskDate = this.dataset.date;
                const taskId = this.dataset.id;
                toggleTaskCompletionById(taskId, taskDate);
            });
        });
        
        // Quick add task buttons
        document.querySelectorAll('.quick-add-btn').forEach(button => {
            button.addEventListener('click', function() {
                const taskDate = this.dataset.date;
                const inputField = document.querySelector(`.quick-add-input[data-date="${taskDate}"]`);
                quickAddTask(taskDate, inputField);
            });
        });
        
        // Quick add on Enter key
        document.querySelectorAll('.quick-add-input').forEach(input => {
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    const taskDate = this.dataset.date;
                    quickAddTask(taskDate, this);
                }
            });
        });
    }
    
    function quickAddTask(date, inputField) {
        const taskText = inputField.value.trim();
        
        if (taskText) {
            const newTask = {
                title: taskText,
                body: '',
                priority: 'medium', // Default priority
                dueDate: date,
                completed: false,
                id: generateTaskId()
            };
            
            const todos = JSON.parse(localStorage.getItem('todos')) || [];
            todos.push(newTask);
            localStorage.setItem('todos', JSON.stringify(todos));
            
            // Clear the input
            inputField.value = '';
            
            // Refresh the display
            showDailyTasks();
        }
    }
    
    function toggleTaskCompletionById(taskId, date) {
        const todos = JSON.parse(localStorage.getItem('todos')) || [];
        const taskIndex = todos.findIndex(task => getTaskId(task) === taskId && task.dueDate === date);
        
        if (taskIndex !== -1) {
            todos[taskIndex].completed = !todos[taskIndex].completed;
            localStorage.setItem('todos', JSON.stringify(todos));
            showDailyTasks();
        }
    }
    
    function getTaskId(task) {
        // If task has an ID, use it, otherwise generate one from task properties
        if (task.id) return task.id;
        return `${task.title || task.text}-${task.dueDate}`;
    }
    
    function generateTaskId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }
    
    function checkIfToday(date) {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    }

    function getTasksForDate(dateString) {
        const todos = JSON.parse(localStorage.getItem('todos')) || [];
        return todos.filter(todo => todo.dueDate === dateString);
    }
    
    function formatDateForStorage(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
});