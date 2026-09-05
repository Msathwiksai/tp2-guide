import React, { useState } from 'react';
import PageShell, { Card, Section } from './PageShell';

const ENDPOINTS = [
  {
    method: 'POST',
    path: '/api/verify',
    summary: 'Check whether a name refers to real software before generating a guide for it.',
    request: `{
  "target": "Blender"
}`,
    response: `{
  "exists": true,
  "correctedName": "Blender",
  "reason": "Open-source 3D creation suite."
}`,
  },
  {
    method: 'POST',
    path: '/api/guide',
    summary: 'Generate a version-specific curriculum for one feature of one application.',
    request: `{
  "target": "Blender",
  "topic": "Sculpting basics",
  "version": "4.2",
  "mode": "Standard"
}`,
    response: `{
  "overview": "...",
  "whatItIs": "...",
  "whenToUse": ["..."],
  "howYouGetIt": "...",
  "steps": [
    {
      "title": "Enter sculpt mode",
      "description": "...",
      "difficulty": "Beginner",
      "visualCue": "...",
      "commands": []
    }
  ],
  "commonShortcuts": [{ "key": "Shift+Space", "action": "Brush menu" }],
  "beginnerChecklist": ["..."],
  "faqs": [{ "question": "...", "answer": "..." }],
  "sources": [{ "title": "...", "url": "..." }],
  "fromCache": false
}`,
  },
  {
    method: 'POST',
    path: '/api/chat',
    summary: 'Ask a contextual follow-up question about the software you are studying.',
    request: `{
  "context": "Blender",
  "question": "Why is my sculpt brush not affecting the mesh?"
}`,
    response: `{
  "text": "Check that your mesh has enough geometry..."
}`,
  },
  {
    method: 'POST',
    path: '/api/image',
    summary: 'Generate an instructional illustration for a step. Returns a URL to the cached PNG.',
    request: `{
  "app": "Blender",
  "version": "4.2",
  "stepTitle": "Enter sculpt mode",
  "visualCue": "Mode dropdown in the header"
}`,
    response: `{
  "image": "/api/image/lz4k2p-0"
}`,
  },
];

const METHOD_COLORS: Record<string, string> = {
  POST: 'bg-amber-500',
  GET: 'bg-emerald-500',
};

const Code: React.FC<{ children: string }> = ({ children }) => (
  <pre className="bg-stone-950 text-amber-300 rounded-2xl p-6 overflow-x-auto text-[11px] font-mono leading-relaxed border border-stone-800">
    <code>{children}</code>
  </pre>
);

const ApiDocs: React.FC = () => {
  const [open, setOpen] = useState<string | null>(ENDPOINTS[0].path);

  return (
    <PageShell
      icon="🔌"
      eyebrow="Resource Hub"
      title="API"
      intro="The same endpoints the app itself uses. JSON in, JSON out, rate limited per IP."
    >
      <Section title="Conventions">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <div className="text-3xl mb-4" aria-hidden="true">📦</div>
            <h3 className="font-black text-stone-900 mb-3">Content type</h3>
            <p className="text-stone-400 text-sm font-medium leading-relaxed">
              All requests are <code className="text-amber-600 font-mono">application/json</code>, capped at 12&nbsp;KB.
            </p>
          </Card>
          <Card>
            <div className="text-3xl mb-4" aria-hidden="true">⏱️</div>
            <h3 className="font-black text-stone-900 mb-3">Rate limit</h3>
            <p className="text-stone-400 text-sm font-medium leading-relaxed">
              24 write requests per minute per IP. Exceeding it returns <code className="text-amber-600 font-mono">429</code>.
            </p>
          </Card>
          <Card>
            <div className="text-3xl mb-4" aria-hidden="true">⚠️</div>
            <h3 className="font-black text-stone-900 mb-3">Errors</h3>
            <p className="text-stone-400 text-sm font-medium leading-relaxed">
              Failures return <code className="text-amber-600 font-mono">{'{ error }'}</code> with a 4xx or 5xx status.
            </p>
          </Card>
        </div>
      </Section>

      <Section title="Endpoints">
        <div className="space-y-5">
          {ENDPOINTS.map(endpoint => {
            const expanded = open === endpoint.path;
            return (
              <Card key={endpoint.path} className="!p-0 overflow-hidden">
                <button
                  onClick={() => setOpen(expanded ? null : endpoint.path)}
                  aria-expanded={expanded}
                  className="w-full flex flex-wrap items-center gap-5 p-8 text-left hover:bg-amber-50/40 transition-colors"
                >
                  <span className={`${METHOD_COLORS[endpoint.method]} text-white px-4 py-2 rounded-lg text-[10px] font-black tracking-widest`}>
                    {endpoint.method}
                  </span>
                  <code className="font-mono font-black text-stone-900">{endpoint.path}</code>
                  <span className="text-stone-400 text-sm font-medium flex-1 min-w-[200px]">{endpoint.summary}</span>
                  <span className={`text-2xl text-amber-500 transition-transform ${expanded ? 'rotate-45' : ''}`} aria-hidden="true">+</span>
                </button>
                {expanded && (
                  <div className="px-8 pb-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">Request</p>
                      <Code>{endpoint.request}</Code>
                    </div>
                    <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">Response</p>
                      <Code>{endpoint.response}</Code>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </Section>

      <Section title="Example">
        <Code>{`curl -X POST http://localhost:3001/api/guide \\
  -H 'Content-Type: application/json' \\
  -d '{"target":"Blender","topic":"Sculpting basics","version":"4.2","mode":"Standard"}'`}</Code>
      </Section>
    </PageShell>
  );
};

export default ApiDocs;
