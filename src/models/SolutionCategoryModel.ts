export interface SolutionCategoryModel {
  category_id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  active: boolean;
}
