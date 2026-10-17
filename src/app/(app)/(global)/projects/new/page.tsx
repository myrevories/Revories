import { createProjectAction } from "@/app/actions";
import { ButtonLink } from "@/components/ui";
import { CATEGORIES } from "@/components/library/parts";

export const metadata = { title: "New project" };

export default function NewProjectPage() {
  return (
    <div className="mx-auto mt-6 max-w-2xl px-3">
      <form action={createProjectAction} className="glass p-8">
        <p className="eyebrow-wide">New project</p>
        <h1 className="mt-3 font-display text-[48px] leading-none text-ink">What are you preserving?</h1>
        <p className="mt-3 text-[15px] text-ink-2">A project holds everything for one family, trip, season or chapter of life. You can rename it anytime.</p>

        <fieldset className="mt-7">
          <legend className="mb-2 text-[13px] text-ink">What kind of memories?</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {CATEGORIES.map((c, i) => (
              <label key={c.id} className="cursor-pointer">
                <input type="radio" name="category" value={c.id} defaultChecked={i === 0} className="peer sr-only" />
                <span className="flex h-12 items-center gap-2 rounded-2xl border border-white/80 bg-white/60 px-3 text-[13px] text-ink-2 transition peer-checked:border-accent-line peer-checked:bg-accent-soft peer-checked:text-accent [&>svg]:size-4 [&>svg]:stroke-[1.6]">
                  {c.icon}
                  {c.label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="mt-6 block text-[13px] text-ink">
          Project name
          <input name="name" required autoFocus placeholder="e.g. Martin Family Archive" className="mt-1.5 h-12 w-full rounded-2xl border border-white/80 bg-white/70 px-4 text-[15px] outline-none focus:bg-white" />
        </label>
        <label className="mt-4 block text-[13px] text-ink">
          A short line about it <span className="text-muted">(optional)</span>
          <input name="tagline" placeholder="Our people. Our places. Our stories." className="mt-1.5 h-11 w-full rounded-2xl border border-white/80 bg-white/70 px-4 text-[14px] outline-none focus:bg-white" />
        </label>
        <label className="mt-4 block text-[13px] text-ink">
          Description <span className="text-muted">(optional)</span>
          <textarea name="description" rows={3} placeholder="Who and what is this for?" className="mt-1.5 w-full resize-none rounded-2xl border border-white/80 bg-white/70 px-4 py-3 text-[14px] outline-none focus:bg-white" />
        </label>
        <div className="mt-7 flex items-center justify-end gap-2">
          <ButtonLink href="/projects" variant="ghost">
            Cancel
          </ButtonLink>
          <button type="submit" className="h-12 rounded-full bg-ink px-8 text-[14px] text-white shadow-[0_4px_14px_rgb(0_0_0/0.18)] hover:bg-black">
            Create Project
          </button>
        </div>
        <p className="mt-4 text-right text-[12px] text-muted">We’ll set up an Inbox album automatically, so uploads always have a home.</p>
      </form>
    </div>
  );
}
