import type { ButtonHTMLAttributes, ReactNode } from "react";

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label"> & {
  "aria-label": string;
  children: ReactNode;
  tone?: "default" | "danger";
};

export function IconButton({
  "aria-label": label,
  children,
  className = "",
  tone = "default",
  title,
  ...props
}: IconButtonProps) {
  const classes = ["icon-button", `icon-button--${tone}`, className].filter(Boolean).join(" ");

  return (
    <button aria-label={label} className={classes} title={title ?? label} {...props}>
      {children}
    </button>
  );
}
