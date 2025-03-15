import { Button, Form } from "react-bootstrap";
import { FormCheck } from "../Inputs";
import { SortableList } from "../SortableList";
import { PageItem } from "./PageItem";
import { ItemListPropertyItem } from "./PageItemHelpers";
import { PageItemProperty } from "./PageItemProperty";

interface Item {
  id: number;
  label: string;
}

interface ItemListSelectionPropertyValue {
  multiSelection: boolean;
  selectedItems: { [id: number]: true };
}

export class ItemListSelectionProperty extends PageItemProperty<ItemListSelectionPropertyValue> {
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

  setSelection(id: number, selected: boolean) {
    this.modify((value) => {
      if (value.multiSelection) {
        if (selected) {
          value.selectedItems[id] = true;
        } else {
          delete value.selectedItems[id];
        }
      } else {
        value.selectedItems = selected ? { [id]: true } : {};
      }
    });
  }

  clone(value: ItemListSelectionPropertyValue): ItemListSelectionPropertyValue {
    return { ...value, selectedItems: { ...value.selectedItems } };
  }
}

export class ItemListProperty extends PageItemProperty<Item[]> {
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
          <div style={{ display: "flex" }}>
            <span>{this.label}</span>
            {this.isEditable && (
              <FormCheck
                style={{ marginLeft: "auto", display: "inline-block" }}
                label="Items Overrideable"
                checked={this.isOverrideable}
                onChange={() => this.setOverrideable(!this.isOverrideable)}
              />
            )}
            {this.selection?.isEditable && (
              <FormCheck
                style={{ marginLeft: "auto", display: "inline-block" }}
                label="Selection Overrideable"
                checked={this.selection.isOverrideable}
                onChange={() =>
                  this.selection!.setOverrideable(
                    !this.selection!.isOverrideable
                  )
                }
              />
            )}
          </div>
          <SortableList<Item>
            items={items}
            setItems={(v) => this.set(v)}
            disabled={!this.isEditable}
          >
            {(item, idx) => (
              <ItemListPropertyItem
                key={item.id}
                item={item}
                idx={idx}
                itemEditable={this.isEditable}
                selectionEditable={this.selection?.isEditable ?? false}
                setLabel={(value) =>
                  this.modify((v) => {
                    v[idx].label = value;
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
              />
            )}
          </SortableList>
        </Form.Group>
        <div style={{ display: "flex", flexDirection: "row" }}>
          <Button
            onClick={() =>
              this.set([
                ...items,
                { id: this.item.page.project.data.nextId++, label: "New Item" },
              ])
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
