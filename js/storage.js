// js/storage.js

const STORAGE_KEY = 'todosAppData';

/**
 * Loads tasks from localStorage.
 * Initializes with an empty array if no tasks are found.
 * @returns {Array} The array of task objects.
 */
function loadTasksFromStorage() {
    try {
        const storedTasks = localStorage.getItem(STORAGE_KEY);
        if (storedTasks) {
            const parsedTasks = JSON.parse(storedTasks);
            // Ensure all task objects have a subtasks array
            return parsedTasks.map(task => ({
                ...task,
                subtasks: task.subtasks || [],
                id: task.id || generateId() // Ensure ID exists
            }));
        }
        return [];
    } catch (error) {
        console.error('Error loading tasks from storage:', error);
        return []; // Return empty array on error
    }
}

/**
 * Saves the current array of tasks to localStorage.
 * @param {Array} tasksArray - The array of task objects to save.
 */
function saveTasksToStorage(tasksArray) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasksArray));
    } catch (error) {
        console.error('Error saving tasks to storage:', error);
    }
}

/**
 * Generates a unique ID for a task.
 * @returns {string} A unique ID string.
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

// Make functions available globally or export if using modules (not used in this simple setup)
// window.StorageManager = { loadTasksFromStorage, saveTasksToStorage, generateId };