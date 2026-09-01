export type NewsStatus =
  | "draft"
  | "published"
  | "archived";

export type NewsCategory =
  | "projects"
  | "company"
  | "hse"
  | "events"
  | "partnerships"
  | "achievements"
  | "training"
  | "equipment"
  | "other";

export interface NewsUser {
  _id: string;
  fullName: string;
  email: string;
  role: string;
}

export interface NewsImage {
  url: string;
  publicId: string | null;
  alt: string;
}

export interface News {
  _id: string;
  title: string;
  shortDescription: string;
  content: string;
  category: NewsCategory;
  image: NewsImage;
  status: NewsStatus;
  publishedAt: string | null;
  displayOrder: number;
  createdBy: NewsUser | string | null;
  updatedBy: NewsUser | string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NewsFilters {
  page?: number;
  limit?: number;
  status?: NewsStatus;
  category?: NewsCategory;
  search?: string;
}

export interface NewsFormPayload {
  title: string;
  shortDescription: string;
  content: string;
  category: NewsCategory;
  status: NewsStatus;
  displayOrder: number;
  imageAlt?: string;
  image?: File;
}

export interface NewsPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface NewsListResponse {
  success: boolean;
  pagination: NewsPagination;
  data: News[];
}

export interface NewsResponse {
  success: boolean;
  message?: string;
  data: News;
}

export interface DeleteNewsResponse {
  success: boolean;
  message: string;
}

export interface PublicNewsResponse {
  success: boolean;
  count: number;
  data: News[];
}