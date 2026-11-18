// Shared fictional facts. Every module must use these so the story stays consistent.
window.BOT_FACTS = {
  airline: { name: 'Meridian Air', code: 'MRD' },
  disclaimer: 'Fictional simulation inspired by recent real-world aviation technology disruptions. Not an actual airline incident. GitHub events shown are simulated.',
  repo: 'meridian-air/flight-platform',
  services: {
    gateway: 'API Gateway', checkin: 'Check-in', boarding: 'Boarding',
    flightops: 'Flight Ops', crew: 'Crew Scheduling', notify: 'Passenger Alerts',
  },
  // The change that causes the outage (PR #4821).
  change: {
    pr: 4821, title: 'Tune API gateway limits for peak departures', author: 'jtanaka', approvedBy: 'mokafor',
    branch: 'jtanaka/gateway-peak-limits', commit: 'a3f9c21', mergedAt: '13:58', deployedAt: '14:02',
    workflow: 'deploy-prod', environment: 'production',
    files: [
      { path: 'infra/gateway/limits.yaml', additions: 2, deletions: 2 },
      { path: 'infra/gateway/retry-policy.yaml', additions: 2, deletions: 2 },
    ],
    diff: [
      { file: 'infra/gateway/limits.yaml', lines: [
        { t: 'ctx', s: 'gateway:' },
        { t: 'del', s: '  rate_limit_enabled: true' },
        { t: 'add', s: '  rate_limit_enabled: false' },
        { t: 'del', s: '  rate_limit_per_client: 50' },
        { t: 'add', s: '  rate_limit_per_client: 5000' },
      ] },
      { file: 'infra/gateway/retry-policy.yaml', lines: [
        { t: 'ctx', s: 'retry:' },
        { t: 'del', s: '  max_attempts: 3' },
        { t: 'add', s: '  max_attempts: 0   # 0 = unlimited' },
        { t: 'del', s: '  backoff: exponential' },
        { t: 'add', s: '  backoff: none' },
      ] },
    ],
    // What passed, and what was never checked: the key GitHub lesson.
    checks: [
      { name: 'Unit tests', result: 'passed' },
      { name: 'Code scanning (CodeQL)', result: 'passed', note: 'No code alerts. Config was not analysed.' },
      { name: 'Secret scanning', result: 'passed' },
      { name: 'Dependency review', result: 'passed' },
    ],
    gaps: [
      'No CODEOWNERS rule for infra/: platform-sre never reviewed',
      'No policy check on gateway config (rate limiting may not be disabled)',
      'No staging load test or canary rollout',
      'Production approval bypassed by an "expedite" label',
    ],
  },
  monitoring: {
    spikeAt: '14:03',
    requestsPerSecNormal: 8000, requestsPerSecPeak: 96000,
    p95NormalMs: 180, p95PeakMs: 9400,
    checkinErrorRate: 0.38, avgRetriesPerRequest: 11,
    source: 'kiosks and mobile app retry storm',
  },
  deploys: [
    { id: 1187, title: 'Tune API gateway limits for peak departures', commit: 'a3f9c21', at: '14:02', status: 'succeeded' },
    { id: 1186, title: 'Update fare-rules cache TTL', commit: '7be41d0', at: '11:20', status: 'succeeded' },
    { id: 1185, title: 'Boarding-pass renderer fix', commit: '5d09ae3', at: 'yesterday', status: 'succeeded' },
  ],
  // The recovery change created by the ROLL BACK decision.
  rollback: { pr: 4822, title: 'Revert "Tune API gateway limits for peak departures"', branch: 'revert-4821', commit: 'c81d5e7', deploy: 1188, approver: 'on-call lead (platform-sre)' },
  security: {
    codeScanning: { tool: 'CodeQL', alert: '#17 Missing rate limiting on /api/checkin/retry', severity: 'Medium', where: 'PR #4790', autofix: 'Copilot Autofix suggested a fix' },
    secretScanning: { blocked: 'API token in scripts/kiosk-debug.sh', action: 'Push protection blocked the commit before it reached the repo' },
    dependencyReview: { pkg: 'yaml-lite@1.4.2', severity: 'High', fixedIn: '1.4.5', note: 'Simulated advisory (not a real CVE)' },
    protectedEnvironment: { env: 'production', requires: '2 approvals + platform-sre review', waitTimer: '5 min' },
  },
  // How guardrails would have caught PR #4821 (used by the replay).
  guardrails: [
    'CODEOWNERS routes infra/ changes to platform-sre',
    'Policy check fails the PR: "rate limiting must stay enabled"',
    'Protected environment holds production until approved',
    'Canary deploy (5%) trips alerts and auto-rolls back',
  ],
};
