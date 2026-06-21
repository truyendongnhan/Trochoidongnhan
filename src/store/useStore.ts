import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { World, Character, Story, Chapter, Skill, Item, Project, PublishedNovel } from '../types';
import { WORLDS } from '../data/worlds';
import { auth } from '../lib/firebase';
import { 
  saveProjectToFirestore, 
  deleteProjectFromFirestore, 
  saveChapterToFirestore, 
  deleteChapterFromFirestore, 
  getChaptersFromFirestore,
  saveCustomWorldToFirestore, 
  deleteCustomWorldFromFirestore,
  publishNovelToFirestore,
  updatePublishedNovelStatusInFirestore,
  deletePublishedNovelFromFirestore
} from '../lib/firestoreSync';

interface AppState {
  projects: Project[];
  activeProjectId: string | null;

  customWorlds: World[];
  publishedNovels: PublishedNovel[];
  currentUserProfile: any | null;

  // Computed properties essentially, but we store active state directly for ease of migration
  currentWorldId: string | null;
  character: Character | null;
  story: Story;
  chapters: Chapter[];
  
  // Actions
  setProjects: (projects: Project[]) => void;
  setCustomWorlds: (worlds: World[]) => void;
  setPublishedNovels: (novels: PublishedNovel[]) => void;
  setCurrentUserProfile: (profile: any) => void;
  loadChapters: (chapters: Chapter[]) => void;

  addCustomWorld: (world: World) => void;
  updateCustomWorld: (worldId: string, data: Partial<World>) => void;
  deleteCustomWorld: (worldId: string) => void;

  createProject: (worldId: string, character: Character, story: Story) => string;
  setActiveProject: (projectId: string | null) => Promise<void>;
  deleteProject: (projectId: string) => void;

  setWorld: (worldId: string) => void; // Used during creation before finalizing
  setCharacter: (character: Character) => void; // Used during creation before finalizing

  // Active Project Actions (these sync to the active project in the list)
  updateCharacterStats: (stats: Record<string, number>) => void;
  addSkill: (skill: Skill) => void;
  updateWealth: (amount: number) => void;
  addItem: (item: Item) => void;
  
  setStoryInfo: (info: Partial<Story>) => void;
  addChapter: (chapter: Chapter) => void;
  updateChapter: (id: string, content: string, title?: string) => void;
  deleteChapter: (id: string) => void;

  // Published Novels Actions
  publishProjectAsNovel: (projectId: string, customTitle?: string, customSummary?: string) => Promise<boolean>;
  approvePublishedNovel: (novelId: string) => Promise<void>;
  rejectPublishedNovel: (novelId: string) => Promise<void>;
  deletePublishedNovel: (novelId: string) => Promise<void>;
  
  resetGame: () => void;
}

const emptyStory: Story = { title: '', summary: '', genres: [], writingStyle: '', storyDirections: [] };

const initialState = {
  projects: [],
  activeProjectId: null,
  customWorlds: [],
  publishedNovels: [],
  currentUserProfile: null,
  currentWorldId: null,
  character: null,
  story: emptyStory,
  chapters: [],
};

// Helper to push project metadata updates to Cloud
const syncProjectMetadataCloud = (projectId: string, project: Project) => {
  if (auth.currentUser) {
    saveProjectToFirestore(project).catch(err => {
      console.error("Firestore sync project metadata failed:", err);
    });
  }
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setProjects: (projects) => {
        const activeId = get().activeProjectId;
        // Keep chapters of projects if they match local active layers
        const updatedProjects = projects.map(p => {
          if (p.id === activeId) {
            return { ...p, chapters: get().chapters };
          }
          return p;
        });
        set({ projects: updatedProjects });
      },

      setCustomWorlds: (worlds) => {
        set({ customWorlds: worlds });
      },

      setPublishedNovels: (novels) => {
        set({ publishedNovels: novels });
      },

      setCurrentUserProfile: (profile) => {
        set({ currentUserProfile: profile });
      },

      loadChapters: (chapters) => {
        set({ chapters });
      },

      addCustomWorld: (world) => {
        set((state) => ({ customWorlds: [...state.customWorlds, world] }));
        if (auth.currentUser) {
          saveCustomWorldToFirestore(world).catch(err => console.error("Cloud custom world save failed:", err));
        }
      },

      updateCustomWorld: (worldId, data) => {
        set((state) => {
          const updatedCustomWorlds = state.customWorlds.map(w => w.id === worldId ? { ...w, ...data } : w);
          if (auth.currentUser) {
            const world = updatedCustomWorlds.find(w => w.id === worldId);
            if (world) {
              saveCustomWorldToFirestore(world).catch(err => console.error("Cloud custom world update failed:", err));
            }
          }
          return { customWorlds: updatedCustomWorlds };
        });
      },

      deleteCustomWorld: (worldId) => {
        set((state) => ({
          customWorlds: state.customWorlds.filter(w => w.id !== worldId)
        }));
        if (auth.currentUser) {
          deleteCustomWorldFromFirestore(worldId).catch(err => console.error("Cloud custom world delete failed:", err));
        }
      },

      createProject: (worldId, character, story) => {
        const newProject: Project = {
          id: crypto.randomUUID(),
          worldId,
          character,
          story,
          chapters: [],
          updatedAt: Date.now()
        };
        set(state => ({
          projects: [...state.projects, newProject],
          activeProjectId: newProject.id,
          currentWorldId: newProject.worldId,
          character: newProject.character,
          story: newProject.story,
          chapters: newProject.chapters
        }));

        if (auth.currentUser) {
          saveProjectToFirestore(newProject).catch(err => console.error("Cloud create project failed:", err));
        }

        return newProject.id;
      },

      setActiveProject: async (projectId) => {
        if (!projectId) {
          set({ activeProjectId: null, currentWorldId: null, character: null, story: emptyStory, chapters: [] });
          return;
        }
        const project = get().projects.find(p => p.id === projectId);
        if (project) {
          // Standard metadata setup
          set({
            activeProjectId: project.id,
            currentWorldId: project.worldId,
            character: project.character,
            story: project.story,
            chapters: project.chapters || []
          });

          // Lazy load chapters from subcollection if logged in
          if (auth.currentUser) {
            try {
              const cloudChapters = await getChaptersFromFirestore(project.id);
              set({ chapters: cloudChapters });
              set(state => ({
                projects: state.projects.map(p => p.id === projectId ? { ...p, chapters: cloudChapters } : p)
              }));
            } catch (err) {
              console.error("Cloud lazy load chapters failed:", err);
            }
          }
        }
      },

      deleteProject: (projectId) => {
        set(state => {
          const newProjects = state.projects.filter(p => p.id !== projectId);
          if (state.activeProjectId === projectId) {
            return {
              projects: newProjects,
              activeProjectId: null,
              currentWorldId: null,
              character: null,
              story: emptyStory,
              chapters: []
            };
          }
          return { projects: newProjects };
        });

        if (auth.currentUser) {
          deleteProjectFromFirestore(projectId).catch(err => console.error("Cloud delete project failed:", err));
        }
      },

      setWorld: (worldId) => set({ currentWorldId: worldId }),
      
      setCharacter: (character) => {
         // This is called during creation, before a project is actually created.
         // We just set it in the temporary active state.
         set({ character });
      },

      updateCharacterStats: (stats) => set((state) => {
        const newChar = state.character ? { ...state.character, stats: { ...state.character.stats, ...stats } } : null;
        if (newChar && state.activeProjectId) {
          const newProjects = state.projects.map(p => {
            if (p.id === state.activeProjectId) {
              const updatedProject = { ...p, character: newChar, updatedAt: Date.now() };
              syncProjectMetadataCloud(state.activeProjectId!, updatedProject);
              return updatedProject;
            }
            return p;
          });
          return { character: newChar, projects: newProjects };
        }
        return { character: newChar };
      }),
      
      addSkill: (skill) => set((state) => {
        const newChar = state.character ? { ...state.character, skills: [...state.character.skills, skill] } : null;
        if (newChar && state.activeProjectId) {
           const newProjects = state.projects.map(p => {
             if (p.id === state.activeProjectId) {
               const updatedProject = { ...p, character: newChar, updatedAt: Date.now() };
               syncProjectMetadataCloud(state.activeProjectId!, updatedProject);
               return updatedProject;
             }
             return p;
           });
           return { character: newChar, projects: newProjects };
        }
        return { character: newChar };
      }),
      
      updateWealth: (amount) => set((state) => {
        const newChar = state.character ? { ...state.character, wealth: amount } : null;
        if (newChar && state.activeProjectId) {
           const newProjects = state.projects.map(p => {
             if (p.id === state.activeProjectId) {
               const updatedProject = { ...p, character: newChar, updatedAt: Date.now() };
               syncProjectMetadataCloud(state.activeProjectId!, updatedProject);
               return updatedProject;
             }
             return p;
           });
           return { character: newChar, projects: newProjects };
        }
        return { character: newChar };
      }),
      
      addItem: (item) => set((state) => {
        const newChar = state.character ? { ...state.character, inventory: [...state.character.inventory, item] } : null;
        if (newChar && state.activeProjectId) {
           const newProjects = state.projects.map(p => {
             if (p.id === state.activeProjectId) {
               const updatedProject = { ...p, character: newChar, updatedAt: Date.now() };
               syncProjectMetadataCloud(state.activeProjectId!, updatedProject);
               return updatedProject;
             }
             return p;
           });
           return { character: newChar, projects: newProjects };
        }
        return { character: newChar };
      }),
      
      setStoryInfo: (info) => set((state) => {
        const newStory = { ...state.story, ...info };
        if (state.activeProjectId) {
          const newProjects = state.projects.map(p => {
            if (p.id === state.activeProjectId) {
              const updatedProject = { ...p, story: newStory, updatedAt: Date.now() };
              syncProjectMetadataCloud(state.activeProjectId!, updatedProject);
              return updatedProject;
            }
            return p;
          });
          return { story: newStory, projects: newProjects };
        }
        return { story: newStory };
      }),
      
      addChapter: (chapter) => set((state) => {
        const newChapters = [...state.chapters, chapter];
        if (state.activeProjectId) {
          const newProjects = state.projects.map(p => {
            if (p.id === state.activeProjectId) {
              const updatedProject = { ...p, chapters: newChapters, updatedAt: Date.now() };
              syncProjectMetadataCloud(state.activeProjectId!, updatedProject);
              return updatedProject;
            }
            return p;
          });
          
          if (auth.currentUser) {
            saveChapterToFirestore(state.activeProjectId, chapter).catch(err => console.error("Cloud save chapter failed:", err));
          }

          return { chapters: newChapters, projects: newProjects };
        }
        return { chapters: newChapters };
      }),
      
      updateChapter: (id, content, title) => set((state) => {
        const newChapters = state.chapters.map(ch => 
          ch.id === id ? { ...ch, content, title: title ?? ch.title } : ch
        );
        if (state.activeProjectId) {
          const newProjects = state.projects.map(p => {
            if (p.id === state.activeProjectId) {
              const updatedProject = { ...p, chapters: newChapters, updatedAt: Date.now() };
              syncProjectMetadataCloud(state.activeProjectId!, updatedProject);
              return updatedProject;
            }
            return p;
          });

          if (auth.currentUser) {
            const chapter = newChapters.find(ch => ch.id === id);
            if (chapter) {
              saveChapterToFirestore(state.activeProjectId, chapter).catch(err => console.error("Cloud update chapter failed:", err));
            }
          }

          return { chapters: newChapters, projects: newProjects };
        }
        return { chapters: newChapters };
      }),
      
      deleteChapter: (id) => set((state) => {
        const newChapters = state.chapters.filter(ch => ch.id !== id);
        if (state.activeProjectId) {
           const newProjects = state.projects.map(p => {
             if (p.id === state.activeProjectId) {
               const updatedProject = { ...p, chapters: newChapters, updatedAt: Date.now() };
               syncProjectMetadataCloud(state.activeProjectId!, updatedProject);
               return updatedProject;
             }
             return p;
           });

           if (auth.currentUser) {
             deleteChapterFromFirestore(state.activeProjectId, id).catch(err => console.error("Cloud delete chapter failed:", err));
           }

           return { chapters: newChapters, projects: newProjects };
        }
        return { chapters: newChapters };
      }),

      publishProjectAsNovel: async (projectId, customTitle, customSummary) => {
        const project = get().projects.find(p => p.id === projectId);
        if (!project) return false;

        let chaps: Chapter[] = [];
        if (projectId === get().activeProjectId) {
          chaps = get().chapters;
        } else {
          chaps = await getChaptersFromFirestore(projectId);
        }

        const user = auth.currentUser;
        if (!user) return false;

        const world = WORLDS[project.worldId] || get().customWorlds.find(w => w.id === project.worldId);
        const powerSystem = world ? world.powerSystem : 'N/A';

        const novel: PublishedNovel = {
          id: project.id, // Enforces 1 public novel listing per unique private project
          projectId: project.id,
          userId: user.uid,
          userEmail: user.email || 'Ẩn danh',
          worldId: project.worldId,
          title: customTitle || project.story.title || 'Tiểu Thuyết Chưa Đặt Tên',
          summary: customSummary || project.story.summary || 'Trống tóm tắt bối cảnh.',
          characterName: project.character.name,
          powerSystem: powerSystem,
          status: 'pending',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        try {
          await publishNovelToFirestore(novel, chaps);
          return true;
        } catch (error) {
          console.error("Failed to publish novel on cloud sync:", error);
          return false;
        }
      },

      approvePublishedNovel: async (novelId) => {
        if (auth.currentUser) {
          await updatePublishedNovelStatusInFirestore(novelId, 'approved');
        }
      },

      rejectPublishedNovel: async (novelId) => {
        if (auth.currentUser) {
          await updatePublishedNovelStatusInFirestore(novelId, 'rejected');
        }
      },

      deletePublishedNovel: async (novelId) => {
        if (auth.currentUser) {
          await deletePublishedNovelFromFirestore(novelId);
        }
      },
      
      resetGame: () => set(initialState),
    }),
    {
      name: 'fanfiction-rpg-storage',
    }
  )
);
