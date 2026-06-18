export interface StoryPage {
  pageNumber: number;
  text: string;
  illustrationPrompt: string;
  imageUrl?: string;
  isLoadingImage?: boolean;
  audioBase64?: string; // Cache for easy batch audios download
}

export interface Story {
  id: string;
  title: string;
  author: string;
  style: string;
  voice: string;
  imageSize: '1K' | '2K' | '4K';
  pages: StoryPage[];
  apiRouteId?: string; // Tracks which personalized route generated it
}

export interface ApiRoute {
  id: string;
  name: string;
  endpoint: string; // e.g. /api/generate-story
  model: string; // e.g. gemini-2.5-flash or gemini-2.5-pro
  systemInstruction: string;
  icon: string;
}

export interface StoryCreationConfig {
  characterName: string;
  characterType: string;
  setting: string;
  theme: string;
  style: string;
  voice: string;
  imageSize: '1K' | '2K' | '4K';
  apiRouteId: string;
}

export type CompanionRole = 'dragon' | 'owl' | 'pup';

export interface ChatMessage {
  role: 'user' | 'model' | 'system';
  text: string;
}

export interface CompanionDetail {
  id: CompanionRole;
  name: string;
  avatar: string;
  color: string;
  bgColor: string;
  badgeColor: string;
  borderColor: string;
  roleDescription: string;
  modelUsed: string;
  greeting: string;
}
