import axios from 'axios';
import type {
  Agent,
  AgentTaskResponse,
  AnalyticsSummary,
  Policy,
  Service,
  Transaction,
  Wallet,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
let activeAgentId = 'agent_primary';
export const selectAgent = (id: string) => { activeAgentId = id; };
export const setApiToken = (token: string) => {
  if (token) apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  else delete apiClient.defaults.headers.common.Authorization;
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 180000,
});

apiClient.interceptors.response.use(response => response, error => {
  const detail = error.response?.data?.detail;
  window.dispatchEvent(new CustomEvent('agentpay-api-error', {
    detail: typeof detail === 'string' ? detail : 'API request failed. Check your connection and credential.',
  }));
  return Promise.reject(error);
});

export const agentPayApi = {
  // System Health
  getHealth: async () => {
    const res = await apiClient.get('/health');
    return res.data;
  },

  // Services & Marketplace
  getServices: async (category?: string): Promise<Service[]> => {
    const res = await apiClient.get<Service[]>('/services', {
      params: category ? { category } : {},
    });
    return res.data;
  },

  getServiceById: async (serviceId: string): Promise<Service> => {
    const res = await apiClient.get<Service>(`/services/${serviceId}`);
    return res.data;
  },

  // Agents & Wallets
  getAgents: async (): Promise<Agent[]> => {
    const res = await apiClient.get<Agent[]>('/agents');
    return res.data;
  },

  getAgentWallet: async (agentId: string = activeAgentId): Promise<Wallet> => {
    const res = await apiClient.get<Wallet>(`/agents/${agentId}/wallet`);
    return res.data;
  },

  // Policies
  getAgentPolicy: async (agentId: string = activeAgentId): Promise<Policy> => {
    const res = await apiClient.get<Policy>(`/agents/${agentId}/policies`);
    return res.data;
  },

  updateAgentPolicy: async (
    agentId: string = activeAgentId,
    policy: Partial<Policy>
  ): Promise<Policy> => {
    const res = await apiClient.put<Policy>(`/agents/${agentId}/policies`, policy);
    return res.data;
  },

  // Transactions & Analytics
  getTransactions: async (status?: string): Promise<Transaction[]> => {
    const res = await apiClient.get<Transaction[]>('/transactions', {
      params: status ? { status } : {},
    });
    return res.data;
  },

  getAnalytics: async (): Promise<AnalyticsSummary> => {
    const res = await apiClient.get<AnalyticsSummary>('/transactions/analytics');
    return res.data;
  },

  // Agent Task Execution
  executeTask: async (
    task: string,
    agentId: string = activeAgentId,
    requestKey: string = crypto.randomUUID()
  ): Promise<AgentTaskResponse> => {
    const res = await apiClient.post<AgentTaskResponse>('/agent/task', {
      agent_id: agentId,
      task,
    }, { headers: { 'Idempotency-Key': requestKey } });
    return res.data;
  },

  // Direct Payment Request
  requestPayment: async (
    serviceId: string,
    amount: number,
    agentId: string = activeAgentId,
    requestKey: string = crypto.randomUUID()
  ) => {
    const res = await apiClient.post('/payments/request', {
      agent_id: agentId,
      service_id: serviceId,
      amount,
      currency: 'USDC',
    }, { headers: { 'Idempotency-Key': requestKey } });
    return res.data;
  },
};
