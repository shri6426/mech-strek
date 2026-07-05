export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const getWsUrl = (path: string): string => {
  const wsBase = API_BASE_URL.replace(/^http/, 'ws');
  return `${wsBase}${path.startsWith('/') ? path : `/${path}`}`;
};

export const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    if (window.location.pathname.startsWith('/portal')) {
      return localStorage.getItem('client_token');
    }
    return localStorage.getItem('admin_token');
  }
  return null;
};

export const setAuthToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('admin_token', token);
  }
};

export const removeAuthToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('admin_token');
  }
};

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.message || `API request failed with status ${response.status}`);
  }

  return response.json();
}

export interface InquirySubmit {
  name: string;
  business?: string;
  email: string;
  phone?: string;
  details: string;
  budget: string;
}

export interface InquiryItem extends InquirySubmit {
  id: string;
  status: 'NEW' | 'CONTACTED' | 'MEETING_SCHEDULED' | 'PROPOSAL_SENT' | 'NEGOTIATION' | 'CONVERTED' | 'PROJECT' | 'ARCHIVED';
  created_at: string;
}

export interface PortfolioProject {
  id: string;
  title: string;
  category: string;
  client: string;
  year: string;
  description: string;
  challenge?: string;
  solution?: string;
  impact?: string;
  image_url: string;
  tags: string[];
  featured: boolean;
}

export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role: string;
  company: string;
  avatar_url?: string;
  rating: number;
}

export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  price_label?: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

// Public API Functions
export const submitContactForm = (data: InquirySubmit) => 
  apiFetch<{ id: string; status: string }>('/contact', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const fetchPortfolioProjects = (category?: string) => 
  apiFetch<PortfolioProject[]>(`/portfolio${category && category !== 'All' ? `?category=${encodeURIComponent(category)}` : ''}`);

export const fetchTestimonials = () => 
  apiFetch<Testimonial[]>('/testimonials');

export const fetchServices = () => 
  apiFetch<ServiceItem[]>('/services');

export const fetchFaqItems = () => 
  apiFetch<FaqItem[]>('/faq');

// Admin API Functions
export const adminLogin = async (username: string, password: string): Promise<{ access_token: string }> => {
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);

  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Login failed');
  }

  const data = await response.json();
  setAuthToken(data.access_token);
  return data;
};

export const fetchAdminInquiries = (status?: string) =>
  apiFetch<InquiryItem[]>(`/admin/inquiries${status ? `?status_filter=${status}` : ''}`);

export const updateInquiryStatus = (id: string, status: string) =>
  apiFetch<InquiryItem>(`/admin/inquiries/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });

export interface AdminDashboardMetrics {
  new_leads: number;
  today_meetings: number;
  invoices_pending: number;
  projects_due: number;
  overdue_tasks: number;
  revenue_this_month: number;
  recent_activity: {
    id: string;
    project_id: string;
    action: string;
    details: string;
    timestamp: string;
  }[];
}

export interface AdminProject {
  id: string;
  client_id: string;
  name: string;
  description?: string;
  status: string;
  progress_percent: number;
  start_date?: string;
  end_date?: string;
  today_update?: string;
}

export const fetchAdminDashboardMetrics = () =>
  apiFetch<AdminDashboardMetrics>('/admin/portal/dashboard-metrics');

export const fetchAdminProjects = () =>
  apiFetch<AdminProject[]>('/admin/portal/projects');

export const fetchAdminProjectDetails = (id: string) =>
  apiFetch<AdminProject>(`/admin/portal/projects/${id}`);

export const updateAdminProject = (id: string, data: Partial<AdminProject>) =>
  apiFetch<AdminProject>(`/admin/portal/projects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });

export interface AdminTimelineMilestone {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  due_date: string;
  is_completed: boolean;
  display_order: number;
}

export const fetchAdminProjectTimelines = (id: string) =>
  apiFetch<AdminTimelineMilestone[]>(`/admin/portal/projects/${id}/timelines`);

export interface AdminProjectFile {
  id: string;
  project_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  created_at: string;
}

export const fetchAdminProjectFiles = (id: string) =>
  apiFetch<AdminProjectFile[]>(`/admin/portal/projects/${id}/files`);

export const uploadAdminProjectFile = async (id: string, file: File): Promise<AdminProjectFile> => {
  const formData = new FormData();
  formData.append('file', file);

  const token = getAuthToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/admin/portal/projects/${id}/files/upload`, {
    method: 'POST',
    headers,
    body: formData
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'File upload failed');
  }

  return response.json();
};

export interface AdminProjectMessage {
  id: string;
  project_id: string;
  sender_id: string;
  message: string;
  created_at: string;
}

export const fetchAdminProjectMessages = (id: string) =>
  apiFetch<AdminProjectMessage[]>(`/admin/portal/projects/${id}/messages`);

export const postAdminProjectMessage = (id: string, message: string) =>
  apiFetch<AdminProjectMessage>(`/admin/portal/projects/${id}/messages`, {
    method: 'POST',
    body: JSON.stringify({ message })
  });

export interface AdminProjectActivity {
  id: string;
  project_id: string;
  action: string;
  details: string;
  timestamp: string;
}

export const fetchAdminProjectActivities = (id: string) =>
  apiFetch<AdminProjectActivity[]>(`/admin/portal/projects/${id}/activities`);

export interface CopilotResponse {
  reply: string;
}

export const fetchAICopilotResponse = (message: string) =>
  apiFetch<CopilotResponse>('/admin/ai/copilot', {
    method: 'POST',
    body: JSON.stringify({ message })
  });

export interface ClientDashboardData {
  project_name: string;
  progress_percent: number;
  today_update?: string;
  next_milestone?: {
    title: string;
    due_date: string;
  };
  outstanding_invoice_amount: number;
}

export const fetchClientDashboard = () =>
  apiFetch<ClientDashboardData>('/client/dashboard');
