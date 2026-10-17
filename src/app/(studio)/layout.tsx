import { Backdrop } from "@/components/shell/backdrop";

/** Book-making studio: full-screen editor floating over the terrace backdrop. */
export default function StudioLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="relative flex h-screen flex-col overflow-hidden">
      <Backdrop />
      {children}
    </div>
  );
}
