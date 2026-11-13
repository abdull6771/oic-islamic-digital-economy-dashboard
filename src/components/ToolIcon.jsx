/** Small, native SVG icons following the supplied landing-page design. */
export default function ToolIcon({ name, size = 22, ...props }) {
  const drawings = {
    toolkit: <><rect x="3" y="8" width="18" height="12" rx="2" /><path d="M9 8V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3M3 13h18M10 13v2h4v-2" /></>,
    explore: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    simulate: <path d="M4 21v-7m0-4V3m8 18v-9m0-4V3m8 18v-5m0-4V3M1 14h6m2-6h6m2 8h6" />,
    learn: <path d="M9 18h6m-5 3h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3Z" />,
    data: <><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" /></>,
    overview: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    profiles: <path d="M5 21V4m0 0h12l-2.5 4.5L17 13H5" />,
    compare: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M12 4v16" /></>,
    pillar: <path d="M4 20h16M7 16V9m5 7V5m5 11v-4" />,
    geo: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z" /></>,
    trends: <path d="m3 17 6-6 4 4 8-8m-6 0h6v6" />,
    divide: <path d="M12 3v18M8 8l-4 4 4 4m8-8 4 4-4 4" />,
    whatif: <path d="M4 20h16M6 16l4-5 3 3 5-7m-3 0h3v3" />,
    builder: <path d="M12 3v18m-6 0h12M4 7h16M7 7l-3 7a3 3 0 0 0 6 0Zm10 0-3 7a3 3 0 0 0 6 0Z" />,
    peers: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 4 6" /></>,
    policy: <><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5Z" /></>,
    quality: <path d="m12 3 8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6Zm-3.5 9 2.5 2.5 4.5-4.5" />,
    stats: <path d="M3 12h4l3 8 4-16 3 8h4" />,
    methodology: <path d="M4 5a2 2 0 0 1 2-2h14v16H6a2 2 0 0 0-2 2Zm0 16V5m4 2h8m-8 4h6" />,
    reports: <path d="M12 3v12m-5-5 5 5 5-5M4 21h16" />,
    history: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    lock: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
  };

  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...props}>
    {drawings[name] || drawings.toolkit}
  </svg>;
}
