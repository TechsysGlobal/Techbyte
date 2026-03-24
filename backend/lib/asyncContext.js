import { AsyncLocalStorage } from 'node:async_hooks';

const asyncLocalStorage = new AsyncLocalStorage();

export { asyncLocalStorage };

/**
 * Run a function within a context
 * @param {Object} store - The context object (e.g. { adminId: '...' })
 * @param {Function} callback - The function to run
 */
export const run = (store, callback) => asyncLocalStorage.run(store, callback);

/**
 * Get the current store
 * @returns {Object|undefined}
 */
export const getStore = () => asyncLocalStorage.getStore();
