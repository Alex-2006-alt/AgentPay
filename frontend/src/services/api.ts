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

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 20000,
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

  getAgentWallet: async (agentId: string = 'agent_primary'): Promise<Wallet> => {
    const res = await apiClient.get<Wallet>(`/agents/${agentId}/wallet`);
    return res.data;
  },

  // Policies
  getAgentPolicy: async (agentId: string = 'agent_primary'): Promise<Policy> => {
    const res = await apiClient.get<Policy>(`/agents/${agentId}/policies`);
    return res.data;
  },

  updateAgentPolicy: async (
    agentId: string = 'agent_primary',
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
    agentId: string = 'agent_primary'
  ): Promise<AgentTaskResponse> => {
    const res = await apiClient.post<AgentTaskResponse>('/agent/task', {
      agent_id: agentId,
      task,
    });
    return res.data;
  },

  // Direct Payment Request
  requestPayment: async (
    serviceId: string,
    amount: number,
    agentId: string = 'agent_primary'
  ) => {
    const res = await apiClient.post('/payments/request', {
      agent_id: agentId,
      service_id: serviceId,
      amount,
      currency: 'USDC',
    });
    return res.data;
  },
};
