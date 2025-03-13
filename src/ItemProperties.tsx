import { Form } from "react-bootstrap";
import { useRerenderOnEvent } from "./hooks";
import { PageItem } from "./model/PageItem";
import { Widget } from "./Widget";

export function ItemProperties({ item }: { item: PageItem | undefined }) {
  useRerenderOnEvent(item?.onChange);
  if (item instanceof Widget) {
    return (
      <>
        <h1>{item.label}</h1>
        <Form>
          {item.properties
            .filter((p) => p.shouldRender())
            .map((p) => {
              const result = p.render();
              if (result == null) return null;
              return <div key={p.id}>{result}</div>;
            })}
        </Form>
      </>
    );
  }
  return <h1>No Item Selected</h1>;
}
