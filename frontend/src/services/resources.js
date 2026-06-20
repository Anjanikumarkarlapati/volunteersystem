import { api } from './api.js';

export const authService = {
  login: payload => api.post('/auth/login', payload).then(res => res.data),
  register: payload => api.post('/auth/register', payload).then(res => res.data),
  me: () => api.get('/auth/me').then(res => res.data),
  logout: () => api.post('/auth/logout'),
  googleLogin: idToken => api.post('/auth/google', { idToken }).then(res => res.data),
  completeGoogleRegistration: (tempToken, role, extra) =>
    api.post('/auth/google/complete', { tempToken, role, ...extra }).then(res => res.data),
  linkGoogle: (idToken, email, password) =>
    api.post('/auth/google/link', { idToken, email, password }).then(res => res.data),
};

export const opportunityService = {
  list: params => api.get('/opportunities', { params }).then(res => res.data),
  get: id => api.get(`/opportunities/${id}`).then(res => res.data),
  create: payload => api.post('/opportunities', payload).then(res => res.data),
  update: (id, payload) => api.put(`/opportunities/${id}`, payload).then(res => res.data),
  apply: (id, payload) =>
    api.post(`/opportunities/${id}/applications`, payload).then(res => res.data),
  applications: id => api.get(`/opportunities/${id}/applications`).then(res => res.data),
  // Hyperlocal discovery
  nearby: params => api.get('/opportunities/nearby', { params }).then(res => res.data),
};

export const applicationService = {
  mine: () => api.get('/applications/me').then(res => res.data),
  list: params => api.get('/applications', { params }).then(res => res.data),
  setStatus: (id, payload) =>
    api.patch(`/applications/${id}/status`, payload).then(res => res.data),
};

export const eventService = {
  list: params => api.get('/events', { params }).then(res => res.data),
  assigned: () => api.get('/events/me/assigned').then(res => res.data),
  create: payload => api.post('/events', payload).then(res => res.data),
  attendance: eventId => api.get(`/events/${eventId}/attendance`).then(res => res.data),
  assign: (eventId, payload) =>
    api.post(`/events/${eventId}/attendance`, payload).then(res => res.data),
  updateAttendance: (id, payload) => api.patch(`/attendance/${id}`, payload).then(res => res.data),
};

export const attendanceService = {
  checkIn: attendanceId => api.post(`/attendance/${attendanceId}/checkin`).then(res => res.data),
  verifyAttendance: (id, payload) =>
    api.patch(`/attendance/${id}/verify`, payload).then(res => res.data),
};

export const profileService = {
  volunteer: () => api.get('/volunteers/me').then(res => res.data),
  getVolunteer: id => api.get(`/volunteers/${id}`).then(res => res.data),
  updateVolunteer: payload => api.put('/volunteers/me', payload).then(res => res.data),
  organization: () => api.get('/organizations/me').then(res => res.data),
  updateOrganization: payload => api.put('/organizations/me', payload).then(res => res.data),
  hours: () => api.get('/volunteers/me/hours').then(res => res.data),
  history: () => api.get('/volunteers/me/history').then(res => res.data),
  heatmap: () => api.get('/volunteers/me/heatmap').then(res => res.data),
  uploadProfile: file => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/uploads/profile', formData).then(res => res.data);
  },
};

export const squadService = {
  list: () => api.get('/squads').then(res => res.data),
  create: payload => api.post('/squads', payload).then(res => res.data),
  get: id => api.get(`/squads/${id}`).then(res => res.data),
  addMember: (id, payload) => api.post(`/squads/${id}/members`, payload).then(res => res.data),
};

export const feedbackService = {
  submit: payload => api.post('/feedback', payload).then(res => res.data),
  pending: () => api.get('/feedback/pending').then(res => res.data),
  volunteerStats: volunteerId =>
    api.get(`/feedback/volunteer/${volunteerId}/stats`).then(res => res.data),
  eventStats: eventId => api.get(`/feedback/event/${eventId}/stats`).then(res => res.data),
};

export const adminService = {
  dashboard: () => api.get('/admin/dashboard').then(res => res.data),
  users: params => api.get('/admin/users', { params }).then(res => res.data),
  setUserStatus: (id, status) =>
    api.patch(`/admin/users/${id}/status`, { status }).then(res => res.data),
  organizations: params => api.get('/organizations', { params }).then(res => res.data),
  verifyOrganization: (id, verified) =>
    api.patch(`/organizations/${id}/verify`, { verified }).then(res => res.data),
  monitoring: () => api.get('/admin/monitoring').then(res => res.data),
  volunteerProfiles: params =>
    api.get('/admin/volunteer-profiles', { params }).then(res => res.data),
  allAttendance: params => api.get('/admin/attendance', { params }).then(res => res.data),
  volunteerTasks: volunteerId =>
    api.get(`/admin/volunteers/${volunteerId}/tasks`).then(res => res.data),
  searchEvents: params => api.get('/admin/events/search', { params }).then(res => res.data),
  assignTask: payload => api.post('/admin/assign-task', payload).then(res => res.data),
  pendingOpportunities: () => api.get('/admin/opportunities/pending').then(res => res.data),
  changeOpportunityStatus: (id, status) =>
    api.patch(`/admin/opportunities/${id}/status`, { status }).then(res => res.data),
};

export const reportService = {
  organization: params => api.get('/reports/organization', { params }).then(res => res.data),
  platform: () => api.get('/reports/platform').then(res => res.data),
  volunteer: () => api.get('/reports/volunteer').then(res => res.data),
};

export const notificationService = {
  list: () => api.get('/notifications').then(res => res.data),
  markRead: id => api.patch(`/notifications/${id}/read`).then(res => res.data),
  markAllRead: () => api.patch('/notifications/read-all').then(res => res.data),
};

export const settingsService = {
  updateProfile: payload => api.put('/auth/me', payload).then(res => res.data),
  changePassword: payload => api.post('/auth/change-password', payload).then(res => res.data),
  deleteAccount: () => api.delete('/auth/me').then(res => res.data),
  updateNotificationPreferences: payload =>
    api.patch('/auth/notification-preferences', payload).then(res => res.data),
};

export const certificateService = {
  mine: () => api.get('/certificates/me').then(res => res.data),
  list: () => api.get('/certificates').then(res => res.data),
  create: payload => api.post('/certificates', payload).then(res => res.data),
  download: id =>
    api.get(`/certificates/${id}/download`, { responseType: 'blob' }).then(res => res.data),
  downloadUrl: id =>
    `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/certificates/${id}/download`,
};
