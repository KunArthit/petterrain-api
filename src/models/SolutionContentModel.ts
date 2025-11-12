export interface SolutionContentModel {
  content_id: number;
  solution_id: number;
  title: string;
  content: string;
  content_order: number | null;
  created_at: Date;
  updated_at: Date;
}
