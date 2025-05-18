// js/calendar.js
let currentMonth = new Date();
let openModalDate = null;

function generateCalendar() {
    const calendarGrid = document.querySelector('.calendar-grid');
    const currentMonthElement = document.getElementById('current-month');
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 (Sunday) to 6 (Saturday)

    calendarGrid.innerHTML = '';
    currentMonthElement.textContent = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

    // Add day of week headers
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    daysOfWeek.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.classList.add('day-header');
        dayHeader.textContent = day;
        calendarGrid.appendChild(dayHeader);
    });

    let dayCounter = 1;
    for (let i = 0; i < 6; i++) { // Up to 6 rows to cover all months
        for (let j = 0; j < 7; j++) {
            const dayCell = document.createElement('div');
            dayCell.classList.add('day');

            if (i === 0 && j < startDayOfWeek) {
                const prevMonthLastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0).getDate();
                dayCell.textContent = prevMonthLastDay - startDayOfWeek + j + 1;
                dayCell.classList.add('other-month');
            } else if (dayCounter <= daysInMonth) {
                // Fix: Use the correct date format
                const currentDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dayCounter);
                const formattedDate = formatDateForStorage(currentDate);
                
                dayCell.textContent = dayCounter;
                dayCell.dataset.date = formattedDate; // Store date for filtering

                if (isToday(currentDate)) {
                    dayCell.classList.add('today');
                }

                const tasksForDay = getTasksForDate(formattedDate);
                if (tasksForDay.length > 0) {
                    const taskContainer = document.createElement('div');
                    taskContainer.classList.add('task-indicators');
                    
                    // Group tasks by priority for more organized indicators
                    const priorityGroups = {
                        high: tasksForDay.filter(task => task.priority === 'high'),
                        medium: tasksForDay.filter(task => task.priority === 'medium'),
                        low: tasksForDay.filter(task => task.priority === 'low')
                    };
                    
                    Object.keys(priorityGroups).forEach(priority => {
                        if (priorityGroups[priority].length > 0) {
                            const indicator = document.createElement('span');
                            indicator.classList.add('task-indicator', priority);
                            indicator.textContent = priorityGroups[priority].length;
                            taskContainer.appendChild(indicator);
                        }
                    });
                    
                    dayCell.appendChild(taskContainer);
                }
                
                dayCell.addEventListener('click', () => openTaskModal(formattedDate));
                dayCounter++;
            } else {
                dayCell.textContent = dayCounter - daysInMonth;
                dayCell.classList.add('other-month');
                dayCounter++;
            }
            calendarGrid.appendChild(dayCell);
        }
        if (dayCounter > daysInMonth) break;
    }

    // Remove old event listeners before adding new ones
    const prevButton = document.getElementById('prev-month');
    const nextButton = document.getElementById('next-month');
    
    const newPrevButton = prevButton.cloneNode(true);
    const newNextButton = nextButton.cloneNode(true);
    
    prevButton.parentNode.replaceChild(newPrevButton, prevButton);
    nextButton.parentNode.replaceChild(newNextButton, nextButton);
    
    newPrevButton.addEventListener('click', goToPreviousMonth);
    newNextButton.addEventListener('click', goToNextMonth);
}

function formatDateForStorage(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function goToPreviousMonth() {
    currentMonth.setMonth(currentMonth.getMonth() - 1);
    generateCalendar();
}

function goToNextMonth() {
    currentMonth.setMonth(currentMonth.getMonth() + 1);
    generateCalendar();
}

function isToday(date) {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
}

function getTasksForDate(dateString) {
    const todos = JSON.parse(localStorage.getItem('todos')) || [];
    return todos.filter(todo => todo.dueDate === dateString);
}

function openTaskModal(selectedDate) {
    if (!selectedDate) return;
    openModalDate = selectedDate;
    
    const formattedDateForDisplay = new Date(selectedDate).toLocaleDateString();

    // Check if a modal already exists and remove it
    const existingModal = document.querySelector('.task-modal');
    if (existingModal) {
        existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.classList.add('task-modal');
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-button">&times;</span>
            <h3>Tasks for ${formattedDateForDisplay}</h3>
            <div class="modal-add-task">
                <input type="text" id="modal-new-task-title" placeholder="Add new task title...">
                <input type="text" id="modal-new-task-body" placeholder="Add task description...">
                <div class="modal-controls">
                    <select id="modal-priority">
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                    </select>
                    <button id="modal-add-button">Add Task</button>
                </div>
            </div>
            <div class="modal-filter">
                <button data-modal-filter="all" class="active">All</button>
                <button data-modal-filter="low">Low</button>
                <button data-modal-filter="medium">Medium</button>
                <button data-modal-filter="high">High</button>
            </div>
            <ul class="modal-task-list"></ul>
        </div>
    `;
    document.body.appendChild(modal);
    renderModalTasks(selectedDate, 'all');

    const closeButton = modal.querySelector('.close-button');
    closeButton.addEventListener('click', () => {
        modal.remove();
        openModalDate = null;
    });

    // Close modal when clicking outside
    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.remove();
            openModalDate = null;
        }
    });

    const filterButtons = modal.querySelectorAll('.modal-filter button');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            renderModalTasks(selectedDate, this.dataset.modalFilter);
        });
    });

    const modalAddButton = modal.querySelector('#modal-add-button');
    modalAddButton.addEventListener('click', addNewTaskToDate);
}

function renderModalTasks(date, priorityFilter) {
    const modalTaskList = document.querySelector('.modal-task-list');
    modalTaskList.innerHTML = '';
    
    const tasks = getTasksForDate(date);
    const filteredTasks = priorityFilter === 'all' ? tasks : tasks.filter(task => task.priority === priorityFilter);

    if (filteredTasks.length > 0) {
        filteredTasks.forEach((task, index) => {
            const listItem = document.createElement('li');
            listItem.className = task.completed ? 'completed' : '';
            listItem.innerHTML = `
                <div class="task-details">
                    <span class="task-title">${task.title || task.text}</span>
                    ${task.body ? `<span class="task-body">${task.body}</span>` : ''}
                    <span class="priority priority-${task.priority}">${task.priority}</span>
                </div>
                <div class="task-actions">
                    <button class="modal-complete-btn" data-index="${index}">✓</button>
                    <button class="modal-delete-btn" data-index="${index}">×</button>
                </div>
            `;
            modalTaskList.appendChild(listItem);
        });
        
        // Add event listeners
        document.querySelectorAll('.modal-delete-btn').forEach(button => {
            button.addEventListener('click', function() {
                deleteTaskFromModal(parseInt(this.dataset.index), date, priorityFilter);
            });
        });
        
        document.querySelectorAll('.modal-complete-btn').forEach(button => {
            button.addEventListener('click', function() {
                toggleTaskCompletionFromModal(parseInt(this.dataset.index), date, priorityFilter);
            });
        });
    } else {
        modalTaskList.innerHTML = '<p class="no-tasks">No tasks for this priority.</p>';
    }
}

function toggleTaskCompletionFromModal(index, date, priorityFilter) {
    const todos = JSON.parse(localStorage.getItem('todos')) || [];
    const tasks = priorityFilter === 'all' 
        ? todos.filter(todo => todo.dueDate === date)
        : todos.filter(todo => todo.dueDate === date && todo.priority === priorityFilter);
    
    if (index >= 0 && index < tasks.length) {
        const task = tasks[index];
        const todoIndex = todos.findIndex(todo => 
            (todo.title === task.title || todo.text === task.text) && 
            todo.dueDate === task.dueDate);
            
        if (todoIndex !== -1) {
            todos[todoIndex].completed = !todos[todoIndex].completed;
            localStorage.setItem('todos', JSON.stringify(todos));
            renderModalTasks(date, priorityFilter);
            generateCalendar(); // Re-render calendar to update indicators
        }
    }
}

function deleteTaskFromModal(index, date, priorityFilter) {
    const todos = JSON.parse(localStorage.getItem('todos')) || [];
    const tasks = priorityFilter === 'all' 
        ? todos.filter(todo => todo.dueDate === date)
        : todos.filter(todo => todo.dueDate === date && todo.priority === priorityFilter);
    
    if (index >= 0 && index < tasks.length) {
        const task = tasks[index];
        const todoIndex = todos.findIndex(todo => 
            (todo.title === task.title || todo.text === task.text) && 
            todo.dueDate === task.dueDate);
            
        if (todoIndex !== -1) {
            todos.splice(todoIndex, 1);
            localStorage.setItem('todos', JSON.stringify(todos));
            renderModalTasks(date, priorityFilter);
            generateCalendar(); // Re-render calendar to update indicators
        }
    }
}

function addNewTaskToDate() {
    if (!openModalDate) return;
    
    const taskTitleInput = document.getElementById('modal-new-task-title');
    const taskBodyInput = document.getElementById('modal-new-task-body');
    const prioritySelect = document.getElementById('modal-priority');
    
    const taskTitle = taskTitleInput.value.trim();
    const taskBody = taskBodyInput.value.trim();
    const priority = prioritySelect.value;

    if (taskTitle) {
        const newTodo = {
            title: taskTitle,
            body: taskBody,
            priority: priority,
            dueDate: openModalDate,
            completed: false
        };
        
        const todos = JSON.parse(localStorage.getItem('todos')) || [];
        todos.push(newTodo);
        localStorage.setItem('todos', JSON.stringify(todos));
        
        // Re-render tasks in modal
        renderModalTasks(openModalDate, document.querySelector('.modal-filter button.active').dataset.modalFilter);
        
        // Re-render calendar to show updated indicators
        generateCalendar();
        
        // Clear inputs
        taskTitleInput.value = '';
        taskBodyInput.value = '';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('calendar').classList.contains('active')) {
        generateCalendar();
    }
    
    // Ensure calendar is generated when tab is clicked
    document.querySelector('button[data-tab="calendar"]').addEventListener('click', generateCalendar);
});