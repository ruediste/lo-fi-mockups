import { Button, Form } from "react-bootstrap";
import { SortableList } from "../util/SortableList";
import { PageItem } from "./PageItem";
import { Item, ItemListPropertyItem } from "./PageItemHelpers";
import { PropertyOverrideControls } from "./PageItemInteractionHelpers";
import { PageItemProperty, PageItemPropertyBase } from "./PageItemProperty";

interface ItemListSelectionPropertyValue {
  multiSelection: boolean;
  selectedItems: { [id: number]: true };
}

export class ItemListSelectionProperty extends PageItemPropertyBase<ItemListSelectionPropertyValue> {
  constructor(
    item: PageItem,
    id: string,
    defaultValue: ItemListSelectionPropertyValue = {
      multiSelection: false,
      selectedItems: {},
    }
  ) {
    super(item, id, defaultValue);
  }

  render() {
    return null;
  }

  setSelection(itemId: number, selected: boolean) {
    this.modify((value) => {
      if (value.multiSelection) {
        if (selected) {
          value.selectedItems[itemId] = true;
        } else {
          delete value.selectedItems[itemId];
        }
      } else {
        value.selectedItems = selected ? { [itemId]: true } : {};
      }
    });
  }

  clone(value: ItemListSelectionPropertyValue): ItemListSelectionPropertyValue {
    return { ...value, selectedItems: { ...value.selectedItems } };
  }
}

export class ItemListProperty extends PageItemPropertyBase<Item[]> {
  constructor(
    item: PageItem,
    id: string,
    private label: string,
    private selection?: ItemListSelectionProperty,
    defaultValue: Item[] = []
  ) {
    super(item, id, defaultValue);
  }

  override shouldRender(): boolean {
    return (
      !this.isHidden() &&
      (this.isEditable || (this.selection?.isEditable ?? false))
    );
  }

  clone(value: Item[]): Item[] {
    return value.map((x) => ({ ...x }));
  }

  render() {
    const items = this.get();
    const selection = this.selection?.get();
    return (
      <>
        <Form.Group className="mb-3">
          <div style={{ display: "flex", alignItems: "baseline" }}>
            <span>{this.label}</span>
            {this.isEditable && (
              <>
                <PropertyOverrideControls property={this} />
                Items
              </>
            )}
            {this.selection?.isEditable && (
              <>
                <PropertyOverrideControls property={this.selection} />
                Selection
              </>
            )}
          </div>
          <SortableList<Item>
            items={items}
            setItems={(v) => this.set(v)}
            disabled={!this.isEditable}
          >
            {(item, idx) => (
              <ItemListPropertyItem
                hideGrip={!this.isEditable}
                key={item.id}
                item={item}
                idx={idx}
                project={this.item.page.project}
                itemEditable={this.isEditable}
                selectionEditable={this.selection?.isEditable ?? false}
                setLabel={(value) =>
                  this.modify((v) => {
                    v[idx].label = value;
                  })
                }
                setLink={(value) =>
                  this.modify((v) => {
                    v[idx].link = value;
                  })
                }
                selected={
                  selection === undefined
                    ? undefined
                    : selection.selectedItems[item.id] ?? false
                }
                setSelected={(value) =>
                  this.selection?.setSelection(item.id, value)
                }
                removeItem={(id) => this.set(items.filter((x) => x.id !== id))}
              />
            )}
          </SortableList>
        </Form.Group>
        <div style={{ display: "flex", flexDirection: "row" }}>
          <Button
            onClick={() =>
              this.set([...items, { id: this.nextId(), label: "New Item" }])
            }
          >
            Add
          </Button>
          {selection && (
            <Form.Check
              inline
              style={{ marginLeft: "auto" }}
              id={this.item.data.id + "-" + this.id + "-checkbox"}
              type="checkbox"
              checked={selection.multiSelection}
              onChange={() => {
                const value = !selection.multiSelection;
                return this.selection!.set({
                  selectedItems: value ? selection.selectedItems : {},
                  multiSelection: value,
                });
              }}
              label="Multi Select"
            />
          )}
        </div>
      </>
    );
  }
}

export class ExtensibleItemListProperty extends PageItemProperty {
  private value: Item[] = [];
  private masterItems: Item[] = [];
  constructor(item: PageItem, id: string, private label: string) {
    super(item, id);
    for (const values of item.masterPropertyValues) {
      const masterValue = values[id];
      if (Array.isArray(masterValue)) {
        this.masterItems.push(...masterValue);
      }
    }
    this.value = this.item.propertyValues?.[this.id] ?? [];
  }

  shouldRender(): boolean {
    return true;
  }

  getAll(): Item[] {
    return this.masterItems.concat(this.value);
  }

  set(value: Item[]): void {
    this.item.editablePropertyValues[this.id] = value;
    this.value = value;
    this.notify();
  }

  render() {
    const items = this.value;
    return (
      <>
        <Form.Group className="mb-3">
          <div style={{ display: "flex", alignItems: "baseline" }}>
            <span>{this.label}</span>
          </div>
          <SortableList<Item> items={items} setItems={(v) => this.set(v)}>
            {(item, idx) => (
              <ItemListPropertyItem
                key={item.id}
                item={item}
                idx={idx}
                project={this.item.page.project}
                itemEditable={true}
                selectionEditable={false}
                setLabel={(value) => {
                  items[idx].label = value;
                  this.notify();
                }}
                setLink={(value) => {
                  items[idx].link = value;
                  this.notify();
                }}
                removeItem={(id) => this.set(items.filter((x) => x.id !== id))}
              />
            )}
          </SortableList>
        </Form.Group>
        <div style={{ display: "flex", flexDirection: "row" }}>
          <Button
            onClick={() =>
              this.set([...items, { id: this.nextId(), label: "New Item" }])
            }
          >
            Add
          </Button>
        </div>
      </>
    );
  }
}
