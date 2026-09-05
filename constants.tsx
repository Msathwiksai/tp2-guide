
import { Tutorial, Category } from './types';

export const TUTORIALS: Tutorial[] = [
  // --- Operating Systems ---
  {
    id: 'windows',
    name: 'Windows',
    category: Category.OS,
    description: 'Learn the Microsoft OS from file management to professional power settings.',
    icon: '🪟',
    color: 'bg-blue-500',
    popularTopics: ['Installation Guide', 'Updating Windows', 'Taskbar & Start Menu', 'File Explorer Basics', 'System Settings'],
    advancedTopics: ['PowerShell Automation', 'Registry Editor Tweaks', 'Group Policy Management', 'Windows Subsystem for Linux (WSL2)', 'VHDX Virtualization'],
    versions: ['11', '10']
  },
  {
    id: 'macos',
    name: 'macOS',
    category: Category.OS,
    description: 'Master the Mac experience, including Finder, Manager, and Settings.',
    icon: '🍎',
    color: 'bg-slate-800',
    popularTopics: ['Installation & Setup', 'Software Updates', 'Stage Manager', 'System Settings', 'Trackpad Gestures'],
    advancedTopics: ['Terminal & Zsh Mastery', 'Brew Package Manager', 'Launchd Agents', 'Automator & AppleScript', 'Disk Utility Expert Mode'],
    versions: ['26', '15 (Sequoia)', '14 (Sonoma)']
  },
  {
    id: 'android',
    name: 'Android',
    category: Category.OS,
    description: 'Master the worlds most popular mobile operating system.',
    icon: '🤖',
    color: 'bg-green-500',
    popularTopics: ['System Updates', 'Customizing Home Screen', 'Managing Permissions', 'Battery Optimization', 'Google Play Security'],
    advancedTopics: ['Developer Options & ADB', 'Sideloading Apps', 'Custom Launchers', 'Rooting Concepts', 'Work Profile Setup'],
    versions: ['17', '16', '15']
  },
  {
    id: 'ios',
    name: 'iOS',
    category: Category.OS,
    description: 'Intuitive mobile mastery for iPhone and iPad users.',
    icon: '📱',
    color: 'bg-stone-900',
    popularTopics: ['iOS Updates', 'Control Center Setup', 'iCloud Backup', 'FaceID & Security', 'Widget Configuration'],
    advancedTopics: ['Shortcuts Automation', 'Focus Mode Filters', 'Advanced Privacy Reports', 'App Store Subscription Management', 'Beta Profile Installation'],
    versions: ['26', '18', '17']
  },
  {
    id: 'ubuntu',
    name: 'Ubuntu Linux',
    category: Category.OS,
    description: 'The most popular Linux distribution for desktop and server.',
    icon: '🐧',
    color: 'bg-orange-600',
    popularTopics: ['LTS Installation', 'The GNOME Desktop', 'Software Center Basics', 'Updating via Terminal', 'User Management'],
    advancedTopics: ['Bash Scripting', 'Nginx Web Server Setup', 'SSH Security Config', 'UFW Firewall Management', 'Docker Installation'],
    versions: ['26.04 LTS', '24.04 LTS']
  },

  // --- Development & DevOps ---
  {
    id: 'intellij',
    name: 'IntelliJ IDEA',
    category: Category.DEV,
    description: 'The premier IDE for Java and Kotlin development.',
    icon: '💎',
    color: 'bg-red-500',
    popularTopics: ['SDK Installation', 'Project Structure', 'Smart Code Completion', 'Debugging Basics', 'Version Control Integration'],
    advancedTopics: ['Custom Plugin Development', 'Advanced Refactoring Tools', 'Profiler & Memory Analysis', 'Build Tool Optimization (Maven/Gradle)', 'Database Tool Window'],
    versions: ['2026.2', '2026.1', '2025.3']
  },
  {
    id: 'vscode',
    name: 'VS Code',
    category: Category.DEV,
    description: 'The lightweight but powerful code editor for everything.',
    icon: '🟦',
    color: 'bg-blue-600',
    popularTopics: ['Extension Marketplace', 'Integrated Terminal', 'Keybinding Customization', 'Workspace Settings', 'Basic Debugging'],
    advancedTopics: ['Dev Containers', 'Remote Development (SSH)', 'Custom Snippets', 'Launch.json Configuration', 'Multi-root Workspaces'],
    versions: ['Current Stable']
  },
  // Fix: Added missing 'color' and removed duplicate 'category' property
  {
    id: 'docker',
    name: 'Docker',
    category: Category.DEVOPS,
    description: 'Containerize your applications for seamless deployment.',
    icon: '🐳',
    color: 'bg-blue-400',
    popularTopics: ['Docker Desktop Install', 'Images vs Containers', 'Basic CLI Commands', 'Dockerfile Basics', 'Docker Hub Intro'],
    advancedTopics: ['Multi-stage Builds', 'Docker Compose Orchestration', 'Network & Volume Management', 'Container Security Hardening', 'Kubernetes Integration'],
    versions: ['Desktop', 'Engine']
  },
  {
    id: 'github-desktop',
    name: 'GitHub Desktop',
    category: Category.DEV,
    description: 'A beautiful way to manage your Git workflow.',
    icon: '🐙',
    color: 'bg-stone-950',
    popularTopics: ['Installation Guide', 'Cloning Repositories', 'Commit Basics', 'Branching Logic', 'Merge Conflict Resolution'],
    advancedTopics: ['Git LFS Management', 'Stashing Workflows', 'Rebasing via GUI', 'CI/CD Status Monitoring', 'Enterprise Server Connect'],
    versions: ['3.x']
  },

  // --- Design & Creative ---
  {
    id: 'figma',
    name: 'Figma',
    category: Category.DESIGN,
    description: 'Industry-standard collaborative interface design.',
    icon: '🎨',
    color: 'bg-purple-600',
    popularTopics: ['Desktop App Install', 'Auto Layout Basics', 'Component Creation', 'Prototyping Flows', 'Dev Mode Intro'],
    advancedTopics: ['Variable Logic', 'Advanced Prototyping Expressions', 'Design System Architecture', 'Plugin API Development', 'Multi-player Collaboration Setup'],
    versions: ['Current Web/Desktop']
  },
  {
    id: 'photoshop',
    name: 'Adobe Photoshop',
    category: Category.CREATIVE,
    description: 'Learn layers, masks, and generative photo editing.',
    icon: '🖌️',
    color: 'bg-blue-900',
    popularTopics: ['Adobe Creative Cloud Install', 'Understanding Layers', 'Selection Tools', 'Generative Fill', 'Camera Raw Basics'],
    advancedTopics: ['Non-Destructive Action Scripts', 'Frequency Separation', '3D Post-Production', 'Advanced Masking with Channels', 'Custom Brush Engineering'],
    versions: ['2026', '2025']
  },

  // --- Office & Productivity ---
  {
    id: 'excel',
    name: 'Microsoft Excel',
    category: Category.OFFICE,
    description: 'Spreadsheets, formulas, and data visualization.',
    icon: '📊',
    color: 'bg-green-700',
    popularTopics: ['Office 365 Installation', 'Pivot Tables', 'XLOOKUP & Formulas', 'Conditional Formatting', 'Data Cleaning'],
    advancedTopics: ['VBA Macro Development', 'Lambda Functions', 'Power Pivot Data Modeling', 'Array Formulas (M-Code)', 'Solver & Data Analysis Toolpak'],
    versions: ['Microsoft 365', '2021']
  },
  {
    id: 'notion',
    name: 'Notion',
    category: Category.PRODUCTIVITY,
    description: 'The all-in-one workspace for notes and databases.',
    icon: '📝',
    color: 'bg-stone-900',
    popularTopics: ['Desktop App Install', 'Blocks & Pages', 'Database Basics', 'Templates Library', 'AI Assistant Intro'],
    advancedTopics: ['Database Relations & Rollups', 'Formula 2.0 Syntax', 'Notion AI Workflows', 'API & Integration (Zapier)', 'Workspace Permission Architecting'],
    versions: ['Current']
  },

  // --- Team Collaboration & Communication ---
  {
    id: 'slack',
    name: 'Slack',
    category: Category.COLLABORATION,
    description: 'Master enterprise-level messaging and automation.',
    icon: '💬',
    color: 'bg-stone-900',
    popularTopics: ['App Installation', 'Channel Management', 'Huddles & Calls', 'Notification Tuning', 'Search & Filtering'],
    advancedTopics: ['Workflow Builder Automation', 'Enterprise Grid Scaling', 'App Directory Integration', 'Custom Bot Logic', 'Security Policy Config'],
    versions: ['Desktop', 'Web']
  },
  {
    id: 'discord',
    name: 'Discord',
    category: Category.COMMUNICATION,
    description: 'Communication hub for communities and gaming.',
    icon: '👾',
    color: 'bg-indigo-600',
    popularTopics: ['Desktop App Install', 'Server Creation', 'Roles & Permissions', 'Audio/Video Settings', 'Nitro Perks'],
    advancedTopics: ['Bot Integration API', 'Webhook Automation', 'Server Boosting Perks', 'Developer Mode Debugging', 'Community Safety Auto-Mod'],
    versions: ['Stable']
  },

  // --- Streaming & Media ---
  {
    id: 'spotify',
    name: 'Spotify',
    category: Category.STREAMING,
    description: 'Master your music library and podcasts.',
    icon: '🎧',
    color: 'bg-green-600',
    popularTopics: ['Desktop App Install', 'Playlist Creation', 'Podcast Management', 'Family Plan Setup', 'Local Files Sync'],
    advancedTopics: ['Spotify For Artists UI', 'Advanced EQ Settings', 'API Data Visualization', 'Canvas Creation', 'Cross-Device Playback Logic'],
    versions: ['Desktop', 'Mobile']
  },

  // --- E-Commerce ---
  {
    id: 'amazon-seller',
    name: 'Amazon Seller Central',
    category: Category.E_COMMERCE,
    description: 'Navigate the Amazon merchant platform.',
    icon: '📦',
    color: 'bg-orange-500',
    popularTopics: ['Account Registration', 'Inventory Management', 'Shipment Tracking', 'Billing Dashboards', 'FBA Basics'],
    advancedTopics: ['PPC Advertising Architecting', 'A+ Content Strategy', 'Brand Registry Workflow', 'Global Expansion Config', 'API Data Retrieval'],
    versions: ['Current']
  }
];

export const GLOBAL_BASICS = [
  { title: 'Copy Item', keys: 'Ctrl + C / Cmd + C', icon: '📋' },
  { title: 'Paste Item', keys: 'Ctrl + V / Cmd + V', icon: '📥' },
  { title: 'Undo Action', keys: 'Ctrl + Z / Cmd + Z', icon: '↩️' },
  { title: 'Save Progress', keys: 'Ctrl + S / Cmd + S', icon: '💾' },
  { title: 'Find Content', keys: 'Ctrl + F / Cmd + F', icon: '🔍' },
  { title: 'Switch Apps', keys: 'Alt + Tab / Cmd + Tab', icon: '🔄' },
  { title: 'New Tab/Window', keys: 'Ctrl + N / Cmd + N', icon: '🆕' },
  { title: 'Close Current', keys: 'Ctrl + W / Cmd + W', icon: '❌' },
  { title: 'Select All', keys: 'Ctrl + A / Cmd + A', icon: '✨' },
  { title: 'Refresh Page', keys: 'Ctrl + R / F5', icon: '🔃' },
  { title: 'Screenshot', keys: 'Win + Shift + S', icon: '📸' },
  { title: 'Print Page', keys: 'Ctrl + P / Cmd + P', icon: '🖨️' },
];
