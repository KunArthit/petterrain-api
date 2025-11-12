export interface BlogPostModel {
  post_id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  category_id: number | null;
  author_id: number;
  featured_image: string | null;
  status: string;
  published_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface BlogPostTranslateionModel {
  id: number;
  blog_post_id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
}

export interface BlogPostMediaModel {
  media_id: number;
  post_id: number;
  media_type: string;
  media_url: string;
  caption: string | null;
  display_order: number;
}
export interface BlogCategoryModel {
  category_id: number;
  name: string;
  slug: string;
  description: string | null;
}
