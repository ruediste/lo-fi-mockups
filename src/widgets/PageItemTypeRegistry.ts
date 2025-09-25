import {
  PageItemRegistry,
  pageItemTypeRegistryHolder,
} from "../model/createPageItem";
import { Page } from "../model/Page";
import { PageItem, PageItemData, PageItemsArgs } from "../model/PageItem";
import { BreadcrumbWidget } from "./BreadcrumbWidget";
import { BrowserWidget } from "./BrowserWidget";
import { ButtonToggleWidget } from "./ButtonToggleWidget";
import { ButtonWidget } from "./ButtonWidget";
import { CheckboxWidget } from "./CheckboxWidget";
import { CollapsedCardWidget } from "./CollapsedCardWidget";
import { ConnectorWidget, ConnectorWidgetData } from "./ConnectorWidget";
import { DataGridWidget } from "./DataGridWidget";
import { ComboboxWidget, DropdownWidget } from "./DropdownWidget";
import { ExpandedCardWidget } from "./ExpandedCardWidget";
import { GroupWidget } from "./GroupWidget";
import { HorizontalScrollBarWidget } from "./HorizontalScrollBarWidget";
import { IconWidget } from "./IconWidget";
import { LabelWidget } from "./LabelWidget";
import { ListWidget } from "./ListWidget";
import { NoteWidget } from "./NoteWidget";
import { RadioButtonWidget } from "./RadioButtonWidget";
import { TabsWidget } from "./TabsWidget";
import { TextInputWidget } from "./TextInputWidget";
import { TitleWidget } from "./TitleWidget";
import { UmlClassWidget } from "./UmlClassWidget";
import { VerticalScrollBarWidget } from "./VerticalScrollBarWidget";
import { Widget } from "./Widget";

export class PageItemTypeRegistryImpl implements PageItemRegistry {
  itemTypes = new Map<
    string,
    [
      (args: PageItemsArgs) => PageItem,
      (id: number, type: string) => PageItemData
    ]
  >();

  palette: {
    key: string;
    ctor: new (data: PageItemData, page: Page, fromMaster: boolean) => Widget;
  }[] = [];

  create(args: PageItemsArgs): PageItem {
    const [ctor] = this.itemTypes.get(args.data.type)!;
    const result = ctor(args);
    result.initialize();
    return result;
  }

  createData(id: number, type: string): PageItemData {
    return this.itemTypes.get(type)![1](id, type);
  }
}

export const pageItemTypeRegistry = new PageItemTypeRegistryImpl();
pageItemTypeRegistryHolder.registry = pageItemTypeRegistry;

function register(
  key: string,
  ctor: new (
    data: PageItemData,
    page: Page,
    fromMasterPage: boolean
  ) => PageItem,
  dataFactory?: (id: number, type: string) => PageItemData
) {
  pageItemTypeRegistry.itemTypes.set(key, [
    (args) => new ctor(args.data, args.page, args.fromMasterPage),
    dataFactory ?? ((id, type) => ({ id, type })),
  ]);
  if (ctor.prototype instanceof Widget) {
    pageItemTypeRegistry.palette.push({ key, ctor: ctor as any });
  }
}

register("list", ListWidget);
register("tabs", TabsWidget);
register("button", ButtonWidget);
register("title", TitleWidget);
register("label", LabelWidget);
register("textInput", TextInputWidget);
register("dropdown", DropdownWidget);
register("combobox", ComboboxWidget);
register("dataGrid", DataGridWidget);
register("icon", IconWidget);
register("checkbox", CheckboxWidget);
register("radioButton", RadioButtonWidget);
register("breadcrumb", BreadcrumbWidget);
register("expandedCard", ExpandedCardWidget);
register("collapsedCard", CollapsedCardWidget);
register("horizontalScrollBar", HorizontalScrollBarWidget);
register("verticalScrollBar", VerticalScrollBarWidget);
register("browser", BrowserWidget);
register("group", GroupWidget);
register("note", NoteWidget);
register("buttonToggle", ButtonToggleWidget);
register(
  "connector",
  ConnectorWidget,
  (id, type) =>
    ({
      id,
      type,
      source: { position: { x: 0, y: 0 } },
      target: { position: { x: 80, y: 0 } },
    } satisfies ConnectorWidgetData)
);
register("umlClass", UmlClassWidget);
