"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type ProfileType = "human" | "agent";

export interface LinkedAgent {
  agentName: string;
  verifiedAt: string;
}

/** Off-chain reputation for the PFP section: followers, post interactions, comments. */
export interface MoltbookReputation {
  followersCount: number;
  /** Number of posts this profile has interacted with (likes, replies, etc.) */
  postsInteractedCount: number;
  /** Number of comments (or comment-like interactions) */
  commentsCount: number;
  /** Optional: last time reputation was synced from indexer/API */
  updatedAt?: string;
}

export interface MoltbookProfile {
  profileId: string;
  profileType: ProfileType;
  username?: string;
  displayName?: string;
  /** Off-chain reputation for PFP: followers, engagement, comments. Fetched from indexer/API, not on-chain. */
  reputation?: MoltbookReputation;
}

const STORAGE_KEY = "moltbook_profile";
const LINKED_AGENTS_KEY = "moltbook_linked_agents";

export function parseAgentUsername(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/moltbook\.com\/u\/([^\/\s?#]+)/i);
  if (match) return match[1];
  return trimmed;
}

const MoltbookAuthContext = createContext<{
  profile: MoltbookProfile | null;
  setProfile: (p: MoltbookProfile | null) => void;
  isLoading: boolean;
  signOut: () => void;
  linkedAgents: LinkedAgent[];
  linkAgent: (agentName: string) => void;
  unlinkAgent: (agentName: string) => void;
}>({
  profile: null,
  setProfile: () => {},
  isLoading: true,
  signOut: () => {},
  linkedAgents: [],
  linkAgent: () => {},
  unlinkAgent: () => {},
});

export function MoltbookAuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<MoltbookProfile | null>(null);
  const [linkedAgents, setLinkedAgents] = useState<LinkedAgent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw) as MoltbookProfile;
        const isDummy =
          p.username?.startsWith("user_") && /^mb_m[a-z0-9]+$/.test(p.profileId || "");
        if (isDummy) {
          localStorage.removeItem(STORAGE_KEY);
          setProfileState(null);
        } else {
          setProfileState(p);
        }
      }
      const agentsRaw = localStorage.getItem(LINKED_AGENTS_KEY);
      if (agentsRaw) {
        const agents = JSON.parse(agentsRaw) as LinkedAgent[];
        const fixed = agents.slice(0, 1).map((a) => ({
          ...a,
          agentName: parseAgentUsername(a.agentName) ?? a.agentName,
        }));
        setLinkedAgents(fixed);
        if (fixed.length > 0 && JSON.stringify(fixed) !== agentsRaw) {
          localStorage.setItem(LINKED_AGENTS_KEY, JSON.stringify(fixed));
        }
      }
    } catch {
      setProfileState(null);
      setLinkedAgents([]);
    }
    setIsLoading(false);
  }, []);

  const setProfile = (p: MoltbookProfile | null) => {
    setProfileState(p);
    if (p) localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    else localStorage.removeItem(STORAGE_KEY);
  };

  const linkAgent = (input: string) => {
    const username = parseAgentUsername(input);
    if (!username) return;
    const next = [
      { agentName: username, verifiedAt: new Date().toISOString() },
    ];
    setLinkedAgents(next);
    localStorage.setItem(LINKED_AGENTS_KEY, JSON.stringify(next));
  };

  const unlinkAgent = (agentName: string) => {
    const next = linkedAgents.filter(
      (a) => a.agentName.toLowerCase() !== agentName.toLowerCase()
    );
    setLinkedAgents(next);
    localStorage.setItem(LINKED_AGENTS_KEY, JSON.stringify(next));
  };

  const signOut = () => {
    setProfileState(null);
    setLinkedAgents([]);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LINKED_AGENTS_KEY);
  };

  return (
    <MoltbookAuthContext.Provider
      value={{
        profile,
        setProfile,
        isLoading,
        signOut,
        linkedAgents,
        linkAgent,
        unlinkAgent,
      }}
    >
      {children}
    </MoltbookAuthContext.Provider>
  );
}

export function useMoltbookAuth() {
  return useContext(MoltbookAuthContext);
}
