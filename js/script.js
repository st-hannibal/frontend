// js/script.js

document.addEventListener('DOMContentLoaded', () => {
    // Global task array
    window.todos = loadTasksFromStorage();

    // DOM Elements
    const tabs = document.querySelectorAll('nav button[data-tab]');
    const tabContents = document.querySelectorAll('.tab-content');
    const themeSwitcherButton = document.getElementById('theme-switcher');
    const currentYearSpan = document.getElementById('current-year');

    // Modal Elements (Shared)
    const taskModal = document.getElementById('task-modal');
    const taskForm = document.getElementById('task-form');
    const modalTitle = document.getElementById('modal-title');
    const closeButtonModal = taskModal.querySelector('.close-modal-btn');
    const cancelButtonModal = taskModal.querySelector('.cancel-modal-btn');
    const taskIdInput = document.getElementById('task-id');
    const modalTaskTitleInput = document.getElementById('modal-task-title');
    const modalTaskDescriptionInput = document.getElementById('modal-task-description');
    const modalTaskPrioritySelect = document.getElementById('modal-task-priority');
    const modalTaskDueDateInput = document.getElementById('modal-task-due-date');
    const modalTaskStatusSelect = document.getElementById('modal-task-status');
    const modalSubtasksContainer = document.getElementById('modal-subtasks-container');
    const modalAddSubtaskButton = document.getElementById('modal-add-subtask-btn');

    // List View Specific Elements
    const listAddTaskButton = document.getElementById('add-button-list');
    const listNewTaskTitleInput = document.getElementById('new-task-title');
    const listNewTaskBodyInput = document.getElementById('new-task-body');
    const listPrioritySelect = document.getElementById('priority');
    const listStatusSelect = document.getElementById('status');
    const listDueDateInput = document.getElementById('due-date');
    const todoListUL = document.getElementById('todo-list');
    const listFilterPriorityButtons = document.querySelectorAll('.list-filter-controls button[data-filter]');
    const listFilterStatusButtons = document.querySelectorAll('.list-filter-controls button[data-status-filter]');


    let currentEditTaskId = null; // To keep track of editing task for the modal
    let currentListDate = getFormattedLocalDate(new Date()); // For List view date context
    let currentListPriorityFilter = 'all';
    let currentListStatusFilter = 'all-status';

    // --- Initialization ---
    function initialize() {
        setupEventListeners();
        loadTheme();
        updateCurrentYear();
        setDefaultDates();
        renderAllViews(); // Initial render of all views
        switchTab(tabs[0].dataset.tab); // Activate the first tab
    }

    function setDefaultDates() {
        const today = getFormattedLocalDate(new Date());
        if (listDueDateInput) listDueDateInput.value = today;
        if (modalTaskDueDateInput) modalTaskDueDateInput.value = today;
    }

    function updateCurrentYear() {
        if (currentYearSpan) {
            currentYearSpan.textContent = new Date().getFullYear();
        }
    }

    // --- Theme Switching ---
    function loadTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.body.setAttribute('data-theme', savedTheme);
        themeSwitcherButton.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
    }

    function toggleTheme() {
        const currentTheme = document.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        themeSwitcherButton.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    }

    // --- Tab Switching ---
    function switchTab(tabId) {
        tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabId);
        });
        tabContents.forEach(content => {
            content.classList.toggle('active', content.id === tabId);
        });

        // Call specific render/init functions for the activated tab
        if (tabId === 'list') {
            renderListView();
        } else if (tabId === 'calendar' && typeof generateCalendar === 'function') {
            generateCalendar();
        } else if (tabId === 'daily-view' && typeof initializeDailyView === 'function') {
            initializeDailyView(); // Or a specific render function
        } else if (tabId === 'kanban' && typeof initializeKanban === 'function') {
            initializeKanban(); // Or a specific render function
        }
    }

    // --- Shared Task Modal Logic ---
    function openTaskModal(task = null, source = 'list') { // source can be 'list', 'kanban', or 'calendar'
        taskForm.reset();
        modalSubtasksContainer.innerHTML = ''; // Clear previous subtasks

        if (task && task.id) { // Editing existing task
            modalTitle.textContent = 'Edit Task';
            taskIdInput.value = task.id;
            currentEditTaskId = task.id; // Keep track for saving
            modalTaskTitleInput.value = task.title;
            modalTaskDescriptionInput.value = task.body || '';
            modalTaskPrioritySelect.value = task.priority;
            modalTaskDueDateInput.value = task.dueDate || getFormattedLocalDate(new Date());
            modalTaskStatusSelect.value = task.status;

            if (task.subtasks && task.subtasks.length > 0) {
                task.subtasks.forEach(subtask => addSubtaskToModal(subtask.text, subtask.completed));
            }
        } else { // Adding new task or opening modal for a specific date (e.g., from calendar)
            modalTitle.textContent = 'Add New Task';
            taskIdInput.value = ''; // No ID for new task yet
            currentEditTaskId = null;
            // Pre-fill due date based on source or task data (e.g., from calendar click)
            modalTaskDueDateInput.value = (task && task.dueDate) ? task.dueDate : ((source === 'list' && listDueDateInput) ? listDueDateInput.value : getFormattedLocalDate(new Date()));
            modalTaskPrioritySelect.value = (task && task.priority) ? task.priority : 'medium';
            modalTaskStatusSelect.value = (task && task.status) ? task.status : 'todo';
        }
        taskModal.style.display = 'flex';
    }

    function closeTaskModal() {
        taskModal.style.display = 'none';
        currentEditTaskId = null;
    }

    function addSubtaskToModal(text = '', completed = false) {
        const subtaskDiv = document.createElement('div');
        subtaskDiv.className = 'subtask';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = completed;

        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Subtask description';
        input.value = text;

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'remove-subtask-btn';
        removeBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
        removeBtn.onclick = () => subtaskDiv.remove();

        subtaskDiv.appendChild(checkbox);
        subtaskDiv.appendChild(input);
        subtaskDiv.appendChild(removeBtn);
        modalSubtasksContainer.appendChild(subtaskDiv);
    }

    function handleTaskFormSubmit(event) {
        event.preventDefault();

        const title = modalTaskTitleInput.value.trim();
        const body = modalTaskDescriptionInput.value.trim();
        const priority = modalTaskPrioritySelect.value;
        const dueDate = modalTaskDueDateInput.value; // This is already YYYY-MM-DD from the input
        const status = modalTaskStatusSelect.value;
        const id = taskIdInput.value || generateId();

        if (!title) {
            alert('Task title is required.');
            return;
        }
        if (!dueDate) {
            alert('Due date is required.');
            return;
        }


        const subtasks = Array.from(modalSubtasksContainer.querySelectorAll('.subtask')).map(div => ({
            text: div.querySelector('input[type="text"]').value.trim(),
            completed: div.querySelector('input[type="checkbox"]').checked,
        })).filter(subtask => subtask.text !== '');

        const taskData = { id, title, body, priority, dueDate, status, subtasks };

        if (currentEditTaskId) { // Editing existing task
            const taskIndex = window.todos.findIndex(t => t.id === currentEditTaskId);
            if (taskIndex > -1) {
                window.todos[taskIndex] = { ...window.todos[taskIndex], ...taskData };
            }
        } else { // Adding new task
            window.todos.push(taskData);
        }

        saveTasksToStorage(window.todos);
        renderAllViews();
        closeTaskModal();
    }

    // --- List View Specific Logic ---
    function addListTaskHandler() {
        const title = listNewTaskTitleInput.value.trim();
        const body = listNewTaskBodyInput.value.trim();
        const priority = listPrioritySelect.value;
        const status = listStatusSelect.value;
        const dueDate = listDueDateInput.value; // This is already YYYY-MM-DD

        if (!title) {
            alert('Task title is required for list view quick add.');
            return;
        }
        if (!dueDate) {
            alert('Due date is required for list view quick add.');
            return;
        }


        const newTask = {
            id: generateId(),
            title,
            body,
            priority,
            status,
            dueDate,
            subtasks: []
        };
        window.todos.push(newTask);
        saveTasksToStorage(window.todos);
        renderListView(); // Re-render list view
        // Optionally clear inputs
        listNewTaskTitleInput.value = '';
        listNewTaskBodyInput.value = '';
    }

    function renderListView() {
        if (!todoListUL) return;
        todoListUL.innerHTML = '';

        // Ensure currentListDate is set if listDueDateInput exists, otherwise default or handle
        if (listDueDateInput && !currentListDate) {
            currentListDate = listDueDateInput.value || getFormattedLocalDate(new Date());
        } else if (!listDueDateInput && !currentListDate) {
            // Fallback if listDueDateInput is not on the page, though this view assumes it for filtering.
            // For a generic list view without date input, this filter logic would need adjustment.
            // currentListDate = 'all'; // Or some other default if the input isn't there.
        }


        let tasksToRender = window.todos.filter(task => {
            // If currentListDate is not 'all', filter by date. Adjust if 'all' dates functionality is desired.
            const matchesDate = currentListDate ? (task.dueDate === currentListDate) : true;
            const matchesPriority = currentListPriorityFilter === 'all' || task.priority === currentListPriorityFilter;
            const matchesStatus = currentListStatusFilter === 'all-status' || task.status === currentListStatusFilter;
            return matchesDate && matchesPriority && matchesStatus;
        });


        if (tasksToRender.length === 0) {
            const emptyMessage = document.createElement('li');
            emptyMessage.className = 'empty-list';
            emptyMessage.textContent = 'No tasks for this selection.';
            todoListUL.appendChild(emptyMessage);
            return;
        }

        tasksToRender.forEach(task => {
            const listItem = document.createElement('li');
            listItem.className = `status-${task.status}`; // For styling based on status
            listItem.dataset.id = task.id;

            listItem.innerHTML = `
                <div class="task-details">
                    <span class="task-title">${task.title}</span>
                    ${task.body ? `<p class="task-body">${task.body.replace(/\n/g, '<br>')}</p>` : ''}
                    <div>
                        <span class="priority-badge priority-${task.priority}">${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}</span>
                        <span class="status-badge status-${task.status}">${task.status.charAt(0).toUpperCase() + task.status.slice(1)}</span>
                    </div>
                    <span class="due-date">Due: ${formatDisplayDate(task.dueDate)}</span>
                    ${task.subtasks && task.subtasks.length > 0 ? `
                        <div class="list-subtasks">
                            <strong>Subtasks:</strong>
                            <ul>
                                ${task.subtasks.map(st => `<li class="${st.completed ? 'completed' : ''}">${st.text}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
                <div class="actions">
                    <button class="edit-button" title="Edit"><i class="fa-solid fa-pencil"></i></button>
                    <button class="complete-button" title="${task.status === 'done' ? 'Mark Incomplete' : 'Mark Complete'}">
                        ${task.status === 'done' ? '<i class="fa-solid fa-rotate-left"></i>' : '<i class="fa-solid fa-check"></i>'}
                    </button>
                    <button class="delete-button" title="Delete"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;

            listItem.querySelector('.edit-button').addEventListener('click', () => openTaskModal(task, 'list'));
            listItem.querySelector('.complete-button').addEventListener('click', () => toggleListTaskStatus(task.id));
            listItem.querySelector('.delete-button').addEventListener('click', () => deleteListTask(task.id));

            todoListUL.appendChild(listItem);
        });
    }

    function toggleListTaskStatus(taskId) {
        const taskIndex = window.todos.findIndex(t => t.id === taskId);
        if (taskIndex > -1) {
            const task = window.todos[taskIndex];
            if (task.status === 'done') {
                task.status = 'inprogress'; // Or 'todo' based on desired flow
            } else {
                task.status = 'done';
            }
            saveTasksToStorage(window.todos);
            renderAllViews();
        }
    }

    function deleteListTask(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            window.todos = window.todos.filter(t => t.id !== taskId);
            saveTasksToStorage(window.todos);
            renderAllViews();
        }
    }

    function handleListDateChange() {
        if (listDueDateInput) {
            currentListDate = listDueDateInput.value;
            renderListView();
        }
    }

    function handleListFilterChange(event, filterType) {
        const filterValue = event.target.dataset.filter || event.target.dataset.statusFilter;

        if (filterType === 'priority') {
            currentListPriorityFilter = filterValue;
            listFilterPriorityButtons.forEach(btn => btn.classList.remove('active'));
        } else if (filterType === 'status') {
            currentListStatusFilter = filterValue;
            listFilterStatusButtons.forEach(btn => btn.classList.remove('active'));
        }
        event.target.classList.add('active');
        renderListView();
    }


    // --- Utility functions ---
    /**
     * Formats a Date object into YYYY-MM-DD string based on local date components.
     * @param {Date} date The date object to format.
     * @returns {string} The formatted date string (e.g., "2023-10-21").
     */
    function getFormattedLocalDate(date) {
        if (!(date instanceof Date) || isNaN(date)) {
            // Handle invalid date input, perhaps return today's date or an empty string
            console.warn("getFormattedLocalDate received an invalid date:", date);
            date = new Date(); // Default to now if invalid
        }
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function formatDisplayDate(dateString) { // For user-friendly display
        if (!dateString) return 'No date';
        // Ensure dateString is treated as local by appending a common time if it's just YYYY-MM-DD
        // This helps Safari and other browsers interpret it consistently as local.
        const dateParts = dateString.split('-');
        if (dateParts.length === 3) {
            // Construct date as new Date(year, monthIndex, day) to ensure local interpretation
            const year = parseInt(dateParts[0], 10);
            const monthIndex = parseInt(dateParts[1], 10) - 1; // Month is 0-indexed
            const day = parseInt(dateParts[2], 10);
            const date = new Date(year, monthIndex, day);
             if (isNaN(date.getTime())) { // Check if date is valid
                console.warn("formatDisplayDate received an invalid date string:", dateString);
                return 'Invalid date';
            }
            return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
        }
        // Fallback for unexpected formats, though input should be YYYY-MM-DD
        const date = new Date(dateString + 'T00:00:00');
         if (isNaN(date.getTime())) {
            console.warn("formatDisplayDate received an invalid date string (fallback):", dateString);
            return 'Invalid date';
        }
        return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    }


    // --- Global Render Function ---
    function renderAllViews() {
        // Call individual render functions for each view
        // This ensures data consistency across tabs
        if (typeof renderListView === 'function') renderListView();
        if (typeof generateCalendar === 'function') generateCalendar();
        if (typeof showDailyTasks === 'function') { // from daily-view.js
             if (document.getElementById('daily-view') && document.getElementById('daily-view').classList.contains('active')) {
                // Assuming populateWeekSelector and showDailyTasks are available globally or imported
                if (typeof populateWeekSelectorGlobal === 'function') populateWeekSelectorGlobal();
                showDailyTasks();
             } else if (typeof populateWeekSelectorGlobal === 'function' && typeof showDailyTasks === 'function') {
                // It might be good to update data for daily view even if not active,
                // if it doesn't cause performance issues. Or just ensure it re-populates on tab switch.
                // For now, only update if active to match existing pattern.
             }
        }
        if (typeof renderKanbanBoard === 'function') renderKanbanBoard(); // from kanban.js
    }


    // --- Event Listeners Setup ---
    function setupEventListeners() {
        tabs.forEach(tab => tab.addEventListener('click', () => switchTab(tab.dataset.tab)));
        if (themeSwitcherButton) themeSwitcherButton.addEventListener('click', toggleTheme);


        // Shared Modal Listeners
        if (taskForm) taskForm.addEventListener('submit', handleTaskFormSubmit);
        if (closeButtonModal) closeButtonModal.addEventListener('click', closeTaskModal);
        if (cancelButtonModal) cancelButtonModal.addEventListener('click', closeTaskModal);
        if (modalAddSubtaskButton) modalAddSubtaskButton.addEventListener('click', () => addSubtaskToModal());

        // List View Listeners
        if (listAddTaskButton) listAddTaskButton.addEventListener('click', addListTaskHandler);
        if (listDueDateInput) {
            listDueDateInput.addEventListener('change', handleListDateChange);
            currentListDate = listDueDateInput.value || getFormattedLocalDate(new Date()); // Initialize currentListDate
        }


        listFilterPriorityButtons.forEach(button => {
            button.addEventListener('click', (e) => handleListFilterChange(e, 'priority'));
        });
        listFilterStatusButtons.forEach(button => {
            button.addEventListener('click', (e) => handleListFilterChange(e, 'status'));
        });

        // Kanban "Add Task" button (if on Kanban tab)
        const kanbanAddTaskBtn = document.getElementById('kanban-add-task-btn');
        if (kanbanAddTaskBtn) {
            kanbanAddTaskBtn.addEventListener('click', () => openTaskModal(null, 'kanban'));
        }

        // Make openTaskModal globally accessible for other scripts if needed
        window.openGlobalTaskModal = openTaskModal;
        window.renderAllAppViews = renderAllViews; // Make global render accessible
        window.getGlobalFormattedDate = getFormattedLocalDate; // Make date formatter global (IMPORTANT CHANGE)
        window.formatGlobalDisplayDate = formatDisplayDate; // Make date formatter global
    }

    // --- Start the application ---
    initialize();
});