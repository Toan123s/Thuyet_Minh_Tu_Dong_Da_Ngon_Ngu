// accountService.js
import apiClient from "./apiClient";

const accountService = {
  getAll: ({ page = 1, pageSize = 10, role = "", search = "" } = {}) =>
    apiClient.get(
      `/admin/accounts?page=${page}&pageSize=${pageSize}&role=${role}&search=${search}`
    ).then(res => ({
      items:      (res.data ?? res.items ?? []).map(a => ({
        id:             a.id,
        username:       a.username,
        email:          a.email,
        role:           a.role,
        status:         a.isActive ? "active" : "inactive",
        createdAt:      new Date(a.createdAt).toLocaleDateString("vi-VN"),
        company:        a.companyName        ?? "",
        representative: a.representativeName ?? "",
        phone:          a.phoneNumber        ?? "",
      })),
      total:      res.total      ?? 0,
      totalPages: res.totalPages ?? 1,
    })),

  getById: (id) => apiClient.get(`/admin/accounts/${id}`),

  create: (form) =>
    apiClient.post("/admin/accounts", {
      username:           form.username,
      email:              form.email,
      password:           "AutoPass@123",
      role:               form.role,
      companyName:        form.company,
      representativeName: form.representative,
      phoneNumber:        form.phone,
    }),

  update: (id, form) =>
    apiClient.put(`/admin/accounts/${id}`, {
      email:              form.email,
      companyName:        form.company,
      representativeName: form.representative,
      phoneNumber:        form.phone,
    }),

  setStatus: (id, status) =>
    apiClient.patch(`/admin/accounts/${id}/status?isActive=${status === "active"}`),

  resetPassword: (id) =>
    apiClient.patch(`/admin/accounts/${id}/reset-password`, {
      newPassword: "AutoPass@123"
    }),
};

export default accountService;