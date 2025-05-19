# Interactive Task Management Application

**Version:** 1.0.0
**Last Updated:** May 19, 2025

## 🌟 Project Overview

This Interactive Task Management Application is a comprehensive tool designed to help users organize their tasks efficiently across multiple views. It combines the classic to-do list with a visual calendar, a daily/weekly agenda, and a flexible Kanban board, all wrapped in a clean, modern interface with light and dark theme options.

Whether you're planning your day, tracking project progress, or visualizing your workload, this application provides the tools you need to stay on top of your commitments.

### ✨ Key Features

* **📝 Todo List View:**
    * Quickly add tasks with titles, descriptions, priorities, statuses, and due dates.
    * Filter tasks by priority (Low, Medium, High, Very High) and status (To Do, In Progress, Done).
    * Edit and delete tasks directly from the list.
    * Mark tasks as complete or revert to in-progress.
* **📅 Calendar View:**
    * Visualize tasks on a monthly calendar.
    * See task indicators for different statuses on each day.
    * Easily navigate between months.
    * Click on a day to open the task modal and add a new task for that date.
* **🗓️ Daily/Weekly View:**
    * Select a week to view tasks organized by day.
    * See "Today" highlighted.
    * Quick-add tasks directly to specific days.
    * Edit tasks and toggle their completion status.
* **📋 Kanban Board View:**
    * Visualize task workflow with "To Do", "In Progress", and "Done" columns.
    * Drag and drop tasks between columns to update their status.
    * Filter tasks by date range: Today, This Week, This Month, or All Tasks.
    * Add, edit, and delete tasks, including subtasks with progress tracking.
* **📌 Universal Task Management:**
    * **Task Details:** Add titles, detailed descriptions/notes, priority levels (Low, Medium, High, Very High), due dates, and status (To Do, In Progress, Done).
    * **Subtasks:** Break down larger tasks into smaller, manageable subtasks with individual completion tracking and a progress bar on Kanban cards.
    * **Centralized Modal:** A single, intuitive modal for adding and editing tasks across all views.
* **🌓 Light & Dark Mode:**
    * Switch between light and dark themes for comfortable viewing in any environment.
    * Theme preference is saved locally.
* **💾 Local Storage:**
    * All tasks are saved in the browser's local storage, so your data persists between sessions.
* **🎨 Modern & Responsive UI:**
    * Clean, intuitive design for a pleasant user experience.
    * Responsive layout adapting to different screen sizes.

## 🚀 Getting Started

1.  **Clone the repository (if applicable) or download the files.**
2.  Ensure all files are in the following directory structure:
    ```
    project-root/
    ├── index.html
    ├── css/
    │   └── style.css
    └── js/
        ├── script.js
        ├── calendar.js
        ├── daily-view.js
        ├── kanban.js
        └── storage.js
    ```
3.  **Open `index.html` in your web browser.**

No special build steps or dependencies are required beyond a modern web browser that supports HTML5, CSS3, and JavaScript (ES6+).

## 🛠️ Technical Documentation

### Project Structure

* **`index.html`**: The main HTML file containing the structure for all views (List, Calendar, Daily/Weekly, Kanban), the shared task modal, and navigation.
* **`css/style.css`**: A single CSS file containing all styles for the application, including:
    * Base styles and resets.
    * Layout for all views.
    * Styling for task elements, modals, buttons, forms.
    * Light and Dark theme definitions using CSS custom properties.
    * Responsive design media queries.
    * Font Awesome is used for icons (linked via CDN in `index.html`).
* **`js/`**: Contains all JavaScript logic, modularized by feature.
    * **`storage.js`**: Handles saving and loading tasks to/from the browser's `localStorage`. Provides `loadTasksFromStorage()`, `saveTasksToStorage()`, and `generateId()`.
    * **`script.js`**: The main script.
        * Initializes the application and global `window.todos` array.
        * Manages tab switching logic.
        * Handles theme switching (light/dark mode).
        * Controls the shared task modal (opening, closing, form submission, subtask management within the modal).
        * Contains logic for the "Todo List" view (rendering, adding, editing, deleting, filtering tasks).
        * Provides global utility functions (e.g., date formatting, `renderAllAppViews()`).
        * Sets up global event listeners.
    * **`calendar.js`**: Manages the "Calendar" view.
        * Generates the monthly calendar grid.
        * Displays task indicators (by status) on relevant days.
        * Handles navigation between months.
        * Integrates with the global task modal for adding tasks to a specific date.
    * **`daily-view.js`**: Manages the "Daily/Weekly" view.
        * Populates a week selector.
        * Displays tasks for each day within the selected week.
        * Allows quick-adding of tasks for specific days.
        * Handles task status toggling and editing via the global modal.
    * **`kanban.js`**: Manages the "Kanban Board" view.
        * Renders tasks in "To Do", "In Progress", and "Done" columns.
        * Implements drag-and-drop functionality for tasks between columns (updates task status).
        * Filters Kanban tasks by date range (Today, This Week, This Month, All).
        * Handles subtask completion and progress bar updates on Kanban cards.
        * Integrates with the global task modal for adding/editing Kanban tasks.

### Data Model

A task object typically has the following structure:

```javascript
{
    id: "string", // Unique identifier (e.g., timestamp + random string)
    title: "string", // Task title (required)
    body: "string", // Detailed description or notes (optional)
    priority: "string", // "low", "medium", "high", "sehr-hoch"
    status: "string", // "todo", "inprogress", "done"
    dueDate: "string", // Date string in "YYYY-MM-DD" format (required)
    subtasks: [ // Array of subtask objects (optional)
        { text: "string", completed: boolean },
        // ... more subtasks
    ]
    // Potentially: creationDate, lastModifiedDate etc. (not explicitly implemented everywhere yet)
}