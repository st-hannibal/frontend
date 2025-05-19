// js/calendar.js

let calendarCurrentMonthDate = new Date(); // Renamed to avoid conflict if script.js also has currentMonth

function generateCalendar() {
    const calendarGrid = document.querySelector('.calendar-grid');
    const currentMonthElement = document.getElementById('current-month');
    const prevButton = document.getElementById('prev-month');
    const nextButton = document.getElementById('next-month');

    if (!calendarGrid || !currentMonthElement || !prevButton || !nextButton) {
        // console.warn('Calendar elements not found. Skipping calendar generation.');
        return; // Don't run if calendar elements are not on the current page/tab
    }

    // Ensure event listeners are only added once or are managed correctly
    // A simple way is to clone and replace, or use a flag.
    // For simplicity, we'll rely on the DOMContentLoaded wrapper or ensure this is called when tab becomes active.
    // Check if listeners are already attached (simple check, might need more robust solution for complex scenarios)
    if (!prevButton.dataset.listenerAttached) {
        prevButton.addEventListener('click', goToPreviousMonth);
        prevButton.dataset.listenerAttached = 'true';
    }
    if (!nextButton.dataset.listenerAttached) {
        nextButton.addEventListener('click', goToNextMonth);
        nextButton.dataset.listenerAttached = 'true';
    }


    const year = calendarCurrentMonthDate.getFullYear();
    const month = calendarCurrentMonthDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 (Sunday) to 6 (Saturday)

    calendarGrid.innerHTML = ''; // Clear previous grid
    currentMonthElement.textContent = calendarCurrentMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    daysOfWeek.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.classList.add('day-header');
        dayHeader.textContent = day;
        calendarGrid.appendChild(dayHeader);
    });

    let dayCounter = 1;
    for (let i = 0; i < 6; i++) { // Max 6 rows
        if (dayCounter > daysInMonth && i > 0 && (i * 7 + 1 - startDayOfWeek) > daysInMonth ) break; // Optimization: if dayCounter exceeded and we are in a new row that starts past the month end.

        for (let j = 0; j < 7; j++) {
            const dayCell = document.createElement('div');
            dayCell.classList.add('day');

            if (i === 0 && j < startDayOfWeek) { // Previous month's days
                const prevMonthLastDay = new Date(year, month, 0).getDate();
                dayCell.textContent = prevMonthLastDay - startDayOfWeek + j + 1;
                dayCell.classList.add('other-month');
            } else if (dayCounter <= daysInMonth) { // Current month's days
                const currentDateObj = new Date(year, month, dayCounter);
                const formattedDate = window.getGlobalFormattedDate(currentDateObj); // YYYY-MM-DD from script.js

                dayCell.textContent = dayCounter;
                dayCell.dataset.date = formattedDate;

                if (isCalendarToday(currentDateObj)) {
                    dayCell.classList.add('today');
                }

                const tasksForDay = getTasksForCalendarDate(formattedDate);
                if (tasksForDay.length > 0) {
                    const taskIndicatorsContainer = document.createElement('div');
                    taskIndicatorsContainer.classList.add('task-indicators');

                    const statusCounts = { todo: 0, inprogress: 0, done: 0 };
                    tasksForDay.forEach(task => {
                        if (statusCounts[task.status] !== undefined) {
                            statusCounts[task.status]++;
                        }
                    });

                    ['todo', 'inprogress', 'done'].forEach(status => {
                        if (statusCounts[status] > 0) {
                            const indicator = document.createElement('span');
                            indicator.classList.add('task-indicator', `status-${status}`);
                            // indicator.textContent = statusCounts[status]; // Optional: show count
                            indicator.title = `${statusCounts[status]} task(s) ${status}`;
                            taskIndicatorsContainer.appendChild(indicator);
                        }
                    });
                    dayCell.appendChild(taskIndicatorsContainer);
                }

                dayCell.addEventListener('click', () => {
                    // Option 1: Open a simple list/alert of tasks for the day
                    // alert(`Tasks for ${formattedDate}:\n${tasksForDay.map(t => t.title).join('\n')}`);
                    // Option 2: Open the main task modal, pre-filled for adding a new task on this date
                    if (typeof window.openGlobalTaskModal === 'function') {
                         const dummyTaskForDate = { dueDate: formattedDate, priority: 'medium', status: 'todo' };
                         window.openGlobalTaskModal(dummyTaskForDate, 'calendar'); // Open modal with date pre-selected
                    }
                });
                dayCounter++;
            } else { // Next month's days
                if (dayCounter > daysInMonth) { // only add next month's day if we have rendered all of current month's days
                    dayCell.textContent = dayCounter - daysInMonth;
                    dayCell.classList.add('other-month');
                    dayCounter++;
                } else {
                     // This case should ideally not be hit if logic is correct, but as a fallback:
                    dayCell.classList.add('empty'); // Or 'other-month' if preferred
                }
            }
            calendarGrid.appendChild(dayCell);
        }
        if (dayCounter > daysInMonth && i > 0 && ( (i+1) * 7 + 1 - startDayOfWeek) > daysInMonth) break; // Break outer loop if all days rendered
    }
}

function goToPreviousMonth() {
    calendarCurrentMonthDate.setMonth(calendarCurrentMonthDate.getMonth() - 1);
    generateCalendar();
}

function goToNextMonth() {
    calendarCurrentMonthDate.setMonth(calendarCurrentMonthDate.getMonth() + 1);
    generateCalendar();
}

function isCalendarToday(date) {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
}

function getTasksForCalendarDate(dateString) { // dateString is YYYY-MM-DD
    if (!window.todos) return [];
    return window.todos.filter(task => task.dueDate === dateString);
}


// Initial calendar generation if this script is loaded and the tab is active.
// The main script.js will also call generateCalendar when the tab is switched to.
document.addEventListener('DOMContentLoaded', () => {
    // The main script.js now handles initial call based on active tab.
    // However, if this script might be loaded standalone or before script.js fully initializes tab switching,
    // this can be a fallback.
    // if (document.getElementById('calendar') && document.getElementById('calendar').classList.contains('active')) {
    //    generateCalendar();
    // }

    // A better approach is to let script.js control the initial call
    // and ensure generateCalendar is globally available if script.js needs to call it.
    window.generateCalendar = generateCalendar; // Make it globally accessible for script.js
});