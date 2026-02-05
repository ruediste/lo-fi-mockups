import { Repository } from "@/editor/repository";
import { ModelEvent } from "@/model/ModelEvent";
import { Project } from "@/model/Project";
import { useRerenderOnEvent } from "@/util/hooks";
import { throttle } from "@/util/throttle";
import { createContext, useContext } from "react";
import { CanvasProjection } from "./Canvas";

export class EditorState {
  private save = throttle(async () => {
    await (await this.repository).save();
  }, 1000);

  project: Project;

  projection = new CanvasProjection();

  dragOffset = { x: 0, y: 0 };

  onChanged = new ModelEvent();

  constructor(public repository: Repository) {
    repository.onChanged.subscribe(() => this.recreateProject());
    this.project = this.createProject();
  }

  private createProject() {
    return new Project(this.repository.projectData, () => this.save());
  }

  static async create() {
    console.log("EditorState create started", new Date().toISOString());
    try {
      return new EditorState(await Repository.create());
    } finally {
      console.log("EditorState created", new Date().toISOString());
    }
  }

  public recreateProject() {
    const oldSelection = this.project.currentPage?.selection;
    this.project = this.createProject();
    if (oldSelection) {
      this.project.currentPage?.selectAvailableItemsById(oldSelection);
    }
    this.onChanged.notify();
  }
}

export const editorState = EditorState.create();

if (import.meta.hot) {
  // recreate
  import.meta.hot.on("vite:afterUpdate", async (p) => {
    (await editorState).recreateProject();
  });
}

export const EditorStateContext = createContext<EditorState | undefined>(
  undefined,
);

export function useEditorState() {
  const state = useContext(EditorStateContext)!;
  useRerenderOnEvent(state.onChanged);
  return state;
}

export function useProject() {
  const state = useEditorState();
  useRerenderOnEvent(state.project.onChange);
  return state.project;
}
