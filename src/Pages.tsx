import { DeleteOutlined } from "@ant-design/icons";
import { Button, Dropdown, MenuProps } from "antd";
import { PageData, Project } from "./Project";

function Page({
  page,
  project,
  idx,
}: {
  page: PageData;
  project: Project;
  idx: number;
}) {
  const menu: MenuProps = {
    mode: "vertical",
    items: [
      {
        key: "delete",
        onClick: () => project.removePage(page.id),
        icon: <DeleteOutlined />,
        label: "Delete",
      },
    ],
  };
  return (
    <Dropdown menu={menu} trigger={["contextMenu"]}>
      <Button onClick={() => project.selectPage(page)}>Page {idx}</Button>
    </Dropdown>
  );
}
export function Pages({ project }: { project: Project }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <Button onClick={() => project.addPage()}>Add</Button>
      {project.data.pages.map((page, idx) => (
        <Page page={page} idx={idx} project={project} key={page.id} />
      ))}
    </div>
  );
}
