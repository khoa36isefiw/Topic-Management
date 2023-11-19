import WebService from "./WebService"

const AccountService = {
  getAccount: async (accountID, queries) => {
    const response = await WebService.get(`/account/${accountID}`, queries);
    return await response.json();
  },

  getAccountImage: async (accountID, queries) => {
    const response = await WebService.get(`/account/${accountID}/image`, queries);
    return await response.blob();
  },

  getAccounts: async (type, queries) => {
    let _queries = { ...queries };
    if (type) _queries.type = type;

    const response = await WebService.get('/account', _queries);
    return await response.json();
  },
  
  getStudents: async (queries) => {
    return AccountService.getAccounts('student', queries);
  },
  
  getFaculty: async (queries) => {
    return AccountService.getAccounts('faculty', queries);
  },

  createAccount: async (values) => {
    const response = await WebService.postJson('/account', values);
    return await response.json();
  },

  createAccounts: async (values) => await AccountService.createAccount(values),

  updateAccount: async (accountID, values) => {
    const form = new FormData();
    if (values.lastName) form.append('lastName', values.lastName);
    if (values.firstName) form.append('firstName', values.firstName);
    if (values.middleName) form.append('middleName', values.middleName);
    if (values.newPassword) form.append('newPassword', values.newPassword);
    if (values.currentPassword) form.append('currentPassword', values.currentPassword);
    if (values.retypePassword) form.append('retypePassword', values.retypePassword);
    if (values.photo) {
      form.append('photo', values.photo);
    }

    /*const removes = [];
    if (values.schedule) {
      for (const entry of values.schedule) {
        if (entry.mode === 'add') {
          form.append('scheduleFiles', entry.value);
        } else if (entry.mode === 'remove') {
          removes.push(entry._id);
        }
      }
    }
    form.append('scheduleRemove', JSON.stringify(removes));*/
    
    await WebService.patchForm(`/account/${accountID}`, form);
  },

  updateSchedule: async (accountID, patchSchedules) => {
    await WebService.patchJson(`/account/${accountID}/schedule`, patchSchedules);
  },

  deleteAccount: async (accountID) => {
    await WebService.delete(`/account/${accountID}`);
  },
};

export default AccountService;
