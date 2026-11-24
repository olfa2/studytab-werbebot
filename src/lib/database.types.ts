export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Rel = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

type T<R, I, Rels extends Rel[] = []> = {
  Row: R;
  Insert: I;
  Update: Partial<I>;
  Relationships: Rels;
};

export type DraftStatus = "entwurf" | "freigegeben" | "verworfen" | "gepostet" | "fehler";

export type Account = {
  id: string;
  slot: string;
  handle: string | null;
  platform: string;
  description: string | null;
  style_notes: string | null;
  studytab_share: number | null;
  is_business: boolean;
  created_at: string;
};
export type Trend = {
  id: string;
  week: string;
  source: string;
  source_url: string | null;
  hook: string | null;
  format: string | null;
  structure: string | null;
  topic: string | null;
  sound: string | null;
  hashtags: string[];
  views: number | null;
  likes: number | null;
  shares: number | null;
  growth_7d: number | null;
  rank: number | null;
  notes: string | null;
  author: string | null;
  posted_at: string | null;
  saves: number | null;
  comments: number | null;
  slide_count: number | null;
  search_query: string | null;
  created_at: string;
};
export type Draft = {
  id: string;
  trend_id: string | null;
  account_id: string;
  slides: Json;
  image_paths: string[];
  caption: string | null;
  hashtags: string[];
  mentions_studytab: boolean;
  is_ad: boolean;
  status: DraftStatus;
  planned_at: string | null;
  experiment: string | null;
  title: string | null;
  template: "notiz" | "marke";
  sound_hint: string | null;
  created_at: string;
  updated_at: string;
};
export type Post = {
  id: string;
  draft_id: string | null;
  account_id: string;
  tiktok_id: string | null;
  url: string | null;
  posted_at: string | null;
  created_at: string;
};
export type PostStat = {
  post_id: string;
  date: string;
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
  avg_watch_s: number | null;
  full_watch_rate: number | null;
  new_followers: number | null;
  profile_visits: number | null;
};
export type AccountStat = {
  account_id: string;
  date: string;
  followers: number | null;
  views: number | null;
  profile_visits: number | null;
};
export type Insight = {
  id: string;
  account_id: string | null;
  category: string;
  rule: string;
  based_on_posts: number;
  week: string;
  active: boolean;
  created_at: string;
};

type Opt<R, K extends keyof R> = Omit<R, K> & Partial<Pick<R, K>>;

export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.18" };
  public: {
    Tables: {
      accounts: T<Account, Opt<Account, "id" | "created_at" | "handle" | "platform" | "description" | "style_notes" | "studytab_share" | "is_business">>;
      trends: T<Trend, Opt<Trend, "id" | "created_at" | "source_url" | "hook" | "format" | "structure" | "topic" | "sound" | "hashtags" | "views" | "likes" | "shares" | "growth_7d" | "rank" | "notes" | "author" | "posted_at" | "saves" | "comments" | "slide_count" | "search_query">>;
      drafts: T<
        Draft,
        Opt<Draft, "id" | "created_at" | "updated_at" | "trend_id" | "slides" | "image_paths" | "caption" | "hashtags" | "mentions_studytab" | "is_ad" | "status" | "planned_at" | "experiment" | "title" | "template" | "sound_hint">,
        [
          { foreignKeyName: "drafts_account_id_fkey"; columns: ["account_id"]; isOneToOne: false; referencedRelation: "accounts"; referencedColumns: ["id"] },
          { foreignKeyName: "drafts_trend_id_fkey"; columns: ["trend_id"]; isOneToOne: false; referencedRelation: "trends"; referencedColumns: ["id"] },
        ]
      >;
      posts: T<
        Post,
        Opt<Post, "id" | "created_at" | "draft_id" | "tiktok_id" | "url" | "posted_at">,
        [
          { foreignKeyName: "posts_account_id_fkey"; columns: ["account_id"]; isOneToOne: false; referencedRelation: "accounts"; referencedColumns: ["id"] },
          { foreignKeyName: "posts_draft_id_fkey"; columns: ["draft_id"]; isOneToOne: false; referencedRelation: "drafts"; referencedColumns: ["id"] },
        ]
      >;
      post_stats: T<
        PostStat,
        Opt<PostStat, "views" | "likes" | "comments" | "shares" | "saves" | "avg_watch_s" | "full_watch_rate" | "new_followers" | "profile_visits">,
        [{ foreignKeyName: "post_stats_post_id_fkey"; columns: ["post_id"]; isOneToOne: false; referencedRelation: "posts"; referencedColumns: ["id"] }]
      >;
      account_stats: T<
        AccountStat,
        Opt<AccountStat, "followers" | "views" | "profile_visits">,
        [{ foreignKeyName: "account_stats_account_id_fkey"; columns: ["account_id"]; isOneToOne: false; referencedRelation: "accounts"; referencedColumns: ["id"] }]
      >;
      insights: T<
        Insight,
        Opt<Insight, "id" | "created_at" | "account_id" | "based_on_posts" | "active">,
        [{ foreignKeyName: "insights_account_id_fkey"; columns: ["account_id"]; isOneToOne: false; referencedRelation: "accounts"; referencedColumns: ["id"] }]
      >;
      app_admins: T<{ user_id: string; created_at: string }, { user_id: string; created_at?: string }>;
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { draft_status: DraftStatus };
    CompositeTypes: { [_ in never]: never };
  };
};
