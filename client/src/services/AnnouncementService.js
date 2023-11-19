import WebService from "./WebService"

const AnnouncementService = {
  getAnnouncements: async (queries) => {
    const response = await WebService.get('/announcement', queries);
    return await response.json();
  },

  readAnnouncement: async (id) => {
    await WebService.post(`/announcement/${id}/read`);
  },

  createAnnouncement: async (announcement) => {
    const response = await WebService.postJson('/announcement', announcement);
    return await response.json();
  },

  updateAnnouncement: async (announcementID, announcement) => {
    await WebService.putJson(`/announcement/${announcementID}`, announcement);
  },

  deleteAnnouncement: async (announcementID) => {
    await WebService.delete(`/announcement/${announcementID}`);
  }
};

export default AnnouncementService;
