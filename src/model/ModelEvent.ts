export class ModelEvent<T = void> {
  private listeners = new Set<{ value: (arg: T) => void }>();
  subscribe(listener: (arg: T) => void): () => void {
    const entry = { value: listener };
    this.listeners.add(entry);
    return () => this.listeners.delete(entry);
  }

  notify(arg: T) {
    this.listeners.forEach((l) => l.value(arg));
  }
}
