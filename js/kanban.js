// js/kanban.js

let draggedTask = null; // To store the task being dragged
let currentKanbanFilter = 'today'; // Default filter: 'today', 'current_week', 'current_month', 'all'

function initializeKanban() {
    const kanbanFilterSelect = document.getElementById('kanban-filter-date-range');
    const kanbanAddTaskButton = document.getElementById('kanban-add-task-btn'); // Already in script.js but can be targeted here too

    if (!document.getElementById('kanban')) {
        // console.warn('Kanban elements not found. Skipping Kanban initialization.');
        return;
    }

    if (kanbanFilterSelect && !kanbanFilterSelect.dataset.listenerAttached) {
        kanbanFilterSelect.addEventListener('change', (e) => {
            currentKanbanFilter = e.target.value;
            renderKanbanBoard();
        });
        kanbanFilterSelect.dataset.listenerAttached = 'true';
    }

    // The main "add task" button for Kanban is already handled in script.js
    // to open the shared modal. No need to re-add listener here if it's the same button.

    renderKanbanBoard();
    setupKanbanDragAndDrop();
}

function renderKanbanBoard() {
    const todoColumn = document.getElementById('kanban-todo-tasks');
    const inprogressColumn = document.getElementById('kanban-inprogress-tasks');
    const doneColumn = document.getElementById('kanban-done-tasks');

    if (!todoColumn || !inprogressColumn || !doneColumn) return;

    todoColumn.innerHTML = '';
    inprogressColumn.innerHTML = '';
    doneColumn.innerHTML = '';

    const filteredTasks = filterTasksForKanban(window.todos, currentKanbanFilter);

    filteredTasks.forEach(task => {
        const taskCard = createKanbanTaskCard(task);
        if (task.status === 'todo') {
            todoColumn.appendChild(taskCard);
        } else if (task.status === 'inprogress') {
            inprogressColumn.appendChild(taskCard);
        } else if (task.status === 'done') {
            doneColumn.appendChild(taskCard);
        }
    });
}

function filterTasksForKanban(tasks, filter) {
    const now = new Date();
    const today = window.getGlobalFormattedDate(now); // YYYY-MM-DD

    // Get start of current week (Monday)
    const firstDayOfWeek = new Date(now);
    const dayOfWeek = now.getDay(); // 0 (Sun) - 6 (Sat)
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust to Monday
    firstDayOfWeek.setDate(now.getDate() + diffToMonday);
    firstDayOfWeek.setHours(0, 0, 0, 0);

    // Get end of current week (Sunday)
    const lastDayOfWeek = new Date(firstDayOfWeek);
    lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
    lastDayOfWeek.setHours(23, 59, 59, 999);

    // Get start and end of current month
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    lastDayOfMonth.setHours(23,59,59,999);


    return tasks.filter(task => {
        if (!task.dueDate) return filter === 'all'; // Include tasks without due date only if 'all' is selected

        const taskDueDate = new Date(task.dueDate + 'T00:00:00'); // Ensure parsed as local date

        switch (filter) {
            case 'today':
                return task.dueDate === today;
            case 'current_week':
                return taskDueDate >= firstDayOfWeek && taskDueDate <= lastDayOfWeek;
            case 'current_month':
                return taskDueDate >= firstDayOfMonth && taskDueDate <= lastDayOfMonth;
            case 'all':
            default:
                return true;
        }
    });
}


function createKanbanTaskCard(task) {
    const template = document.getElementById('kanban-task-template');
    if (!template) {
        console.error('Kanban task template not found!');
        const article = document.createElement('article');
        article.textContent = 'Error: Template missing.';
        return article;
    }
    const cardClone = template.content.cloneNode(true);
    const taskCard = cardClone.querySelector('.task-card');

    taskCard.dataset.id = task.id;
    taskCard.dataset.status = task.status; // For easier identification

    taskCard.querySelector('.task-title-kanban').textContent = task.title;
    const descriptionEl = taskCard.querySelector('.task-description-kanban');
    if (task.body) {
        descriptionEl.textContent = task.body;
        descriptionEl.style.display = 'block';
    } else {
        descriptionEl.style.display = 'none';
    }

    // Priority
    const priorityEl = taskCard.querySelector('.task-priority-kanban');
    priorityEl.textContent = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
    priorityEl.className = `task-priority-kanban priority-${task.priority}`;

    // Due Date
    const dueDateEl = taskCard.querySelector('.task-due-date-kanban');
    if (task.dueDate) {
        dueDateEl.textContent = `Due: ${window.formatGlobalDisplayDate(task.dueDate)}`;
    } else {
        dueDateEl.textContent = '';
    }


    // Subtasks & Progress Bar
    const subtasksContainer = taskCard.querySelector('.task-subtasks-kanban');
    const subtasksListUL = taskCard.querySelector('.subtasks-list-kanban');
    const progressBarFill = taskCard.querySelector('.progress-fill-kanban');
    const progressText = taskCard.querySelector('.progress-text-kanban');

    if (task.subtasks && task.subtasks.length > 0) {
        subtasksListUL.innerHTML = '';
        let completedCount = 0;
        task.subtasks.forEach((subtask, index) => {
            const li = document.createElement('li');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = subtask.completed;
            checkbox.dataset.taskId = task.id;
            checkbox.dataset.subtaskIndex = index;
            checkbox.addEventListener('change', handleKanbanSubtaskChange);

            const span = document.createElement('span');
            span.textContent = subtask.text;
            if (subtask.completed) {
                li.classList.add('completed');
                completedCount++;
            }

            li.appendChild(checkbox);
            li.appendChild(span);
            subtasksListUL.appendChild(li);
        });

        const progressPercentage = task.subtasks.length > 0 ? Math.round((completedCount / task.subtasks.length) * 100) : 0;
        progressBarFill.style.width = `${progressPercentage}%`;
        progressText.textContent = `${progressPercentage}%`;
        subtasksContainer.style.display = 'block';
    } else {
        subtasksContainer.style.display = 'none';
    }

    // Actions
    taskCard.querySelector('.edit-task-btn-kanban').addEventListener('click', () => window.openGlobalTaskModal(task, 'kanban'));
    taskCard.querySelector('.delete-task-btn-kanban').addEventListener('click', () => deleteKanbanTask(task.id));

    return taskCard;
}

function handleKanbanSubtaskChange(event) {
    const taskId = event.target.dataset.taskId;
    const subtaskIndex = parseInt(event.target.dataset.subtaskIndex);
    const isChecked = event.target.checked;

    const task = window.todos.find(t => t.id === taskId);
    if (task && task.subtasks && task.subtasks[subtaskIndex]) {
        task.subtasks[subtaskIndex].completed = isChecked;
        saveTasksToStorage(window.todos);
        renderKanbanBoard(); // Could be optimized to re-render only the card
        // If other views show subtask progress, call window.renderAllAppViews();
    }
}


function deleteKanbanTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        window.todos = window.todos.filter(t => t.id !== taskId);
        saveTasksToStorage(window.todos);
        window.renderAllAppViews(); // Re-render all views to reflect deletion
    }
}

// --- Drag and Drop ---
function setupKanbanDragAndDrop() {
    const taskCards = document.querySelectorAll('#kanban .task-card'); // Ensure we only select kanban cards
    const columns = document.querySelectorAll('#kanban .tasks-container'); // Kanban columns

    taskCards.forEach(card => {
        card.addEventListener('dragstart', dragStartKanban);
        card.addEventListener('dragend', dragEndKanban);
    });

    columns.forEach(column => {
        column.addEventListener('dragover', dragOverKanban);
        column.addEventListener('dragenter', dragEnterKanban);
        column.addEventListener('dragleave', dragLeaveKanban);
        column.addEventListener('drop', dropKanban);
    });

    // Use MutationObserver to attach D&D to newly added cards
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1 && node.classList.contains('task-card') && node.closest('#kanban')) {
                    node.addEventListener('dragstart', dragStartKanban);
                    node.addEventListener('dragend', dragEndKanban);
                }
            });
        });
    });

    document.querySelectorAll('#kanban .tasks-container').forEach(container => {
        observer.observe(container, { childList: true });
    });
}

function dragStartKanban(e) {
    draggedTask = e.target; // The task card element
    setTimeout(() => e.target.classList.add('dragging'), 0);
    e.dataTransfer.effectAllowed = 'move';
    // e.dataTransfer.setData('text/plain', draggedTask.dataset.id); // Optional
}

function dragEndKanban(e) {
    e.target.classList.remove('dragging');
    draggedTask = null;
     // Remove drag-over from all columns
    document.querySelectorAll('#kanban .tasks-container').forEach(col => col.classList.remove('drag-over'));
}

function dragOverKanban(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function dragEnterKanban(e) {
    e.preventDefault();
    if (e.target.classList.contains('tasks-container')) {
        e.target.classList.add('drag-over');
    }
}

function dragLeaveKanban(e) {
    if (e.target.classList.contains('tasks-container')) {
        e.target.classList.remove('drag-over');
    }
}

function dropKanban(e) {
    e.preventDefault();
    const targetColumnElement = e.target.closest('.tasks-container');
    if (targetColumnElement && draggedTask) {
        targetColumnElement.classList.remove('drag-over');
        const taskId = draggedTask.dataset.id;
        const newStatus = targetColumnElement.dataset.status; // 'todo', 'inprogress', 'done'

        if (!taskId || !newStatus) {
            console.error("Task ID or new status is missing for drop.", taskId, newStatus);
            return;
        }

        const taskIndex = window.todos.findIndex(t => t.id === taskId);
        if (taskIndex > -1) {
            // Only update if the status is actually different
            if (window.todos[taskIndex].status !== newStatus) {
                window.todos[taskIndex].status = newStatus;
                saveTasksToStorage(window.todos);
                // No need to appendChild here, renderKanbanBoard will redraw.
                // However, for smoother UX, you might append and then redraw,
                // or only redraw if the status actually changed.
            }
            // Always re-render to ensure correct placement and order,
            // especially if dropping within the same column but changing order (not implemented here)
            renderKanbanBoard(); // Re-render the board to reflect the change
            window.renderAllAppViews(); // Update other views if necessary
        } else {
            console.error("Dropped task not found in todos array: ", taskId);
        }
    } else if (draggedTask) {
         // If not dropped on a valid column, remove drag-over from all columns as a cleanup
        document.querySelectorAll('#kanban .tasks-container').forEach(col => col.classList.remove('drag-over'));
    }
}

// Expose functions to be called from script.js
window.initializeKanban = initializeKanban;
window.renderKanbanBoard = renderKanbanBoard;

document.addEventListener('DOMContentLoaded', () => {
    // The main script.js now handles initial call based on active tab.
    // if (document.getElementById('kanban')?.classList.contains('active')) {
    //    initializeKanban();
    // }
});