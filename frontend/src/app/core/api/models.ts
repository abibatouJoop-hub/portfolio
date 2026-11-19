/**
 * Types calqués sur les API Resources Laravel (backend/app/Http/Resources).
 * Les champs marqués « admin » ne sont renvoyés que si l'administratrice est connectée.
 */

export interface ApiResponse<T> {
  data: T;
}

export interface Paginated<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    unread_count?: number;
  };
}

/** Réponse 422 de Laravel : { message, errors: { champ: [messages] } } */
export interface ValidationErrors {
  message: string;
  errors: Record<string, string[]>;
}

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface SocialLink {
  platform: string;
  url: string;
}

export interface Profile {
  first_name: string;
  last_name: string;
  full_name: string;
  title: string;
  hero_title: string | null;
  hero_subtitle: string | null;
  main_stack: string | null;
  about_title: string | null;
  about_text: string | null;
  location: string | null;
  education: string | null;
  languages: string[] | null;
  contact_email: string | null;
  phone: string | null;
  is_available: boolean;
  photo_url: string | null;
  cv_url: string | null;
  social_links?: SocialLink[];
  updated_at?: string; // admin
}

export interface Skill {
  id: number;
  name: string;
  level: number;
  skill_category_id?: number; // admin
  sort_order?: number; // admin
  is_visible?: boolean; // admin
}

export interface SkillCategory {
  id: number;
  name: string;
  sort_order?: number; // admin
  skills?: Skill[];
}

export type ExperienceType = 'work' | 'internship' | 'education';

export interface Experience {
  id: number;
  type: ExperienceType;
  title: string;
  organization: string;
  location: string | null;
  start_date: string; // « 2024-09-01 »
  end_date: string | null;
  is_current: boolean;
  description: string | null;
  technologies?: string[];
  sort_order?: number; // admin
}

export type ProjectCategory = 'web' | 'api' | 'mobile';
export type ProjectStatus = 'draft' | 'published';

export interface Project {
  id: number;
  title: string;
  slug: string;
  summary: string;
  description: string | null;
  category: ProjectCategory;
  is_featured: boolean;
  cover_url: string | null;
  demo_url: string | null;
  repo_url: string | null;
  technologies?: string[];
  published_at: string | null;
  status?: ProjectStatus; // admin
  sort_order?: number; // admin
  updated_at?: string; // admin
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  body: string;
  is_read: boolean;
  is_archived: boolean;
  read_at: string | null;
  archived_at: string | null;
  ip_address: string | null;
  created_at: string;
}

export type MessageFilter = 'inbox' | 'unread' | 'archived' | 'all';

export interface RecentChange {
  type: 'project' | 'experience' | 'skill';
  id: number;
  label: string;
  updated_at: string | null;
}

export interface Dashboard {
  counters: {
    projects_published: number;
    projects_draft: number;
    skills: number;
    experiences: number;
    messages_unread: number;
    messages_inbox: number;
  };
  latest_messages: ContactMessage[];
  recent_changes: RecentChange[];
}

export interface ContactPayload {
  name: string;
  email: string;
  subject: string;
  body: string;
  website?: string; // champ piège (doit rester vide)
}

// ------------------------------------------------------------ Libellés

export const PROJECT_CATEGORIES: { value: ProjectCategory; label: string }[] = [
  { value: 'web', label: 'Web' },
  { value: 'api', label: 'API' },
  { value: 'mobile', label: 'Mobile' },
];

export const EXPERIENCE_TYPES: { value: ExperienceType; label: string; plural: string }[] = [
  { value: 'work', label: 'Expérience', plural: 'Expériences' },
  { value: 'internship', label: 'Stage', plural: 'Stages' },
  { value: 'education', label: 'Formation', plural: 'Formations' },
];

export function categoryLabel(value: string): string {
  return PROJECT_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export function experienceTypeLabel(value: string): string {
  return EXPERIENCE_TYPES.find((t) => t.value === value)?.label ?? value;
}

export function skillLevelLabel(level: number): string {
  if (level >= 90) return 'Expert';
  if (level >= 80) return 'Avancé';
  if (level >= 60) return 'Intermédiaire';
  return 'En apprentissage';
}
