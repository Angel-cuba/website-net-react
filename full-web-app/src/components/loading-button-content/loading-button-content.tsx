import type { ReactNode } from "react";
import { LoaderCircle } from "lucide-react";

type LoadingButtonContentProps = {
  children: ReactNode;
  icon: ReactNode;
  isLoading: boolean;
  loadingLabel: string;
};

export function LoadingButtonContent({
  children,
  icon,
  isLoading,
  loadingLabel,
}: LoadingButtonContentProps) {
  return (
    <>
      {isLoading ? (
        <LoaderCircle aria-hidden="true" className="is-spinning" />
      ) : (
        icon
      )}
      <span>{isLoading ? loadingLabel : children}</span>
    </>
  );
}
