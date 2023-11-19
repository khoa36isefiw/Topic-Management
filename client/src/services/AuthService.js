import WebService from "./WebService"

const AuthService = {
  findRedirectUrl: kind => {
    if (!kind) return '';
    let nextUrl = '/';
    switch (kind) {
      case 'faculty':
        nextUrl = '/faculty';
        break;
      case 'administrator':
        nextUrl = '/admin';
        break;
      default:
        break;
    }

    return nextUrl;
  },

  login: async (email, password, nextUrl) => {
    const body = { email, password };
    const response = await WebService.postJson('/auth/login', body);
    console.log(response);
    if (response.ok) {
      const token = await response.json();
      localStorage.setItem('token', token.token);
      if (!nextUrl) {
        nextUrl = '/';
      }

      token.nextUrl = nextUrl;
      return token;
    }
    
    return null;
  },

  register: async (email) => {
    const body = { email };
    await WebService.postJson('/auth/register', body);
  },

  verifyCode: async (email, code, password, repeat) => {
    const body = { email, code, password, repeat };
    await WebService.postJson('/auth/code', body);
  },

  verify: async (token, password, repeat) => {
    const body = { token, password, repeat };
    await WebService.postJson('/auth/verify', body);
  },

  logout: () => {
    localStorage.removeItem('token');
  },

  getTokenInfo: async () => {
    const result = await WebService.post('/auth/token');
    const token = await result.json();
    const nextUrl = AuthService.findRedirectUrl(token.kind);
    token.nextUrl = nextUrl;
    return token;
  },

  getHeader: () => {
    const token = AuthService.getToken();
    return token
      ? { 'Authorization': `Bearer ${token}` }
      : { 'Authorization': '' };
  },

  getToken: () => {
    return localStorage.getItem('token');
  }
};

export default AuthService;
