export interface ActivityEntry { id: string; action: string; actorLabel: string; createdAt: string }

export async function fetchMyWorkspaceActivity(_opts: { page: number; pageSize: number }): Promise<{ data: ActivityEntry[] }> {
  const now = Date.now();
  const mk = (i: number, action: string, actor: string): ActivityEntry => ({ id: `a${i}`, action, actorLabel: actor, createdAt: new Date(now - i * 3600_000).toISOString() });
  return { data: [mk(1, "organization.updated", "Raj Chaudhary"), mk(2, "member.invited", "Raj Chaudhary"), mk(3, "role.created", "Asha Verma")] };
}
