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
    repository.onChanged.subscribe(() => {
      this.project = this.createProject();
      this.onChanged.notify();
    });
    this.project = this.createProject();
  }

  private createProject() {
    return new Project(this.repository.projectData, () => this.save());
  }

  static async create() {
    return new EditorState(await Repository.create());
  }
}

export const editorState = EditorState.create();

export const EditorStateContext = createContext<EditorState | undefined>(
  undefined
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
