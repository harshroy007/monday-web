import axios, { AxiosInstance } from 'axios';
import { API_URL, ENDPOINTS } from './constants';
import { getApiKey, clearApiKey } from './storage';
import * as Types from './types';

let apiClient: AxiosInstance | null = null;

function getClient(): AxiosInstance {
  if (!apiClient) {
    apiClient = axios.create({
      baseURL: API_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    apiClient.interceptors.request.use((config) => {
      const apiKey = getApiKey();
      if (apiKey && config.url !== ENDPOINTS.REGISTER && config.url !== ENDPOINTS.RECOVER_ACCOUNT) {
        config.headers['X-Jarvis-Key'] = apiKey;
      }
      return config;
    });

    apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          clearApiKey();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }
  return apiClient;
}

// Auth endpoints
export async function register(name: string, email: string): Promise<{ api_key: string; user_id: string }> {
  const res = await getClient().post(ENDPOINTS.REGISTER, { name, email });
  return res.data;
}

export async function sendOtp(email: string): Promise<{ success: boolean }> {
  const res = await getClient().post(ENDPOINTS.SEND_OTP, { email });
  return res.data;
}

export async function verifyOtp(email: string, otp: string): Promise<{ api_key: string }> {
  const res = await getClient().post(ENDPOINTS.VERIFY_OTP, { email, otp });
  return res.data;
}

export async function recoverAccount(email: string, otp: string): Promise<{ api_key: string }> {
  const res = await getClient().post(ENDPOINTS.RECOVER_ACCOUNT, { email, otp });
  return res.data;
}

// Main endpoints
export async function fetchDashboard(): Promise<Types.DashboardData> {
  const res = await getClient().get(ENDPOINTS.DASHBOARD);
  return res.data;
}

export async function fetchProfile(): Promise<Types.ProfileData> {
  const res = await getClient().get(ENDPOINTS.PROFILE);
  return res.data;
}

export async function fetchWiki(): Promise<Types.WikiData> {
  const res = await getClient().get(ENDPOINTS.WIKI);
  return res.data;
}

export async function fetchFeed(): Promise<Types.FeedEntry[]> {
  const res = await getClient().get(ENDPOINTS.FEED);
  return res.data;
}

export async function fetchConversation(): Promise<Types.ConversationMessage[]> {
  const res = await getClient().get(ENDPOINTS.CONVERSATION);
  return res.data;
}

export async function fetchMessages(): Promise<any[]> {
  const res = await getClient().get(ENDPOINTS.MESSAGES);
  return res.data;
}

export async function sendChat(message: string): Promise<Types.ChatResponse> {
  const res = await getClient().post(ENDPOINTS.CHAT, { message });
  return res.data;
}

export async function voiceQuery(audioFile: File): Promise<Types.VoiceQueryResponse> {
  const formData = new FormData();
  formData.append('audio', audioFile);
  const res = await getClient().post(ENDPOINTS.VOICE_QUERY, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function fetchGuardFull(): Promise<any> {
  const res = await getClient().get(ENDPOINTS.GUARD_FULL);
  return res.data;
}

export async function fetchActions(): Promise<any> {
  const res = await getClient().get(ENDPOINTS.ACTIONS);
  return res.data;
}

export async function fetchBrief(): Promise<{ brief: string }> {
  const res = await getClient().get(ENDPOINTS.BRIEF);
  return res.data;
}

export async function fetchEveningReview(): Promise<{ review: string }> {
  const res = await getClient().get(ENDPOINTS.EVENING);
  return res.data;
}

export async function rememberFact(fact: string): Promise<{ success: boolean }> {
  const res = await getClient().post(ENDPOINTS.REMEMBER, { fact });
  return res.data;
}

export async function pushToken(token: string): Promise<{ success: boolean }> {
  const res = await getClient().post(ENDPOINTS.PUSH_TOKEN, { token });
  return res.data;
}

export async function quickCheckin(energy: number, mood: string): Promise<{ success: boolean }> {
  const res = await getClient().post(ENDPOINTS.CHECKIN, { energy, mood });
  return res.data;
}

export async function fetchRitualQuestions(): Promise<any> {
  const res = await getClient().get(ENDPOINTS.RITUAL_QUESTIONS);
  return res.data;
}

export async function submitRitualAnswers(answers: Record<string, string>): Promise<{ success: boolean }> {
  const res = await getClient().post(ENDPOINTS.RITUAL_ANSWER, answers);
  return res.data;
}

export async function fetchChangelog(): Promise<any> {
  const res = await getClient().get(ENDPOINTS.CHANGELOG);
  return res.data;
}

export async function getPrivacySummary(): Promise<any> {
  const res = await getClient().get(ENDPOINTS.PRIVACY_SUMMARY);
  return res.data;
}

export async function clearAllData(): Promise<{ success: boolean }> {
  const res = await getClient().post(ENDPOINTS.PRIVACY_CLEAR, {});
  return res.data;
}

export async function fetchConfig(): Promise<any> {
  const res = await getClient().get(ENDPOINTS.CONFIG);
  return res.data;
}
