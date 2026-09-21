export interface Service {
  id: string;
  provider_id: string;
  name: string;
  description?: string;
  category: string;
  endpoint: string;
  price: number;
  currency: string;
  rating: number;
  success_rate: number;
  average_response_time: number;
  status: 'active' | 'degraded' | 'maintenance';
  created_at: string;
}

export interface Agent {
  id: string;
  user_id: string;
  name: string;
  status: 'active' | 'paused' | 'disabled';
  wallet_address: string;
  created_at: string;
}

export interface Wallet {
  id: string;
  agent_id: string;
  address: string;
  network: string;
  chain_id: number;
  balance: number;
  currency: string;
  updated_at: string;
}

export interface Policy {
  id: string;
  agent_id: string;
  max_transaction: number;
  daily_limit: number;
  monthly_limit: number;
  auto_payment: boolean;
  approved_services: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  agent_id: string;
  service_id: string;
  service_name?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'completed' | 'simulated' | 'rejected' | 'failed';
  rejection_reason?: string;
  tx_hash?: string;
  block_number?: number;
  created_at: string;
}

export interface AnalyticsSummary {
  total_spend: number;
  daily_spend: number;
  monthly_spend: number;
  total_transactions: number;
  successful_transactions: number;
  failed_transactions: number;
  active_services_count: number;
  wallet_balance: number;
}

export interface ExecutionStep {
  step_number: number;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  service_id?: string;
  cost?: number;
  tx_hash?: string;
}

export interface AgentTaskResponse {
  settlement_mode: 'simulation' | 'live';
  task_id: string;
  task: string;
  status: 'completed' | 'blocked_by_policy' | 'pending' | 'error';
  steps: ExecutionStep[];
  final_output?: string;
  total_cost: number;
  transactions: string[];
  error?: string;
}
