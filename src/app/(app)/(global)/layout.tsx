import { TopBar } from "@/components/shell/top-bar";

export default function GlobalLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <TopBar />
      {children}
    </>
  );
}
