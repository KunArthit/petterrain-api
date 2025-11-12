export interface ProjectExampleModel {
  project_id: number;
  solution_id: number;
  title: string;
  description: string;
  client_name: string | null;
  completed_date: Date | null;
  featured_image: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
