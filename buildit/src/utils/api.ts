export async function fetchTenants() {
  const res = await fetch('/api/tenants');
  if (!res.ok) throw new Error('Failed to fetch tenants');
  return res.json();
}

export async function fetchTenantState(orgId: string) {
  const res = await fetch(`/api/tenants/${orgId}/state`);
  if (!res.ok) throw new Error('Failed to fetch tenant state');
  return res.json();
}

export async function runAutomatedChecks(orgId: string, actor: string, role: string) {
  const res = await fetch(`/api/tenants/${orgId}/checks/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actor, role })
  });
  if (!res.ok) throw new Error('Failed to run checks');
  return res.json();
}

export async function remediateCheck(orgId: string, checkId: string, actor: string, role: string) {
  const res = await fetch(`/api/tenants/${orgId}/checks/${checkId}/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actor, role })
  });
  if (!res.ok) throw new Error('Failed to remediate check');
  return res.json();
}

export async function approvePolicy(orgId: string, policyId: string, actor: string, role: string) {
  const res = await fetch(`/api/tenants/${orgId}/policies/${policyId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actor, role })
  });
  if (!res.ok) throw new Error('Failed to approve policy');
  return res.json();
}

export async function updatePolicyContent(orgId: string, policyId: string, content: string, actor: string, role: string) {
  const res = await fetch(`/api/tenants/${orgId}/policies/${policyId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, actor, role })
  });
  if (!res.ok) throw new Error('Failed to update policy');
  return res.json();
}

export async function generatePolicyWithAI(orgId: string, policyType: string, companyContext: any, actor: string) {
  const res = await fetch('/api/ai/generate-policy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orgId, policyType, companyContext, actor })
  });
  if (!res.ok) throw new Error('Failed to generate policy');
  return res.json();
}

export async function autofillQuestionnaireWithAI(orgId: string, actor: string) {
  const res = await fetch('/api/ai/autofill-questionnaire', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orgId, actor })
  });
  if (!res.ok) throw new Error('Failed to autofill questionnaire');
  return res.json();
}

export async function approveQuestionnaireItem(orgId: string, itemId: string, notes: string, actor: string, role: string) {
  const res = await fetch(`/api/tenants/${orgId}/questionnaire/items/${itemId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes, actor, role })
  });
  if (!res.ok) throw new Error('Failed to approve item');
  return res.json();
}

export async function generateLeadershipReportWithAI(orgId: string, quarter: string, actor: string) {
  const res = await fetch('/api/ai/generate-report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orgId, quarter, actor })
  });
  if (!res.ok) throw new Error('Failed to generate report');
  return res.json();
}

export async function approveLeadershipReport(orgId: string, actor: string, notes: string) {
  const res = await fetch(`/api/tenants/${orgId}/leadership-report/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actor, notes })
  });
  if (!res.ok) throw new Error('Failed to approve report');
  return res.json();
}

export async function addRisk(orgId: string, riskData: any, actor: string) {
  const res = await fetch(`/api/tenants/${orgId}/risks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...riskData, actor })
  });
  if (!res.ok) throw new Error('Failed to add risk');
  return res.json();
}

export async function updateTaskStatus(orgId: string, taskId: string, status: string, actor: string) {
  const res = await fetch(`/api/tenants/${orgId}/roadmap/tasks/${taskId}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, actor })
  });
  if (!res.ok) throw new Error('Failed to update task status');
  return res.json();
}

export async function addRoadmapTask(orgId: string, taskData: any, actor: string) {
  const res = await fetch(`/api/tenants/${orgId}/roadmap/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...taskData, actor })
  });
  if (!res.ok) throw new Error('Failed to add task');
  return res.json();
}

export async function updateMilestoneStatus(orgId: string, milestoneId: string, status: string, actor: string, role: string) {
  const res = await fetch(`/api/tenants/${orgId}/milestones/${milestoneId}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, actor, role })
  });
  if (!res.ok) throw new Error('Failed to update milestone status');
  return res.json();
}

export async function addMilestone(orgId: string, milestoneData: any, actor: string) {
  const res = await fetch(`/api/tenants/${orgId}/milestones`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...milestoneData, actor })
  });
  if (!res.ok) throw new Error('Failed to add milestone');
  return res.json();
}
