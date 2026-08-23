const store = new Map();

module.exports = {
  getItemAsync: async (key) => store.get(key) || null,
  setItemAsync: async (key, val) => store.set(key, val),
  deleteItemAsync: async (key) => store.delete(key),
};
