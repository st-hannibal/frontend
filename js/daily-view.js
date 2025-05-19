// js/daily-view.js

function initializeDailyView() {
    const weekSelector = document.getElementById('week-selector');
    const dailyViewTabButton = document.querySelector('button[data-tab="daily-view"]');

    if (!weekSelector || !dailyViewTabButton) {
        // console.warn('Daily view elements not found. Skipping daily view initialization.');
        return;
    }

    // Initial population and rendering if the tab is active
    // script.js handles calling this on tab switch
    populateWeekSelectorForDailyView();
    showDailyTasks();

    // Event listeners (ensure they are not duplicated)
    if (!weekSelector.dataset.listenerAttached) {
        weekSelector.addEventListener('change', showDailyTasks);
        weekSelector.dataset.listenerAttached = 'true';
    }

    // The tab button listener in script.js handles re-initialization,
    // so we don't need a separate one here for the tab click itself
    // if it already calls initializeDailyView or similar.
}

function populateWeekSelectorForDailyView() {
    const weekSelector = document.getElementById('week-selector');
    if (!weekSelector) return;
    weekSelector.innerHTML = ''; // Clear existing options

    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0 (Sunday) to 6 (Saturday)

    // Adjust to make Monday the start of the week (day 1)
    // If Sunday (0), go back 6 days. If Monday (1), go back 0 days. If Tuesday (2), go back 1 day.
    const diffToMonday = (currentDayOfWeek === 0) ? -6 : 1 - currentDayOfWeek;

    for (let i = 0; i < 4; i++) { // Current week and next 3 weeks
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() + diffToMonday + (i * 7));
        startOfWeek.setHours(0, 0, 0, 0); // Normalize to start of the day

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999); // Normalize to end of the day

        const option = document.createElement('option');
        option.value = window.getGlobalFormattedDate(startOfWeek); // YYYY-MM-DD of week start
        option.textContent = `${window.formatGlobalDisplayDate(window.getGlobalFormattedDate(startOfWeek))} - ${window.formatGlobalDisplayDate(window.getGlobalFormattedDate(endOfWeek))}`;

        if (i === 0) { // Select current week by default
            option.selected = true;
        }
        weekSelector.appendChild(option);
    }
}


function showDailyTasks() {
    const dayTasksContainer = document.querySelector('.day-tasks');
    const weekSelector = document.getElementById('week-selector');

    if (!dayTasksContainer || !weekSelector || !weekSelector.value) {
        // console.warn('Daily tasks container or week selector not found or no week selected.');
        if (dayTasksContainer) dayTasksContainer.innerHTML = '<p class="no-tasks">Select a week to view tasks.</p>';
        return;
    }
    dayTasksContainer.innerHTML = '';

    const selectedWeekStartDate = new Date(weekSelector.value + 'T00:00:00'); // Ensure it's parsed as local

    for (let i = 0; i < 7; i++) { // Iterate through 7 days of the week
        const currentDate = new Date(selectedWeekStartDate);
        currentDate.setDate(selectedWeekStartDate.getDate() + i);
        const formattedDate = window.getGlobalFormattedDate(currentDate); // YYYY-MM-DD

        const dayDiv = document.createElement('div');
        dayDiv.classList.add('day-container');

        const dayName = currentDate.toLocaleDateString(undefined, { weekday: 'long' });
        const isTodayMarker = isDailyViewToday(currentDate) ? '<span class="today-marker">Today</span>' : '';

        dayDiv.innerHTML = `<h3>${dayName} (${window.formatGlobalDisplayDate(formattedDate)}) ${isTodayMarker}</h3>`;

        const tasksForDay = getTasksForDailyViewDate(formattedDate);
        const taskListUL = document.createElement('ul');

        if (tasksForDay.length > 0) {
            tasksForDay.sort((a,b) => (a.status === 'done' ? 1 : -1) - (b.status === 'done' ? 1 : -1) || (new Date(a.dueDate + 'T' + (a.time || '00:00')) - new Date(b.dueDate + 'T' + (b.time || '00:00')))); // Sort by status then time
            tasksForDay.forEach(task => {
                const listItem = document.createElement('li');
                listItem.className = `status-${task.status}`;
                listItem.dataset.id = task.id;

                listItem.innerHTML = `
                    <div class="task-info">
                        <span class="task-title">${task.title}</span>
                        ${task.body ? `<p class="task-body">${task.body.replace(/\n/g, '<br>')}</p>` : ''}
                        <div>
                            <span class="priority-badge priority-${task.priority}">${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}</span>
                            <span class="status-badge status-${task.status}">${task.status.charAt(0).toUpperCase() + task.status.slice(1)}</span>
                        </div>
                    </div>
                    <div class="actions">
                        <button class="edit-button-daily" title="Edit"><i class="fa-solid fa-pencil"></i></button>
                        <button class="toggle-status-button-daily" title="${task.status === 'done' ? 'Mark Incomplete' : 'Mark Complete'}">
                            ${task.status === 'done' ? '<i class="fa-solid fa-rotate-left"></i>' : '<i class="fa-solid fa-check"></i>'}
                        </button>
                    </div>
                `;
                listItem.querySelector('.edit-button-daily').addEventListener('click', () => window.openGlobalTaskModal(task, 'daily-view'));
                listItem.querySelector('.toggle-status-button-daily').addEventListener('click', () => toggleDailyViewTaskStatus(task.id));
                taskListUL.appendChild(listItem);
            });
        } else {
            taskListUL.innerHTML = '<li class="no-tasks">No tasks for this day.</li>';
        }
        dayDiv.appendChild(taskListUL);

        // Quick Add Form for each day
        const quickAddFormDiv = document.createElement('div');
        quickAddFormDiv.className = 'quick-add-form';
        quickAddFormDiv.innerHTML = `
            <input type="text" class="quick-add-input" placeholder="Quick add task..." data-date="${formattedDate}">
            <button class="quick-add-btn btn-primary" data-date="${formattedDate}">+</button>
        `;
        quickAddFormDiv.querySelector('.quick-add-btn').addEventListener('click', handleQuickAddDaily);
        quickAddFormDiv.querySelector('.quick-add-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleQuickAddDaily(e, quickAddFormDiv.querySelector('.quick-add-input'));
            }
        });
        dayDiv.appendChild(quickAddFormDiv);
        dayTasksContainer.appendChild(dayDiv);
    }
}

function handleQuickAddDaily(event, inputField = null) {
    const target = inputField || event.target.previousElementSibling; // If button clicked, get sibling input
    const taskDate = target.dataset.date;
    const taskTitle = target.value.trim();

    if (taskTitle && taskDate) {
        const newTask = {
            id: generateId(), // from storage.js or script.js
            title: taskTitle,
            body: '',
            priority: 'medium', // Default for quick add
            status: 'todo',     // Default status
            dueDate: taskDate,
            subtasks: []
        };
        window.todos.push(newTask);
        saveTasksToStorage(window.todos); // from storage.js
        window.renderAllAppViews(); // from script.js
        target.value = ''; // Clear input
    }
}

function toggleDailyViewTaskStatus(taskId) {
    const taskIndex = window.todos.findIndex(t => t.id === taskId);
    if (taskIndex > -1) {
        const task = window.todos[taskIndex];
        if (task.status === 'done') {
            task.status = 'inprogress'; // Or 'todo'
        } else {
            task.status = 'done';
        }
        saveTasksToStorage(window.todos);
        window.renderAllAppViews();
    }
}

function getTasksForDailyViewDate(dateString) { // dateString is YYYY-MM-DD
    if (!window.todos) return [];
    return window.todos.filter(task => task.dueDate === dateString);
}

function isDailyViewToday(date) {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
}

// Make initialization function global if script.js needs to call it when tab becomes active.
window.initializeDailyView = initializeDailyView;
window.populateWeekSelectorGlobal = populateWeekSelectorForDailyView; // If script.js needs to call it
window.showDailyTasks = showDailyTasks; // Expose for script.js to call if needed

// The main script.js now handles initial call based on active tab.
document.addEventListener('DOMContentLoaded', () => {
    // Delegate initial call to script.js, but ensure functions are ready
    // Example: if (document.getElementById('daily-view')?.classList.contains('active')) {
    //    initializeDailyView();
    // }
});