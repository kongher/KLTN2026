import api, { clearStoredToken, setStoredToken } from "./api";
import type { ApiSuccess, AuthUser, ProfileUser } from "../types/auth";

type AuthPayload = {
  user: AuthUser;
  token: string;
};

export async function loginRequest(identifier: string, password: string) {
  const { data } = await api.post<ApiSuccess<AuthPayload>>("/auth/login", {
    identifier,
    password,
  });
  setStoredToken(data.data.token);
  return data.data;
}

export async function registerRequest(payload: {
  name: string;
  email: string;
  phone: string;
  password: string;
}) {
  const { data } = await api.post<ApiSuccess<AuthPayload>>("/auth/register", payload);
  setStoredToken(data.data.token);
  return data.data;
}

export async function fetchMe() {
  const { data } = await api.get<ApiSuccess<ProfileUser>>("/auth/me");
  return data.data;
}

export async function logoutRequest() {
  try {
    await api.post("/auth/logout");
  } finally {
    clearStoredToken();
  }
}

export async function forgotPasswordRequest(email: string) {
  const { data } = await api.post<ApiSuccess<{ resetToken: string; expiresIn: string }>>(
    "/auth/forgot-password",
    { email }
  );
  return data;
}

export async function resetPasswordRequest(token: string, newPassword: string) {
  const { data } = await api.post<ApiSuccess<null>>("/auth/reset-password", {
    token,
    newPassword,
  });
  return data;
}

export async function changePasswordRequest(
  currentPassword: string,
  newPassword: string
) {
  const { data } = await api.post<ApiSuccess<null>>("/auth/change-password", {
    currentPassword,
    newPassword,
  });
  return data;
}

export async function updateProfileRequest(payload: {
  name?: string;
  phone?: string;
  avatar?: string;
}) {
  const { data } = await api.put<ApiSuccess<ProfileUser>>("/users/profile", payload);
  return data.data;
}
