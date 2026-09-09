const DEFAULT_CLIENT_AVATARS: Record<string, string> = {
  "Sophia Chen": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80",
  "Marcus Vance": "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&auto=format&fit=crop&q=80",
  "Elena Rostova": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80",
  "David Park": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
  "Aisha Al-Mansoor": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
  "Alexander Wright": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
  "Dr. Robert Miller": "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=200&auto=format&fit=crop&q=80",
  "Chloe Zhao": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80",
};

export function getClientAvatar(client?: { name?: string; category?: string; avatarUrl?: string }): string {
  if (client?.avatarUrl && client.avatarUrl.trim().length > 5) {
    return client.avatarUrl;
  }
  const name = client?.name?.trim() || "";
  if (DEFAULT_CLIENT_AVATARS[name]) {
    return DEFAULT_CLIENT_AVATARS[name];
  }
  for (const [key, url] of Object.entries(DEFAULT_CLIENT_AVATARS)) {
    if (name.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(name.toLowerCase())) {
      return url;
    }
  }
  const allAvatars = Object.values(DEFAULT_CLIENT_AVATARS);
  if (allAvatars.length === 0) return "";
  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return allAvatars[hash % allAvatars.length];
}