/**
 * Parses assistant message text for structured response blocks (wifi_diagnosis,
 * network_checklist, wifi_*, etc.) so the UI can render them with dedicated styled components.
 * Block format: ```blockType\ncontent\n```
 */

export type ResponseSegment =
  | { type: 'markdown'; content: string }
  | {
      type: 'wifi_diagnosis';
      content: string;
      parsed: { location: string; issue: string; severity: string };
    }
  | {
      type: 'network_checklist';
      content: string;
      parsed: {
        location: string;
        tasks: Array<{ name: string; status: string }>;
        health: string;
      };
    }
  | {
      type: 'wifi_root_cause';
      content: string;
      parsed: { location: string; items: string[] };
    }
  | {
      type: 'wifi_consequences';
      content: string;
      parsed: { items: string[] };
    }
  | {
      type: 'wifi_recommended_action';
      content: string;
      parsed: { items: string[] };
    }
  | {
      type: 'available_technicians';
      content: string;
      parsed: {
        technicians: Array<{ techId: string; name: string; zone: string; specialty: string; status: string }>;
      };
    }
  | {
      type: 'network_update';
      content: string;
      parsed: {
        location: string;
        body: string;
        technician?: { name: string; zone: string };
        nodes: Array<{ nodeId: string; status: 'online' | 'offline' | 'degraded' }>;
      };
    }
  | {
      type: 'wifi_performance_issue';
      content: string;
      parsed: {
        location: string;
        metric: string;
        pctChange: string;
        windowMins: string;
        currentValue?: string;
        baseline?: string;
        timestamp?: string;
      };
    }
  | {
      type: 'device_impact';
      content: string;
      parsed: {
        count: string;
        devices: Array<{ deviceId: string; type: string }>;
      };
    }
  | {
      type: 'wifi_followup';
      content: string;
      parsed: { question: string; actionId: string };
    }
  | {
      type: 'wifi_root_cause_actions';
      content: string;
      parsed: {
        technicians: Array<{ techId: string; name: string; zone: string; specialty: string; status: string }>;
        actions: Array<{ actionId: string; question: string }>;
      };
    }
  | {
      type: 'refresh_table';
      content: string;
      parsed: { table: string };
    }
  | {
      type: 'tech_assignment';
      content: string;
      parsed: { location: string; nodeId: string; assignedById: string };
    }
  | {
      type: 'knowledge_base';
      content: string;
      parsed: { header: string; items: string[]; footer?: string };
    };

const FENCE = '```';
const BLOCK_WIFI_DIAGNOSIS = 'wifi_diagnosis';
const BLOCK_NETWORK_CHECKLIST = 'network_checklist';
const BLOCK_WIFI_ROOT_CAUSE = 'wifi_root_cause';
const BLOCK_WIFI_CONSEQUENCES = 'wifi_consequences';
const BLOCK_WIFI_RECOMMENDED_ACTION = 'wifi_recommended_action';
const BLOCK_AVAILABLE_TECHNICIANS = 'available_technicians';
const BLOCK_NETWORK_UPDATE = 'network_update';
const BLOCK_WIFI_PERFORMANCE_ISSUE = 'wifi_performance_issue';
const BLOCK_DEVICE_IMPACT = 'device_impact';
const BLOCK_WIFI_FOLLOWUP = 'wifi_followup';
const BLOCK_WIFI_ROOT_CAUSE_ACTIONS = 'wifi_root_cause_actions';
const BLOCK_REFRESH_TABLE = 'refresh_table';
const BLOCK_TECH_ASSIGNMENT = 'tech_assignment';
const BLOCK_KNOWLEDGE_BASE = 'knowledge_base';

/** Matches opening fence then optional whitespace/newline then block type (for detection). */
const RE_WIFI_DIAGNOSIS = /```\s*wifi_diagnosis/i;
const RE_NETWORK_CHECKLIST = /```\s*network_checklist/i;
const RE_WIFI_ROOT_CAUSE = /```\s*wifi_root_cause/i;
const RE_WIFI_CONSEQUENCES = /```\s*wifi_consequences/i;
const RE_WIFI_RECOMMENDED_ACTION = /```\s*wifi_recommended_action/i;
const RE_AVAILABLE_TECHNICIANS = /```\s*available_technicians/i;
const RE_NETWORK_UPDATE = /```\s*network_update/i;
const RE_WIFI_PERFORMANCE_ISSUE = /```\s*wifi_performance_issue/i;
const RE_DEVICE_IMPACT = /```\s*device_impact/i;
const RE_WIFI_FOLLOWUP = /```\s*wifi_followup/i;
const RE_WIFI_ROOT_CAUSE_ACTIONS = /```\s*wifi_root_cause_actions/i;
const RE_REFRESH_TABLE = /```\s*refresh_table/i;
const RE_TECH_ASSIGNMENT = /```\s*tech_assignment/i;
const RE_KNOWLEDGE_BASE = /```\s*knowledge_base/i;

function parseRefreshTable(inner: string): { table: string } {
  const table = inner.trim().split(/\r?\n/)[0]?.trim() ?? '';
  return { table };
}

/** Parse wifi_diagnosis: line1=location, line2=issue, line3=severity. */
function parseWifiDiagnosis(inner: string): {
  location: string;
  issue: string;
  severity: string;
} {
  const lines = inner.trim().split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  return {
    location: lines[0] ?? '',
    issue: lines[1] ?? '',
    severity: lines[2] ?? 'medium',
  };
}

/** Parse network_checklist: line1=location, task lines=name\tstatus or name  status, last line=Healthline. */
function parseNetworkChecklist(inner: string): {
  location: string;
  tasks: Array<{ name: string; status: string }>;
  health: string;
} {
  const lines = inner.trim().split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  let location = '';
  const tasks: Array<{ name: string; status: string }> = [];
  let health = '';

  const healthPrefix = 'Health: ';

  for (const line of lines) {
    if (line.startsWith(healthPrefix)) {
      health = line.slice(healthPrefix.length).trim();
      continue;
    }
    if (!location) {
      location = line;
      continue;
    }
    const tab = line.indexOf('\t');
    const spaceRun = line.match(/\s{2,}/);
    const statusMatch = line.match(/\s+(pass|fail|warning|running|pending)$/i);
    const sep =
      tab >= 0
        ? tab
        : spaceRun?.index ?? (statusMatch ? line.length - statusMatch[0].length : -1);
    if (sep >= 0) {
      const name = line.slice(0, sep).trim();
      const status = line.slice(sep).trim();
      if (name && status) tasks.push({ name, status });
    }
  }

  return { location, tasks, health };
}

/** Parse wifi_root_cause: first line = location, rest = bullet items. */
function parseWifiRootCause(inner: string): { location: string; items: string[] } {
  const lines = inner.trim().split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return { location: '', items: [] };
  const location = lines[0];
  const items = lines.slice(1).map((l) => l.replace(/^-\s*/, '').trim()).filter(Boolean);
  return { location, items };
}

/** Parse wifi_consequences: each line = bullet item. */
function parseWifiConsequences(inner: string): { items: string[] } {
  const lines = inner.trim().split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const items = lines.map((l) => l.replace(/^-\s*/, '').trim()).filter(Boolean);
  return { items };
}

/** Parse wifi_recommended_action: each line = bullet item. */
function parseWifiRecommendedAction(inner: string): { items: string[] } {
  const lines = inner.trim().split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const items = lines.map((l) => l.replace(/^-\s*/, '').replace(/^\d+\.\s*/, '').trim()).filter(Boolean);
  return { items };
}

/** Parse available_technicians: each line = "techId – name | zone | specialty | status". */
function parseAvailableTechnicians(inner: string): {
  technicians: Array<{ techId: string; name: string; zone: string; specialty: string; status: string }>;
} {
  const lines = inner.trim().split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const technicians: Array<{ techId: string; name: string; zone: string; specialty: string; status: string }> = [];
  for (const line of lines) {
    const parts = line.split('|').map((p) => p.trim());
    if (parts.length >= 4) {
      technicians.push({
        techId: parts[0] ?? '',
        name: parts[1] ?? '',
        zone: parts[2] ?? '',
        specialty: parts[3] ?? '',
        status: parts[4] ?? 'available',
      });
    } else {
      const dashMatch = line.match(/\s+[–-]\s+/);
      if (dashMatch) {
        const dashIdx = line.indexOf(dashMatch[0]);
        const techId = line.slice(0, dashIdx).trim();
        const rest = line.slice(dashIdx + dashMatch[0].length).trim();
        technicians.push({ techId, name: rest, zone: '', specialty: '', status: 'available' });
      } else if (line.trim()) {
        technicians.push({ techId: '', name: line.trim(), zone: '', specialty: '', status: '' });
      }
    }
  }
  return { technicians };
}

/** Parse network_update: line1=location, line2=body, optional tech|name|zone, rest=nodeId|status. */
function parseNetworkUpdate(inner: string): {
  location: string;
  body: string;
  technician?: { name: string; zone: string };
  nodes: Array<{ nodeId: string; status: 'online' | 'offline' | 'degraded' }>;
} {
  const lines = inner.trim().split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return { location: '', body: '', nodes: [] };
  const location = lines[0];
  const body = lines[1] ?? '';
  let technician: { name: string; zone: string } | undefined;
  const nodes: Array<{ nodeId: string; status: 'online' | 'offline' | 'degraded' }> = [];
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i];
    if (line.toLowerCase().startsWith('tech|')) {
      const parts = line.slice(5).split('|').map((p) => p.trim());
      if (parts.length >= 2) technician = { name: parts[0], zone: parts[1] };
      continue;
    }
    const pipeIdx = line.indexOf('|');
    if (pipeIdx >= 0) {
      const nodeId = line.slice(0, pipeIdx).trim();
      const statusRaw = line.slice(pipeIdx + 1).trim().toLowerCase();
      const status = statusRaw === 'online' ? 'online' : statusRaw === 'degraded' ? 'degraded' : 'offline';
      if (nodeId) nodes.push({ nodeId, status });
    }
  }
  return { location, body, technician, nodes };
}

/** Parse wifi_performance_issue: line1=location, line2=metric, line3=pctChange, line4=windowMins, optional line5=currentValue|baseline|timestamp. */
function parseWifiPerformanceIssue(inner: string): {
  location: string;
  metric: string;
  pctChange: string;
  windowMins: string;
  currentValue?: string;
  baseline?: string;
  timestamp?: string;
} {
  const lines = inner.trim().split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 4) return { location: '', metric: '', pctChange: '', windowMins: '' };
  const [location, metric, pctChange, windowMins] = lines;
  const fifth = lines[4];
  let currentValue: string | undefined;
  let baseline: string | undefined;
  let timestamp: string | undefined;
  if (fifth) {
    const parts = fifth.split('|').map((p) => p.trim());
    currentValue = parts[0] || undefined;
    baseline = parts[1] || undefined;
    timestamp = parts[2] || undefined;
  }
  return { location, metric, pctChange, windowMins, currentValue, baseline, timestamp };
}

/** Parse device_impact: line1=count, rest=deviceId|type. */
function parseDeviceImpact(inner: string): {
  count: string;
  devices: Array<{ deviceId: string; type: string }>;
} {
  const lines = inner.trim().split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return { count: '0', devices: [] };
  const count = lines[0];
  const devices: Array<{ deviceId: string; type: string }> = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const pipeIdx = line.indexOf('|');
    if (pipeIdx >= 0) {
      const deviceId = line.slice(0, pipeIdx).trim();
      const type = line.slice(pipeIdx + 1).trim();
      if (deviceId) devices.push({ deviceId, type });
    }
  }
  return { count, devices };
}

/** Parse knowledge_base: header, bullet items, optional --- divider, optional footer. */
function parseKnowledgeBase(inner: string): {
  header: string;
  items: string[];
  footer?: string;
} {
  const lines = inner.trim().split(/\r?\n/).map((l) => l.trim());
  const headerLines: string[] = [];
  const items: string[] = [];
  let footer = '';
  let phase: 'header' | 'items' | 'footer' = 'header';

  for (const line of lines) {
    if (line === '---') {
      phase = 'footer';
      continue;
    }
    if (phase === 'header') {
      if (line.startsWith('- ')) {
        phase = 'items';
        items.push(line.slice(2).trim());
      } else {
        headerLines.push(line);
      }
      continue;
    }
    if (phase === 'items') {
      if (line.startsWith('- ')) {
        items.push(line.slice(2).trim());
      } else if (line === '---') {
        phase = 'footer';
      } else if (line) {
        items.push(line);
      }
      continue;
    }
    if (phase === 'footer' && line) {
      footer += (footer ? '\n' : '') + line;
    }
  }

  return {
    header: headerLines.join(' ').trim(),
    items,
    footer: footer.trim() || undefined,
  };
}

/** Parse tech_assignment: location|nodeId|assigned_by_id. */
function parseTechAssignment(inner: string): { location: string; nodeId: string; assignedById: string } {
  const line = inner.trim().split(/\r?\n/)[0]?.trim() ?? '';
  const parts = line.split('|').map((p) => p.trim());
  return {
    location: parts[0] ?? '',
    nodeId: parts[1] ?? '',
    assignedById: parts[2] ?? '',
  };
}

/** Parse wifi_followup: line1=actionId, line2=question. */
function parseWifiFollowup(inner: string): { question: string; actionId: string } {
  const lines = inner.trim().split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const actionId = lines[0] ?? '';
  const question = lines[1] ?? '';
  return { actionId, question };
}

/** Parse wifi_root_cause_actions: ---technicians--- section + ---actions--- section. */
function parseWifiRootCauseActions(inner: string): {
  technicians: Array<{ techId: string; name: string; zone: string; specialty: string; status: string }>;
  actions: Array<{ actionId: string; question: string }>;
} {
  const techsSection = inner.split(/---actions---/i)[0] ?? '';
  const actionsSection = inner.split(/---actions---/i)[1] ?? '';
  const techsInner = techsSection.replace(/---technicians---/i, '').trim();
  const technicians = techsInner ? parseAvailableTechnicians(techsInner).technicians : [];
  const actionLines = actionsSection.trim().split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const actions: Array<{ actionId: string; question: string }> = [];
  for (const line of actionLines) {
    const pipeIdx = line.indexOf('|');
    if (pipeIdx >= 0) {
      const actionId = line.slice(0, pipeIdx).trim();
      const question = line.slice(pipeIdx + 1).trim();
      if (actionId) actions.push({ actionId, question });
    }
  }
  return { technicians, actions };
}

/**
 * Splits message text into segments: markdown and structured blocks.
 * Recognises ```wifi_diagnosis ... ```, ```network_checklist ... ```, etc.
 */
export function parseResponseBlocks(text: string): ResponseSegment[] {
  const segments: ResponseSegment[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    const open = remaining.indexOf(FENCE);
    if (open < 0) {
      if (remaining.trim()) segments.push({ type: 'markdown', content: remaining });
      break;
    }

    const before = remaining.slice(0, open);
    if (before.trim()) segments.push({ type: 'markdown', content: before });
    remaining = remaining.slice(open + FENCE.length);
    // Allow optional whitespace/newline after ``` before language tag
    const afterFence = remaining.replace(/^\s+/, '');
    const newline = afterFence.indexOf('\n');
    const lang =
      newline >= 0
        ? afterFence.slice(0, newline).trim().toLowerCase()
        : afterFence.trim().toLowerCase();
    const contentStart =
      remaining.length - afterFence.length + (newline >= 0 ? newline + 1 : afterFence.length);
    const closeIdx = remaining.indexOf(FENCE, contentStart);
    if (closeIdx < 0) {
      segments.push({ type: 'markdown', content: FENCE + remaining });
      break;
    }

    const inner = remaining.slice(contentStart, closeIdx);
    remaining = remaining.slice(closeIdx + FENCE.length);

    if (lang === BLOCK_WIFI_DIAGNOSIS) {
      try {
        const parsed = parseWifiDiagnosis(inner);
        segments.push({ type: 'wifi_diagnosis', content: inner, parsed });
      } catch {
        segments.push({ type: 'markdown', content: FENCE + BLOCK_WIFI_DIAGNOSIS + '\n' + inner + FENCE });
      }
    } else if (lang === BLOCK_NETWORK_CHECKLIST) {
      try {
        const parsed = parseNetworkChecklist(inner);
        segments.push({ type: 'network_checklist', content: inner, parsed });
      } catch {
        segments.push({ type: 'markdown', content: FENCE + BLOCK_NETWORK_CHECKLIST + '\n' + inner + FENCE });
      }
    } else if (lang === BLOCK_WIFI_ROOT_CAUSE) {
      try {
        const parsed = parseWifiRootCause(inner);
        segments.push({ type: 'wifi_root_cause', content: inner, parsed });
      } catch {
        segments.push({ type: 'markdown', content: FENCE + BLOCK_WIFI_ROOT_CAUSE + '\n' + inner + FENCE });
      }
    } else if (lang === BLOCK_WIFI_CONSEQUENCES) {
      try {
        const parsed = parseWifiConsequences(inner);
        segments.push({ type: 'wifi_consequences', content: inner, parsed });
      } catch {
        segments.push({ type: 'markdown', content: FENCE + BLOCK_WIFI_CONSEQUENCES + '\n' + inner + FENCE });
      }
    } else if (lang === BLOCK_WIFI_RECOMMENDED_ACTION) {
      try {
        const parsed = parseWifiRecommendedAction(inner);
        segments.push({ type: 'wifi_recommended_action', content: inner, parsed });
      } catch {
        segments.push({ type: 'markdown', content: FENCE + BLOCK_WIFI_RECOMMENDED_ACTION + '\n' + inner + FENCE });
      }
    } else if (lang === BLOCK_AVAILABLE_TECHNICIANS) {
      try {
        const parsed = parseAvailableTechnicians(inner);
        segments.push({ type: 'available_technicians', content: inner, parsed });
      } catch {
        segments.push({ type: 'markdown', content: FENCE + BLOCK_AVAILABLE_TECHNICIANS + '\n' + inner + FENCE });
      }
    } else if (lang === BLOCK_NETWORK_UPDATE) {
      try {
        const parsed = parseNetworkUpdate(inner);
        segments.push({ type: 'network_update', content: inner, parsed });
      } catch {
        segments.push({ type: 'markdown', content: FENCE + BLOCK_NETWORK_UPDATE + '\n' + inner + FENCE });
      }
    } else if (lang === BLOCK_WIFI_PERFORMANCE_ISSUE) {
      try {
        const parsed = parseWifiPerformanceIssue(inner);
        segments.push({ type: 'wifi_performance_issue', content: inner, parsed });
      } catch {
        segments.push({ type: 'markdown', content: FENCE + BLOCK_WIFI_PERFORMANCE_ISSUE + '\n' + inner + FENCE });
      }
    } else if (lang === BLOCK_DEVICE_IMPACT) {
      try {
        const parsed = parseDeviceImpact(inner);
        segments.push({ type: 'device_impact', content: inner, parsed });
      } catch {
        segments.push({ type: 'markdown', content: FENCE + BLOCK_DEVICE_IMPACT + '\n' + inner + FENCE });
      }
    } else if (lang === BLOCK_WIFI_FOLLOWUP) {
      try {
        const parsed = parseWifiFollowup(inner);
        segments.push({ type: 'wifi_followup', content: inner, parsed });
      } catch {
        segments.push({ type: 'markdown', content: FENCE + BLOCK_WIFI_FOLLOWUP + '\n' + inner + FENCE });
      }
    } else if (lang === BLOCK_WIFI_ROOT_CAUSE_ACTIONS) {
      try {
        const parsed = parseWifiRootCauseActions(inner);
        segments.push({ type: 'wifi_root_cause_actions', content: inner, parsed });
      } catch {
        segments.push({ type: 'markdown', content: FENCE + BLOCK_WIFI_ROOT_CAUSE_ACTIONS + '\n' + inner + FENCE });
      }
    } else if (lang === BLOCK_REFRESH_TABLE) {
      try {
        const parsed = parseRefreshTable(inner);
        segments.push({ type: 'refresh_table', content: inner, parsed });
      } catch {
        segments.push({ type: 'markdown', content: FENCE + BLOCK_REFRESH_TABLE + '\n' + inner + FENCE });
      }
    } else if (lang === BLOCK_TECH_ASSIGNMENT) {
      try {
        const parsed = parseTechAssignment(inner);
        segments.push({ type: 'tech_assignment', content: inner, parsed });
      } catch {
        segments.push({ type: 'markdown', content: FENCE + BLOCK_TECH_ASSIGNMENT + '\n' + inner + FENCE });
      }
    } else if (lang === BLOCK_KNOWLEDGE_BASE) {
      try {
        const parsed = parseKnowledgeBase(inner);
        segments.push({ type: 'knowledge_base', content: inner, parsed });
      } catch {
        segments.push({ type: 'markdown', content: FENCE + BLOCK_KNOWLEDGE_BASE + '\n' + inner + FENCE });
      }
    } else {
      segments.push({
        type: 'markdown',
        content: FENCE + lang + (newline >= 0 ? '\n' + inner : '') + FENCE,
      });
    }
  }

  return segments;
}

/** Returns true if text contains any structured block we handle. */
export function hasResponseBlocks(text: string): boolean {
  return (
    RE_WIFI_DIAGNOSIS.test(text) ||
    RE_NETWORK_CHECKLIST.test(text) ||
    RE_WIFI_ROOT_CAUSE.test(text) ||
    RE_WIFI_CONSEQUENCES.test(text) ||
    RE_WIFI_RECOMMENDED_ACTION.test(text) ||
    RE_AVAILABLE_TECHNICIANS.test(text) ||
    RE_NETWORK_UPDATE.test(text) ||
    RE_WIFI_PERFORMANCE_ISSUE.test(text) ||
    RE_DEVICE_IMPACT.test(text) ||
    RE_WIFI_FOLLOWUP.test(text) ||
    RE_WIFI_ROOT_CAUSE_ACTIONS.test(text) ||
    RE_REFRESH_TABLE.test(text) ||
    RE_TECH_ASSIGNMENT.test(text) ||
    RE_KNOWLEDGE_BASE.test(text)
  );
}
