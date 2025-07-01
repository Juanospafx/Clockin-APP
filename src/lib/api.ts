const api = {
  defaults: {
    baseURL: import.meta.env.VITE_API_URL,
  },
  get: (url: string, options?: RequestInit) => {
    return fetch(`${import.meta.env.VITE_API_URL}${url}`, {
      ...options,
      method: 'GET',
    });
  },
  post: (url: string, body: unknown, options?: RequestInit) => {
    return fetch(`${import.meta.env.VITE_API_URL}${url}`, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
  },
  put: (url: string, body: unknown, options?: RequestInit) => {
    return fetch(`${import.meta.env.VITE_API_URL}${url}`, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
  },
  patch: (url: string, body: unknown, options?: RequestInit) => {
    return fetch(`${import.meta.env.VITE_API_URL}${url}`, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
  },
  delete: (url: string, options?: RequestInit) => {
    return fetch(`${import.meta.env.VITE_API_URL}${url}`, {
      ...options,
      method: 'DELETE',
    });
  },
};

export default api;

