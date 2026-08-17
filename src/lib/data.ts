import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  handle: string;
  display_name: string;
  bio: string | null;
  mission: string | null;
  location: string | null;
  avatar_url: string | null;
  created_at: string;
};

export type Creation = {
  id: string;
  user_id: string;
  title: string;
  tagline: string | null;
  story: string;
  materials: string[];
  category: string;
  waste_diverted_kg: number | null;
  price: number | null;
  currency: string;
  for_sale: boolean;
  seeking_support: boolean;
  image_url: string | null;
  created_at: string;
};

export type FeedItem = Creation & {
  profile: Profile | null;
  likes: number;
  comments: number;
};

export const CATEGORIES = [
  "furniture",
  "decor",
  "fashion",
  "jewellery",
  "stationery",
  "garden",
  "utility",
  "art",
  "other",
] as const;

const SIGNED_URL_TTL = 60 * 60 * 24 * 365;

export async function uploadCreationImage(userId: string, file: File) {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("creations").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  const { data, error: signError } = await supabase.storage
    .from("creations")
    .createSignedUrl(path, SIGNED_URL_TTL);
  if (signError) throw signError;
  return data.signedUrl;
}

async function decorate(rows: Creation[]): Promise<FeedItem[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((row) => row.id);
  const userIds = Array.from(new Set(rows.map((row) => row.user_id)));

  const [{ data: profiles }, { data: likes }, { data: comments }] = await Promise.all([
    supabase.from("profiles").select("*").in("id", userIds),
    supabase.from("likes").select("creation_id").in("creation_id", ids),
    supabase.from("comments").select("creation_id").in("creation_id", ids),
  ]);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p as Profile]));
  const count = (list: { creation_id: string }[] | null, id: string) =>
    (list ?? []).filter((row) => row.creation_id === id).length;

  return rows.map((row) => ({
    ...row,
    profile: profileMap.get(row.user_id) ?? null,
    likes: count(likes, row.id),
    comments: count(comments, row.id),
  }));
}

export async function fetchFeed(options: {
  category?: string | undefined;
  search?: string | undefined;
  onlyForSale?: boolean | undefined;
  onlySupport?: boolean | undefined;
  userId?: string | undefined;
  limit?: number | undefined;
} = {}): Promise<FeedItem[]> {
  let query = supabase
    .from("creations")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(options.limit ?? 60);

  if (options.category && options.category !== "all") query = query.eq("category", options.category);
  if (options.onlyForSale) query = query.eq("for_sale", true);
  if (options.onlySupport) query = query.eq("seeking_support", true);
  if (options.userId) query = query.eq("user_id", options.userId);
  if (options.search) {
    const term = `%${options.search}%`;
    query = query.or(`title.ilike.${term},story.ilike.${term},tagline.ilike.${term}`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return decorate((data ?? []) as Creation[]);
}

export async function fetchCreation(id: string) {
  const { data, error } = await supabase.from("creations").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const [item] = await decorate([data as Creation]);
  return item ?? null;
}

export async function fetchComments(creationId: string) {
  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("creation_id", creationId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  const userIds = Array.from(new Set((data ?? []).map((c) => c.user_id)));
  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("*").in("id", userIds)
    : { data: [] as Profile[] };
  const map = new Map((profiles ?? []).map((p) => [p.id, p as Profile]));
  return (data ?? []).map((c) => ({ ...c, profile: map.get(c.user_id) ?? null }));
}

export async function fetchProfileByHandle(handle: string) {
  const { data, error } = await supabase.from("profiles").select("*").eq("handle", handle).maybeSingle();
  if (error) throw error;
  return (data as Profile) ?? null;
}

export async function fetchMyProfile(userId: string) {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw error;
  return (data as Profile) ?? null;
}

export async function fetchFollowCounts(userId: string) {
  const [followers, following] = await Promise.all([
    supabase.from("follows").select("follower_id", { count: "exact", head: true }).eq("following_id", userId),
    supabase.from("follows").select("following_id", { count: "exact", head: true }).eq("follower_id", userId),
  ]);
  return { followers: followers.count ?? 0, following: following.count ?? 0 };
}

export async function fetchImpact() {
  const { data } = await supabase.from("creations").select("waste_diverted_kg");
  const total = (data ?? []).reduce((sum, row) => sum + Number(row.waste_diverted_kg ?? 0), 0);
  const { count: makers } = await supabase.from("profiles").select("id", { count: "exact", head: true });
  return { creations: data?.length ?? 0, wasteKg: Math.round(total), makers: makers ?? 0 };
}

export async function fetchCreationContact(creationId: string) {
  const { data, error } = await supabase
    .from("creation_contacts")
    .select("contact")
    .eq("creation_id", creationId)
    .maybeSingle();
  if (error) return null;
  return data?.contact ?? null;
}
