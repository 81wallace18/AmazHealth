type StorageType = 'local' | 'session';

const STORAGE_TYPE_KEY = 'authStorageType';

const getStorageType = (): StorageType =>
  localStorage.getItem(STORAGE_TYPE_KEY) === 'session' ? 'session' : 'local';

const setStorageType = (type: StorageType) => {
  localStorage.setItem(STORAGE_TYPE_KEY, type);
};

const getStorageByType = (type: StorageType) => (type === 'session' ? sessionStorage : localStorage);

const clearAll = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  sessionStorage.removeItem('accessToken');
  sessionStorage.removeItem('refreshToken');
  sessionStorage.removeItem('user');
};

const getItem = (key: 'accessToken' | 'refreshToken' | 'user') => {
  const type = getStorageType();
  const primary = getStorageByType(type);
  const secondary = type === 'local' ? sessionStorage : localStorage;
  return primary.getItem(key) ?? secondary.getItem(key);
};

const setSession = (params: {
  accessToken: string;
  refreshToken?: string | null;
  user?: unknown;
  rememberMe?: boolean;
}) => {
  const type: StorageType = params.rememberMe === false ? 'session' : 'local';
  setStorageType(type);
  clearAll();

  const storage = getStorageByType(type);
  storage.setItem('accessToken', params.accessToken);
  if (params.refreshToken) {
    storage.setItem('refreshToken', params.refreshToken);
  }
  if (params.user) {
    storage.setItem('user', JSON.stringify(params.user));
  }
};

const updateTokens = (params: { accessToken: string; refreshToken?: string | null }) => {
  const storage = getStorageByType(getStorageType());
  storage.setItem('accessToken', params.accessToken);
  if (params.refreshToken) {
    storage.setItem('refreshToken', params.refreshToken);
  }
};

const setUser = (user: unknown) => {
  const storage = getStorageByType(getStorageType());
  storage.setItem('user', JSON.stringify(user));
};

export const authStorage = {
  getStorageType,
  setStorageType,
  getAccessToken: () => getItem('accessToken'),
  getRefreshToken: () => getItem('refreshToken'),
  getUser: () => getItem('user'),
  setSession,
  updateTokens,
  setUser,
  clear: clearAll,
};
