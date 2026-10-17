import { Backdrop } from "@/components/shell/backdrop";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="relative flex min-h-screen flex-col pb-10">
      <Backdrop />
      {children}
    </div>
  );
}
