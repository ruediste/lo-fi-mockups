import { JSX } from "react";
import { Button, Form } from "react-bootstrap";
import { FormCheck } from "../Inputs";
import { PageItem } from "../model/PageItem";
import {
  MemoValue,
  NumberProperty,
  PageItemProperty,
} from "../model/PageItemProperty";
import { SortableList } from "../SortableList";
import { Widget } from "../Widget";
import { ItemListPropertyItem } from "./WidgetHelpers";
import { widgetTheme } from "./widgetTheme";

interface Item {
  id: number;
  label: string;
}

interface ItemListSelectionPropertyValue {
  multiSelection: boolean;
  selectedItems: { [id: number]: boolean };
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
    const tmp = this.get();
    if (tmp.multiSelection) {
      tmp.selectedItems[id] = selected;
    } else tmp.selectedItems = { [id]: selected };
    this.set(tmp);
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
      !this.isHidden &&
      (this.isEditable || (this.selection?.isEditable ?? false))
    );
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
            disabled={this.isEditable}
          >
            {(item, idx) => (
              <ItemListPropertyItem
                key={item.id}
                item={item}
                idx={idx}
                itemEditable={this.isEditable}
                selectionEditable={this.selection?.isEditable ?? false}
                setLabel={(value) => {
                  item.label = value;
                  this.notify();
                }}
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

export class ListWidget extends Widget {
  label = "List";
  fontSize = new NumberProperty(this, "fontSize", "Font Size", 16);
  gap = new NumberProperty(this, "gap", "Gap", 8);

  itemListSelection = new ItemListSelectionProperty(this, "itemSelection");
  itemList = new ItemListProperty(
    this,
    "items",
    "Items",
    this.itemListSelection
  );

  items = new MemoValue<{ label: string; selected: boolean }[]>(() => {
    const selection = this.itemListSelection.get();
    return this.itemList.get().map((item) => ({
      label: item.label,
      selected: selection.selectedItems[item.id] ?? false,
    }));
  }, [this.itemList, this.itemListSelection]);

  override renderContent(): JSX.Element {
    const box = this.box.get();

    const renderedItems: JSX.Element[] = [];
    const fontSize = this.fontSize.get();
    const gap = this.gap.get();
    let y = box.y + fontSize + gap / 2;
    let id = 1;
    for (const item of this.items.value) {
      if (item.selected) {
        renderedItems.push(
          <rect
            key={id++}
            x={box.x}
            y={y - fontSize - gap / 2}
            width={box.width}
            height={fontSize + gap}
            fill="lightBlue"
          />
        );
      }
      renderedItems.push(
        <text key={id++} x={box.x} y={y} fontSize={24}>
          {item.label}
        </text>
      );
      y += fontSize + gap;
    }

    return (
      <>
        <rect
          {...widgetTheme}
          fill="none"
          x={box.x}
          y={box.y}
          width={box.width}
          height={box.height}
        />
        {renderedItems}
      </>
    );
  }

  initialize(): void {
    super.initialize();
  }

  override palette() {
    return {
      boundingBox: this.box.get(),
    };
  }
}
