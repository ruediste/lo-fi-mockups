import { pageItemTypeRegistryHolder } from "../model/createPageItem";
import { Page } from "../model/Page";
import { PageItem, PageItemData, PageItemsArgs } from "../model/PageItem";
import { BreadcrumbWidget } from "./BreadcrumbWidget";
import { BrowserWidget } from "./BrowserWidget";
import { ButtonToggleWidget } from "./ButtonToggleWidget";
import { ButtonWidget } from "./ButtonWidget";
import { CheckboxWidget } from "./CheckboxWidget";
import { CollapsedCardWidget } from "./CollapsedCardWidget";
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
import { VerticalScrollBarWidget } from "./VerticalScrollBarWidget";
import { Widget } from "./Widget";

export class PageItemTypeRegistry {
  itemTypes = new Map<string, (args: PageItemsArgs) => PageItem>();

  palette: {
    key: string;
    ctor: new (data: PageItemData, page: Page, fromMaster: boolean) => Widget;
  }[] = [];

  create(args: PageItemsArgs): PageItem {
    const ctor = this.itemTypes.get(args.data.type)!;
    const result = ctor(args);
    result.initialize();
    return result;
  }
}

export const pageItemTypeRegistry = new PageItemTypeRegistry();
pageItemTypeRegistryHolder.registry = pageItemTypeRegistry;

function register(
  key: string,
  ctor: new (
    data: PageItemData,
    page: Page,
    fromMasterPage: boolean
  ) => PageItem
) {
  pageItemTypeRegistry.itemTypes.set(
    key,
    (args) => new ctor(args.data, args.page, args.fromMasterPage)
  );
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
