import AuthService from './AuthService';

const API_URL = 'http://localhost:8550/api';

class WebError {
  constructor(status, code, message, details) {
    this.status = status;
    this.code = code;
    this.message = message;
    this.details = details;
  }
}

const WebService = {
  request: async (endpoint, init) => {
    const { headers, ...initRest } = init || {};
    const authHeaders = { ...AuthService.getHeader(), ...headers };
    console.log(authHeaders);
    try {
      const result = await fetch(`${API_URL}${endpoint}`, { headers: authHeaders, ...initRest });
      console.log(result);
      if (!result.ok) {
        const reason = await result.json();
        throw new WebError(result.status, reason.code, reason.message, reason.details);
      }
      return result;
    } catch (error) {
      if (error instanceof WebError) throw error;
      throw new WebError(0, 'Could not connect to remote server', error);
    }
  },

  get: async (endpoint, queries, init) => {
    const url = endpoint + (queries ? ('?' + new URLSearchParams(queries).toString()) : '');
    return await WebService.request(url, { ...init, ...{ method: 'GET' } });
  },

  post: async (endpoint, init) => {
    return await WebService.request(endpoint, {
      ...init,
      ...{
        method: 'POST'
      }
    });
  },

  postJson: async (endpoint, body, init) => {
    const { headers, ...rest } = init || {};
    const jsonHeaders = { ...headers, ...{ 'Content-Type': 'application/json' } };
    const res = await WebService.request(endpoint, {
      body: JSON.stringify(body),
      headers: jsonHeaders,
      method: 'POST',
      ...rest
    });
    console.log(res);
    return res;
  },

  postForm: async (endpoint, form, init) => {
    const { headers, ...rest } = init || {};
    const jsonHeaders = { ...headers };
    console.log(jsonHeaders);
    return await WebService.request(endpoint, {
      body: form,
      headers: jsonHeaders,
      method: 'POST',
      ...rest
    });
  },

  putJson: async (endpoint, body, init) => {
    const { headers, ...rest } = init || {};
    const jsonHeaders = { ...headers, ...{ 'Content-Type': 'application/json' } };
    
    return await WebService.request(endpoint, {
      body: JSON.stringify(body),
      headers: jsonHeaders,
      method: 'PUT',
      ...rest
    });
  },

  patchJson: async (endpoint, body, init) => {
    const { headers, ...rest } = init || {};
    const jsonHeaders = { ...headers, ...{ 'Content-Type': 'application/json' } };
    return await WebService.request(endpoint, {
      body: JSON.stringify(body),
      headers: jsonHeaders,
      method: 'PATCH',
      ...rest
    });
  },

  patchForm: async (endpoint, form, init) => {
    const { headers, ...rest } = init || {};
    const jsonHeaders = { ...headers };
    return await WebService.request(endpoint, {
      body: form,
      headers: jsonHeaders,
      method: 'PATCH',
      ...rest
    });
  },

  delete: async (endpoint, init) => {
    return await WebService.request(endpoint, {
      ...init,
      ...{
        method: 'DELETE'
      }
    });
  }
}

export default WebService;
export { WebError };
