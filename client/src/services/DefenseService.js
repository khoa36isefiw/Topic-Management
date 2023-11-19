import WebService from "./WebService"

const DefenseService = {
  getDefenses: async (queries) => {
    const response = await WebService.get(`/defense`, queries);
    return await response.json();
  },

  processDefenseSlots: async (request) => {
    let request2 = Array.isArray(request) ? request : [request];
    request2 = request2.map(e => {
      const { panelists, thesis, ...rest } = e;
      if (!panelists) return e;
      const panelists2 = panelists.map(e2 => typeof e2 === 'object' ? e2._id : e2);
      const thesis2 = thesis._id ? thesis._id : thesis;
      return { ...rest, thesis: thesis2, panelists: panelists2 };
    });
    const response = await WebService.postJson('/defense', request2);
    return await response.json();
  },

  generateSlots: async (thesisID, options) => {
    const response = await WebService.postJson(`/defense/schedule/${thesisID}`, options);
    return await response.json();
  },

  getDefenseSchedule: async (queries) => {
    const response = await WebService.get('/defenseweek', queries);
    return await response.json();
  },

  postDefenseSchedule: async (schedules) => {
    await WebService.postJson('/defenseweek', schedules);
  }
};

export default DefenseService;
