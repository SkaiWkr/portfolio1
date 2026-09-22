/**
 * Single source of truth for portfolio content.
 * Every string here comes from the live site (https://sigmandal.vercel.app/ and its two case-study pages).
 * Nothing is invented. Edit here; components only render.
 */

export const site = {
  name: 'Siddhant Mandal',
  first: 'SIDDHANT',
  last: 'MANDAL',
  title: 'Computer Science Student — Cyber Security',
  descriptor: 'Computer Science (Cyber Security) student',
  tagline: ['Detect.', 'Analyze.', 'Defend.'] as const,
  summary:
    'Computer Science (Cyber Security) student specializing in Linux security, malware analysis, and detection engineering. Designs and builds system-level security tools — including a behavioral shellcode analysis framework and a Linux privilege-drift monitoring system — to detect and analyze security-relevant system behavior.',
  focus: 'Linux security, malware analysis, and detection engineering',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://siddhantmandal.dev',
  // The résumé PDF lives on the current site. To make this build self-contained, copy the PDF into /public
  // and change this to '/Siddhant_Mandal_Resume.pdf'.
  resume: 'https://sigmandal.vercel.app/Siddhant_Mandal_Resume.pdf',
  links: {
    github: { label: 'GitHub', handle: 'SkaiWkr', href: 'https://github.com/SkaiWkr' },
    linkedin: { label: 'LinkedIn', handle: 'sigmandal', href: 'https://linkedin.com/in/sigmandal' },
    email: { label: 'Email', handle: 'siddhantmandal31415@gmail.com', href: 'mailto:siddhantmandal31415@gmail.com' },
  },
} as const

export const about = {
  heading: 'Building tools that watch what code actually does',
  pillars: [
    { name: 'Detect', text: 'Builds tooling that surfaces suspicious system and binary behavior before it becomes an incident.' },
    { name: 'Analyze', text: 'Emulates and traces low-level execution — shellcode, syscalls, privilege state — to understand real intent.' },
    { name: 'Defend', text: 'Turns analysis into deterministic, auditable detection systems that security teams can trust.' },
  ],
} as const

export interface Stage {
  label: string
  text: string
}

export interface Project {
  slug: 'morphshell' | 'privdrift'
  name: string
  subtitle: string
  description: string
  tech: readonly string[]
  github: string
  overview: string
  problem: string
  architecture: readonly Stage[]
  solution: string
  implementation: readonly string[]
  challenges: readonly string[]
  lessons: readonly string[]
  future: readonly string[]
}

export const projectsIntro = {
  heading: 'Featured builds',
  text: 'Two system-level security tools — one for analyzing unknown binaries, one for watching privilege state drift over time.',
}

export const projects: readonly Project[] = [
  {
    slug: 'morphshell',
    name: 'MorphShell',
    subtitle: 'Sandboxed Shellcode Behavioral Analysis Framework',
    description:
      'A Python framework for sandboxed shellcode behavioral analysis, safely emulating raw shellcode with Unicorn Engine and disassembling instructions via Capstone instead of executing samples natively.',
    tech: ['Python', 'Unicorn Engine', 'Capstone', 'Scikit-learn'],
    github: 'https://github.com/SkaiWkr',
    overview:
      'MorphShell is a sandboxed framework for analyzing raw shellcode behaviorally rather than signature-by-signature. It emulates instructions instead of executing them natively, extracts a behavioral feature vector, and classifies the sample\u2019s likely intent with a trained model.',
    problem:
      'Signature-based detection struggles against novel or lightly obfuscated shellcode, and native execution of unknown samples is unsafe on analysis hosts. Analysts need a way to observe what shellcode does — not just what it looks like — without ever letting it run for real.',
    architecture: [
      { label: 'Emulation layer', text: 'Unicorn Engine emulates raw shellcode in an isolated CPU/memory context.' },
      { label: 'Disassembly layer', text: 'Capstone decodes executed instructions for inspection and tracing.' },
      {
        label: 'Feature extraction',
        text: 'A pipeline captures instruction flow, memory writes, Linux int 0x80 syscalls, loop structures, NOP sleds, and write-then-execute patterns.',
      },
      {
        label: 'Classification',
        text: 'A Random Forest model (scikit-learn) scores the extracted features against known behavioral families.',
      },
      { label: 'Reporting', text: 'Results are serialized to JSON with classification confidence for downstream review.' },
    ],
    solution:
      'By emulating rather than executing, MorphShell observes real instruction-level behavior — memory writes, syscalls, control flow — while keeping the host completely safe. That behavioral trace becomes a feature vector a classifier can reason about, turning raw execution traces into a confidence-scored verdict.',
    implementation: [
      'Unicorn Engine initializes an isolated emulated memory space and CPU context per sample.',
      'Capstone disassembles each executed instruction alongside emulation for human-readable tracing.',
      'A feature extractor watches the instruction stream for syscall invocations, memory write regions, loop back-edges, NOP sled runs, and write-then-execute sequences — common shellcode staging behavior.',
      'The resulting feature vector is passed to a trained Random Forest classifier, which outputs a predicted behavioral family and confidence score.',
      'A JSON report is generated summarizing the trace, extracted features, and classification result.',
    ],
    challenges: [
      'Distinguishing genuine malicious staging behavior (write-then-execute, NOP sleds) from benign-looking but structurally similar instruction sequences.',
      'Keeping emulation faithful enough to trigger the shellcode\u2019s real behavior without native execution risk.',
      'Building a feature set expressive enough for a classical ML model to separate behavioral families reliably.',
    ],
    lessons: [
      'Behavioral, feature-based detection generalizes better than static signatures against unseen samples.',
      'Emulation fidelity (accurate syscall and memory modeling) matters as much as the classifier itself.',
      'Clear, structured reporting (JSON) makes a research tool usable in an actual analyst workflow.',
    ],
    future: [
      'Expand syscall coverage beyond Linux int 0x80 to cover additional execution environments.',
      'Add support for multi-stage shellcode that downloads or decrypts secondary payloads mid-execution.',
      'Explore a lightweight neural classifier as a complement to the Random Forest baseline.',
    ],
  },
  {
    slug: 'privdrift',
    name: 'PrivDrift',
    subtitle: 'Linux Privilege Drift Monitoring Framework',
    description:
      'A lightweight, zero-dependency Linux framework that captures trusted system baselines and performs deterministic snapshot comparison to detect drift across SUID/SGID bits, sudo rules, privileged groups, UID 0 accounts, and cron entries.',
    tech: ['Python', 'Linux', 'HTML', 'JSON'],
    github: 'https://github.com/SkaiWkr',
    overview:
      'PrivDrift monitors Linux systems for unauthorized privilege changes by comparing live state against a trusted baseline — surfacing exactly what changed, where, and how risky it is.',
    problem:
      'Privilege escalation often leaves a quiet trail: a new SUID binary, a modified sudoers rule, a UID-0 account added outside normal provisioning. These changes are easy to miss without an established baseline to compare against, and most hosts have no lightweight way to track privilege drift over time.',
    architecture: [
      {
        label: 'Collector',
        text: 'Gathers current system state: SUID/SGID bits, sudo rules, privileged group membership, UID 0 accounts, and cron entries.',
      },
      { label: 'Baseline', text: 'Stores a trusted snapshot of system state to compare future collections against.' },
      { label: 'Detector', text: 'Performs deterministic snapshot comparison between the baseline and current state.' },
      { label: 'Reporter', text: 'Applies rule-based risk scoring and renders results as JSON reports and an HTML dashboard.' },
    ],
    solution:
      'PrivDrift treats a known-good system state as ground truth. Every subsequent run recollects the same signals and diffs them against that baseline, so any privilege-relevant change is caught deterministically rather than inferred heuristically — then scored by risk so the highest-impact drift surfaces first.',
    implementation: [
      'The Collector module walks the filesystem and system configuration for SUID/SGID binaries, sudoers rules, privileged group membership, UID 0 accounts, and cron entries.',
      'The Baseline module persists this collected state as the trusted reference snapshot.',
      'The Detector module performs a deterministic diff between the current collection and the stored baseline.',
      'The Reporter module applies rule-based risk scoring to each detected change and renders both a JSON report and an HTML dashboard for review.',
      'The entire pipeline runs with zero external dependencies, keeping it portable across Linux environments.',
    ],
    challenges: [
      'Keeping the tool dependency-free while still producing a readable HTML dashboard.',
      'Designing a risk-scoring model that ranks drift by real impact rather than flat severity.',
      'Ensuring deterministic comparisons so the same state never produces inconsistent diff results.',
    ],
    lessons: [
      'A clear Collector–Baseline–Detector–Reporter pipeline keeps each concern testable in isolation.',
      'Zero-dependency design pays off for a security tool meant to run on untrusted or minimal hosts.',
      'Rule-based risk scoring is often more transparent and auditable to security teams than opaque ML scoring for this kind of drift detection.',
    ],
    future: [
      'Add continuous/scheduled monitoring with alerting instead of manual snapshot comparison.',
      'Extend collection to include kernel module and capability-based privilege signals.',
      'Support baseline versioning to track intentional, approved privilege changes over time.',
    ],
  },
]

export const skillsIntro = {
  heading: 'A toolkit built around low-level analysis',
  text: 'Grouped by how each skill actually gets used — from writing the tools to running them against real systems.',
}

export interface SkillGroup {
  name: string
  items: readonly string[]
}

export const skills: readonly SkillGroup[] = [
  { name: 'Programming', items: ['Python', 'Java', 'C', 'C++', 'Bash', 'SQL'] },
  { name: 'Security Tools', items: ['Burp Suite', 'Wireshark', 'Nmap', 'Autopsy'] },
  { name: 'Security Frameworks', items: ['Unicorn Engine', 'Capstone', 'Scikit-learn'] },
  { name: 'Operating Systems', items: ['Arch Linux', 'BlackArch Linux', 'Windows'] },
  { name: 'Platforms', items: ['TryHackMe', 'Hack The Box'] },
  {
    name: 'Domains',
    items: [
      'Linux Security',
      'Malware Analysis',
      'Threat Detection',
      'Detection Engineering',
      'Behavioral Analysis',
      'Privilege Escalation',
      'Digital Forensics',
      'Reverse Engineering',
      'Cryptography',
      'Security Research',
      'Security Automation',
      'Network Security',
    ],
  },
]

export const experienceIntro = {
  heading: 'Where the work has happened',
  text: 'Internships, chapter leadership, and community organizing across the Nagpur security scene.',
}

export interface Role {
  org: string
  role: string
  period: string
  /** first month, ISO yyyy-mm */
  start: string
  /** last month, ISO yyyy-mm; null = ongoing */
  end: string | null
  note?: string
  points: readonly string[]
}

/** Shown newest-first by start date. Wording is unchanged from the live site. */
export const experience: readonly Role[] = [
  {
    org: 'BharatCares\u00ae',
    role: 'Cyber Security Intern',
    period: 'Jun 2026 – Jul 2026',
    start: '2026-06',
    end: '2026-07',
    note: '120 Hours',
    points: [
      'Performed malware and shellcode analysis using controlled execution and behavioral analysis techniques to examine sample activity.',
      'Applied reverse engineering methods to support analysis and built internal security tooling to strengthen detection workflows.',
    ],
  },
  {
    org: 'OWASP Nagpur',
    role: 'Core Team Member',
    period: 'May 2026 – Present',
    start: '2026-05',
    end: null,
    points: [
      'Coordinate chapter operations and technical programming as part of the core organizing team for a local OWASP chapter.',
      'Collaborate on planning and delivery of security-focused sessions and community initiatives within the chapter.',
    ],
  },
  {
    org: 'The Hacker\u2019s Meetup \u2014 Nagpur Chapter',
    role: 'Management Lead',
    period: 'Nov 2025 – Present',
    start: '2025-11',
    end: null,
    points: [
      'Lead end-to-end planning and execution of cybersecurity meetups as chapter head, coordinating speakers, logistics, and technical session delivery.',
    ],
  },
  {
    org: 'Phoenix Cybersecurity',
    role: 'Technical Team Member',
    period: 'Aug 2025 – Present',
    start: '2025-08',
    end: null,
    points: [
      'Assist in organizing cybersecurity workshops and national-level events, co-coordinating Hacker\u2019s Heist (Cyberpunk 3.0) and hosting EncipherX 4.0 at SVPCET.',
    ],
  },
  {
    org: 'SkillCraft Technology',
    role: 'Cyber Security Intern',
    period: 'Jun 2025 – Jul 2025',
    start: '2025-06',
    end: '2025-07',
    points: [
      'Performed vulnerability assessments and penetration testing to identify security weaknesses and attack vectors.',
      'Applied attack-simulation techniques to evaluate system security posture under controlled conditions.',
    ],
  },
]

export const achievementsIntro = { heading: 'Recognition along the way' }

export interface Achievement {
  /** the ordinal shown large */
  rank: string
  /** what the ordinal refers to, e.g. Place / Rank / Runner-Up */
  kind: string
  event: string
  context: string
}

export const achievements: readonly Achievement[] = [
  { rank: '1st', kind: 'Place', event: 'HackFusion 3.0', context: 'National Hackathon' },
  { rank: '2nd', kind: 'Place', event: 'Signal CTF', context: 'YCCE' },
  { rank: '15th', kind: 'Rank', event: 'ACN CTF', context: 'Amrita Vishwa Vidyapeetham' },
  { rank: '2nd', kind: 'Runner-Up', event: 'Gigagen', context: 'AI Verse 2.0' },
]

export const education = {
  heading: 'Academic background',
  school: 'St. Vincent Pallotti College of Engineering & Technology',
  degree: 'B.Tech in Computer Science & Engineering (Cyber Security)',
  location: 'Nagpur, India',
  cgpa: '9.29 / 10',
  period: 'Aug 2024 – Present',
}

export const certifications = [
  'IBM Cybersecurity Fundamentals',
  'Security Operations Center in Practice',
  'NPTEL Cyber Security and Privacy (Elite)',
  'EC-Council Ethical Hacking',
] as const

export const contact = {
  heading: 'ESTABLISH CONNECTION',
  lead: 'Let\u2019s talk security',
  text: 'Open to internships, research collaboration, and CTF teams. Reach out through any channel below.',
}

/** Story order = navigation order. `group` is the numbered chapter. */
export const chapters = [
  { id: 'top', n: '01', label: 'Identity' },
  { id: 'about', n: '02', label: 'About' },
  { id: 'operations', n: '03', label: 'Operations' },
  { id: 'arsenal', n: '04', label: 'Arsenal' },
  { id: 'field-log', n: '05', label: 'Field log' },
  { id: 'milestones', n: '06', label: 'Milestones' },
  { id: 'credentials', n: '07', label: 'Credentials' },
  { id: 'contact', n: '08', label: 'Contact' },
] as const

export type ChapterId = (typeof chapters)[number]['id']
