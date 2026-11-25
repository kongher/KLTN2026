import api from "./api";
import type { ApiSuccess } from "../types/auth";
import type { HomeContent, HomeSettings } from "../types/home";

export async function fetchHomeContent() {
  const { data } = await api.get<ApiSuccess<HomeContent>>("/home");
  return data.data;
}

export async function updateHomeSettings(payload: HomeSettings) {
  const { data } = await api.put<ApiSuccess<HomeSettings>>("/home/settings", payload);
  return data.data;
}
