import { FolderSearch } from "lucide-react";
import { ButtonLink, EmptyState } from "@/components/ui";

export default function ProjectNotFound() {
  return (
    <div className="mx-auto max-w-xl p-8">
      <EmptyState
        icon={<FolderSearch />}
        title="We couldn’t find that project"
        body="It may have been renamed, or you might not have access yet. Ask the owner for an invite."
        action={<ButtonLink href="/projects" variant="primary">Back to my projects</ButtonLink>}
      />
    </div>
  );
}
