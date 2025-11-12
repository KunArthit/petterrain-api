export interface SolutionMedia {
  media_id?: number;
  solution_content_id: number;
  media_type: string;
  media_url: string;
  caption?: string;
  display_order?: number;
  created_at?: Date;
  updated_at?: Date;
}

export type CreateSolutionMedia = Omit<
  SolutionMedia,
  "media_id" | "created_at" | "updated_at"
>;
