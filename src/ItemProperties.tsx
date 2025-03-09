import { Form } from "react-bootstrap";
import { useRerenderOnEvent } from "./hooks";
import { PageItem } from "./Project";
import { Widget } from "./Widget";

export function ItemProperties({ item }: { item: PageItem | undefined }) {
  useRerenderOnEvent(item?.onChange);
  if (item instanceof Widget) {
    return (
      <>
        <h1>{item.label}</h1>
        <Form>
          {item.properties
            .filter((p) => !p.isHidden)
            .map((p) => (
              <div key={p.id}>{p.render()}</div>
            ))}
        </Form>
      </>
    );
  }
  return <h1>No Item Selected</h1>;
}
