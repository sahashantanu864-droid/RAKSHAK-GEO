const API_BASE = 'http://127.0.0.1:8000/api/v1';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

export async function fetchCitySummary() {
  const res = await fetch(`${API_BASE}/city-data/summary`);
  if (!res.ok) throw new Error('Failed to fetch city summary');
  return res.json();
}

export async function optimizeResources(payload: any) {
  const res = await fetch(`${API_BASE}/optimization/optimize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to optimize');
  return res.json();
}

export async function runWhatIfSimulation(payload: any) {
  const res = await fetch(`${API_BASE}/what-if/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to run simulation');
  return res.json();
}

export async function fetchTimeline() {
  // Use sample payload endpoint if timeline history isn't populated
  const res = await fetch(`${API_BASE}/future-gap/sample-payload`);
  if (!res.ok) throw new Error('Failed to fetch timeline');
  return res.json();
}
