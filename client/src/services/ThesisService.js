import WebService from "./WebService"

const ThesisService = {
  getTheses: async (queries) => {
    const response = await WebService.get('/thesis', queries);
    return await response.json();
  },

  getThesis: async (id, queries) => {
    const response = await WebService.get(`/thesis/${id}`, queries);
    return await response.json();
  },

  getSubmission: async (tid, sid, queries) => {
    const response = await WebService.get(`/thesis/${tid}/submission/${sid}`, queries);
    return await response.json();
  },

  getDeadlines: async () => {
    const response = await WebService.get(`/thesis/deadline`);
    return await response.json();
  },

  postDeadlines: async (deadlines) => {
    await WebService.postJson('/thesis/deadline', deadlines);
  },

  getAttachment: async (tid, sid, aid) => {
    const response = await WebService.get(`/thesis/${tid}/submission/${sid}/attachment/${aid}`);
    return await response.blob();
  },

  exportProjects: async () => {
    const response = await WebService.get(`/thesis/export`);
    return await response.blob();
  },

  /**
   * Creates a new thesis entry.
   * @param {{title: string, description?: string, authors: {_id:string}[], advisers: {_id:string}[], attachments?: File[]}} thesis 
   */
  createThesis: async (thesis) => {
    const form = new FormData();
    form.append('title', thesis.title);
    form.append('description', thesis.description);
    for (const author of thesis.authors) form.append('authors', typeof author === 'object' ? author._id : author);
    for (const adviser of thesis.advisers) form.append('advisers', typeof adviser === 'object' ? adviser._id : adviser);
    for (const panelist of thesis.panelists) form.append('panelists', typeof panelist === 'object' ? panelist._id : panelist);
    for (const attachment of thesis.attachments) form.append('files', attachment);

    const response = await WebService.postForm('/thesis', form);
    return await response.json();
  },

  uploadSubmission: async (thesisID, attachments) => {
    const form = new FormData();
    for (const attachment of attachments) form.append('files', attachment);

    const response = await WebService.postForm(`/thesis/${thesisID}/submission`, form);
    return await response.json();
  },

  getCommentsOnThesis: async (thesisID, queries) => {
    const response = await WebService.get(`/thesis/${thesisID}/comment`, queries);
    return await response.json();
  },

  commentOnThesis: async (thesisID, comment) => {
    const response = await WebService.postJson(`/thesis/${thesisID}/comment`, comment);
    return await response.json();
  },

  deleteComment: async (thesisID, commentID) => {
    await WebService.delete(`/thesis/${thesisID}/comment/${commentID}`);
  },

  /**
   * Creates a new thesis entry.
   * @param {{title: string, description?: string, authors: {_id:string}[], advisers: {_id:string}[], panelists: {_id:string}[], attachments?: File[]}} thesis 
   */
  updateThesis: async (thesisID, thesis) => {
    const { authors, advisers, panelists, ...rest } = thesis;
    const thesisReq = {
      ...rest,
      authors: authors.map(e => typeof e === 'object' ? e._id : e),
      advisers: advisers.map(e => typeof e === 'object' ? e._id : e),
      panelists: panelists.map(e => typeof e === 'object' ? e._id : e),
    }

    await WebService.putJson(`/thesis/${thesisID}`, thesisReq);
  },

  /**
   * Updates the status of a thesis.
   * @param {string} tid
   * @param {{password: string, status: string, grade: number?, remarks: string?}} data
   */
  updateStatus: async (tid, data) => {
    const { password, ...rest } = data;
    await WebService.postJson(`/thesis/${tid}/status`, rest, {
      headers: {
        'X-Password-Reentry': password
      }
    });
  },

  deleteThesis: async (tid) => {
    await WebService.delete(`/thesis/${tid}`);
  }
};

export default ThesisService;
