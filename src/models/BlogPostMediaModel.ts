export interface BlogPostMediaModel {
  media_id: number;
  post_id: number;
  media_type: string;
  media_url: string;
  caption: string | null;
  display_order: number | null;
}
