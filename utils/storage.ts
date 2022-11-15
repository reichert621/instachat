export const storage = (window: Window) => {
  const get = (key: string) => {
    try {
      const data = window.localStorage.getItem(key);

      if (!data) {
        return null;
      }

      return JSON.parse(data) || null;
    } catch (e) {
      return null;
    }
  };

  const set = (key: string, value: any) => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {}
  };

  const remove = (key: string) => {
    try {
      window.localStorage.removeItem(key);
    } catch (e) {}
  };

  return {
    get,
    set,
    remove,
  };
};
