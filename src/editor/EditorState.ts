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

  private lastSnapshotTime = 0;
  private snapshots: string[] = [];

  project: Project;

  projection = new CanvasProjection();

  dragOffset = { x: 0, y: 0 };

  onProjectReplaced = new ModelEvent();

  onProjectDataChanged = new ModelEvent();
  dirty = false;

  constructor(public repository: Repository) {
    repository.onProjectReplaced.subscribe(() => {
      this.dirty = false;
      this.snapshots = [];
      this.recreateProject();
    });
    this.project = this.createProject();

    if (import.meta.hot) {
      // recreate
      import.meta.hot.on("vite:afterUpdate", () => this.recreateProject());
    }
  }

  clearDirtyFlag() {
    this.dirty = false;
    this.onProjectDataChanged.notify();
  }

  keepSnapshot() {
    const now = Date.now();
    // Don't keep snapshots too frequently to avoid too many undo steps
    if (now - this.lastSnapshotTime < 1000) {
      return;
    }
    this.lastSnapshotTime = now;
    this.snapshots.push(JSON.stringify(this.repository.projectData));

    // Keep only the last N snapshots to limit memory usage
    while (this.snapshots.length > 20) {
      this.snapshots.shift();
    }
  }

  private createProject() {
    return new Project(
      this.repository.projectData,
      () => {
        this.dirty = true;
        this.onProjectDataChanged.notify();
        this.keepSnapshot();
        this.save();
      },
      () => this.keepSnapshot(),
    );
  }

  get hasUndo() {
    return this.snapshots.length > 0;
  }
  undo() {
    if (this.snapshots.length === 0) return;
    const lastSnapshot = this.snapshots.pop()!;
    this.repository.projectData = JSON.parse(lastSnapshot);
    this.recreateProject();
  }

  static async create() {
    return new EditorState(await Repository.create());
  }

  private recreateProject() {
    const oldSelection = this.project.currentPage?.selection;
    this.project = this.createProject();
    if (oldSelection) {
      this.project.currentPage?.selectAvailableItemsById(oldSelection);
    }
    this.onProjectDataChanged.notify();
    this.onProjectReplaced.notify();
  }
}

export const editorState = EditorState.create();

export const EditorStateContext = createContext<EditorState | undefined>(
  undefined,
);

export function useEditorState() {
  const state = useContext(EditorStateContext)!;
  useRerenderOnEvent(state.onProjectReplaced);
  return state;
}

export function useProject() {
  const state = useEditorState();
  useRerenderOnEvent(state.project.onChange);
  return state.project;
}
