import axios from 'axios';

const BASE = 'http://localhost:8080/api';

const api = axios.create({ baseURL: BASE });

// Attach JWT to every request automatically
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// Auto-logout on 401
api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: d => api.post('/auth/register', d),
  login:    d => api.post('/auth/login', d),
};

// ── Faculty ──────────────────────────────────────────────────────────────────
export const facultyAPI = {
  profileExists:      ()           => api.get('/faculty/profile/exists'),
  getProfile:         ()           => api.get('/faculty/profile'),
  saveProfile:        d            => api.post('/faculty/profile', d),
  checkEligibility:   post         => api.get(`/faculty/eligibility?post=${encodeURIComponent(post)}`),
  submitApplication:  d            => api.post('/faculty/applications', d),
  getApplications:    ()           => api.get('/faculty/applications'),
  getApplication:     id           => api.get(`/faculty/applications/${id}`),
  getDocuments:       ()           => api.get('/faculty/documents'),
  uploadDocument: (file, documentType, applicationId) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('documentType', documentType);
    if (applicationId) fd.append('applicationId', applicationId);
    return api.post('/faculty/documents/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  downloadDocument: id => api.get(`/faculty/documents/${id}/download`, { responseType: 'blob' }),
  deleteDocument:   id => api.delete(`/faculty/documents/${id}`),
};

// ── Admin ────────────────────────────────────────────────────────────────────
export const adminAPI = {
  getDashboard:        ()         => api.get('/admin/dashboard'),
  getApplications:     status     => api.get('/admin/applications' + (status ? `?status=${status}` : '')),
  getApplication:      id         => api.get(`/admin/applications/${id}`),
  reviewApplication:   (id, d)    => api.patch(`/admin/applications/${id}/review`, d),
  getAllFaculty:        ()         => api.get('/admin/faculty'),
  getFacultyProfile:   userId     => api.get(`/admin/faculty/${userId}/profile`),
  toggleFacultyStatus: id         => api.patch(`/admin/faculty/${id}/toggle`),
  createAdmin:         d          => api.post('/admin/create-admin', d),
  getAdmins:           ()         => api.get('/admin/admins'),
  downloadDocument:    id         => api.get(`/admin/documents/${id}/download`, { responseType: 'blob' }),
};

// ── Eligibility Criteria ─────────────────────────────────────────────────────
export const criteriaAPI = {
  // Public - read active criteria
  getAllActive:      ()     => api.get('/criteria/active'),
  getActiveForPost: post   => api.get(`/criteria/active/${encodeURIComponent(post)}`),

  // Admin - manage criteria
  getHistory:       post   => api.get(`/criteria/history/${encodeURIComponent(post)}`),
  getById:          id     => api.get(`/criteria/${id}`),
  saveCriteria:     data   => api.post('/criteria/save', data),
  activateVersion:  id     => api.post(`/criteria/${id}/activate`),

  // Excel import / export
  importExcel: file => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post('/criteria/import/excel', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  downloadTemplate: () => api.get('/criteria/template/excel', { responseType: 'blob' }),
};

export default api;
