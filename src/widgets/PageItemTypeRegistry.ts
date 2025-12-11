import {
  PageItemRegistry,
  pageItemTypeRegistryHolder,
} from "../model/createPageItem";
import { Page } from "../model/Page";
import { PageItem, PageItemData, PageItemsArgs } from "../model/PageItem";
import { BoxWidget } from "./BoxWidget";
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
import { TextAreaWidget } from "./TextAreaWidget";
import { TextInputWidget } from "./TextInputWidget";
import { TitleWidget } from "./TitleWidget";
import { UmlActorWidget } from "./UmlActorWidget";
import { UmlClassWidget } from "./UmlClassWidget";
import { UmlDatabaseWidget } from "./UmlDatabaseWidget";
import { UmlNodeWidget } from "./UmlNodeWidget";
import { VerticalScrollBarWidget } from "./VerticalScrollBarWidget";
import { Widget } from "./Widget";

interface RegistryEntry {
  itemFactory: (args: PageItemsArgs) => PageItem;
  newDataFactory: (id: number, type: string) => PageItemData;
  // there is always a JSON deep-clone between copy and paste
  mapDataAfterPaste: (
    existingData: PageItemData,
    mapId: (id: number) => number | undefined
  ) => PageItemData;
}
export class PageItemTypeRegistryImpl implements PageItemRegistry {
  itemTypes = new Map<string, RegistryEntry>();

  palette: {
    key: string;
    ctor: new (data: PageItemData, page: Page, fromMaster: boolean) => Widget;
  }[] = [];

  create(args: PageItemsArgs): PageItem {
    const { itemFactory } = this.itemTypes.get(args.data.type)!;
    const result = itemFactory(args);
    result.initialize();
    return result;
  }

  createData(id: number, type: string): PageItemData {
    return this.itemTypes.get(type)!.newDataFactory(id, type);
  }

  mapDataAfterPaste(
    existingData: PageItemData,
    mapId: (id: number) => number | undefined
  ) {
    return this.itemTypes
      .get(existingData.type)!
      .mapDataAfterPaste(existingData, mapId);
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
  args?: Partial<Pick<RegistryEntry, "newDataFactory" | "mapDataAfterPaste">>
) {
  pageItemTypeRegistry.itemTypes.set(key, {
    itemFactory: (args) => new ctor(args.data, args.page, args.fromMasterPage),
    newDataFactory: args?.newDataFactory ?? ((id, type) => ({ id, type })),
    mapDataAfterPaste:
      args?.mapDataAfterPaste ??
      ((data, mapId) => ({ ...data, id: mapId(data.id)! })),
  });
  if (ctor.prototype instanceof Widget) {
    pageItemTypeRegistry.palette.push({ key, ctor: ctor as any });
  }
}

register("list", ListWidget);
register("tabs", TabsWidget);
register("button", ButtonWidget);
register("box", BoxWidget);
register("title", TitleWidget);
register("label", LabelWidget);
register("textInput", TextInputWidget);
register("textArea", TextAreaWidget);
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
register("connector", ConnectorWidget, {
  newDataFactory: (id, type) =>
    ({
      id,
      type,
      source: { position: { x: 0, y: 0 } },
      target: { position: { x: 80, y: 0 } },
    } satisfies ConnectorWidgetData),
  mapDataAfterPaste: (data, mapId) => {
    const d = data as ConnectorWidgetData;

    const source = {
      ...d.source,
      connectedItemId:
        d.source.connectedItemId === undefined
          ? undefined
          : mapId(d.source.connectedItemId),
    };

    // if the paste disconnected the connector, keep its absolute position
    if (
      d.source.connectedItemId !== undefined &&
      source.connectedItemId === undefined
    ) {
      source.position = { ...d.source.absolutePosition! };
    }

    const target = {
      ...d.target,
      connectedItemId:
        d.target.connectedItemId === undefined
          ? undefined
          : mapId(d.target.connectedItemId),
    };

    if (
      d.target.connectedItemId !== undefined &&
      target.connectedItemId === undefined
    ) {
      target.position = { ...d.target.absolutePosition! };
    }

    const result: ConnectorWidgetData = {
      ...d,
      id: mapId(data.id)!,
      source,
      target,
    };
    return result;
  },
});
register("umlClass", UmlClassWidget);
register("umlDatabase", UmlDatabaseWidget);
register("umlNode", UmlNodeWidget);
register("umlActor", UmlActorWidget);
