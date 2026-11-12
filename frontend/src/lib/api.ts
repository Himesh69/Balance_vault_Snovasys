const API_BASE = '';

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('bv_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('/') ? `${API_BASE}${endpoint}` : `${API_BASE}/${endpoint}`;

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const errorMsg = data?.error || data?.message || `Request failed with status ${res.status}`;
    const error = new Error(errorMsg);
    (error as any).status = res.status;
    (error as any).details = data?.details;
    throw error;
  }

  return data?.data !== undefined ? data.data : data;
}

export function formatCurrency(amountCents: number, currency = 'USD'): string {
  const val = (amountCents / 100).toFixed(2);
  return `${currency === 'USD' ? '$' : currency + ' '}${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

