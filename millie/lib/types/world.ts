export type WorldChapter = {
  id: string;
  title: string;
  content: string;
};

export type World = {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string;
  chapters: WorldChapter[];
};