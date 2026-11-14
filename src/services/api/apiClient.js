// =====================================================================
// Barangay Kinilis - PHP / MySQL Backend API Client
// Connects React frontend directly with the XAMPP PHP REST API
// =====================================================================

const API_BASE_URL = 
  import.meta.env.VITE_API_URL || 
  (window.location.origin.includes(':3000') 
    ? 'http://localhost/KinilisIbaKa/backend/api' 
    : '/KinilisIbaKa/backend/api');

export const apiClient = {
  baseUrl: API_BASE_URL,

  async get(endpoint, params = {}) {
    const url = new URL(`${API_BASE_URL}/${endpoint}`);
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    const result = await res.json();
    if (!res.ok || result.success === false) {
      throw new Error(result.message || 'API request failed');
    }
    return result.data;
  },

  async post(endpoint, data = {}, isFormData = false) {
    const url = `${API_BASE_URL}/${endpoint}`;
    const options = {
      method: 'POST'
    };

    if (isFormData) {
      options.body = data; // FormData handles its own headers
    } else {
      options.headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      options.body = JSON.stringify(data);
    }

    const res = await fetch(url, options);
    const result = await res.json();
    if (!res.ok || result.success === false) {
      throw new Error(result.message || 'API submission failed');
    }
    return result.data;
  },

  async put(endpoint, data = {}) {
    const url = `${API_BASE_URL}/${endpoint}`;
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok || result.success === false) {
      throw new Error(result.message || 'API update failed');
    }
    return result.data;
  }
};

export default apiClient;
