const { AsyncLocalStorage } = require('node:async_hooks');

const asyncLocalStorage = new AsyncLocalStorage();

module.exports = {
    asyncLocalStorage,
    /**
     * Run a function within a context
     * @param {Object} store - The context object (e.g. { adminId: '...' })
     * @param {Function} callback - The function to run
     */
    run: (store, callback) => asyncLocalStorage.run(store, callback),

    /**
     * Get the current store
     * @returns {Object|undefined}
     */
    getStore: () => asyncLocalStorage.getStore(),
};
