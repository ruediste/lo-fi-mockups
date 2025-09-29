import classNames from "classnames";
import { MouseEventHandler, useEffect, useId, useState } from "react";
import { Dropdown, Form, FormCheckProps } from "react-bootstrap";
import { ThreeDotsVertical } from "react-bootstrap-icons";
import { BsPrefixProps, ReplaceProps } from "react-bootstrap/esm/helpers";

export function NumberInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const [valueStr, setValueStr] = useState("" + value);
  useEffect(() => setValueStr("" + value), [value]);

  return (
    <Form.Control
      type="number"
      value={valueStr}
      onChange={(e) => {
        const tmpStr = e.target.value;
        setValueStr(tmpStr);
        const tmp = parseFloat(tmpStr);
        if (!Number.isNaN(tmp)) {
          onChange(tmp);
        }
      }}
    />
  );
}

export interface IconButtonProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  ref?: React.Ref<HTMLButtonElement>;
}

export function IconButton({
  children,
  onClick,
  style,
  className,
  ref,
}: IconButtonProps) {
  return (
    <button
      ref={ref}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick?.(e);
      }}
      className={classNames("icon-button", className)}
      style={style}
    >
      {children}
    </button>
  );
}

function ThreeDotMenuToggle({
  onClick,
  ref,
}: {
  onClick: MouseEventHandler<any>;
  ref?: React.Ref<any>;
}) {
  return (
    <IconButton
      ref={ref}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick(e);
      }}
    >
      <ThreeDotsVertical />
    </IconButton>
  );
}

export function ThreeDotMenu({
  items,
  style,
}: {
  items: ({ label: string; checked?: boolean } & (
    | { onClick: () => void }
    | { href: string }
  ))[];
  style?: React.CSSProperties;
}) {
  const id = useId();
  return (
    <Dropdown style={style}>
      <Dropdown.Toggle as={ThreeDotMenuToggle} />
      <Dropdown.Menu className="super-colors">
        {items.map((item, idx) => (
          <Dropdown.Item
            key={idx}
            {...("href" in item ? { href: item.href, target: "_blank" } : {})}
            onClick={(e) => {
              e.stopPropagation();
              if (item.checked === undefined && "onClick" in item)
                item.onClick();
            }}
          >
            {item.checked !== undefined ? (
              <Form.Check
                id={id + "-" + idx}
                checked={item.checked}
                label={item.label}
                onChange={() => {
                  if ("onClick" in item) item.onClick();
                }}
              />
            ) : (
              item.label
            )}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
}

export function FormCheck(
  props: React.PropsWithChildren<
    ReplaceProps<"input", BsPrefixProps<"input"> & FormCheckProps>
  >
) {
  const id = useId();
  return <Form.Check {...props} id={id} />;
}
