import Link from "next/link";
import { Flash } from "@/components/flash";
import { PageHeader } from "@/components/page-header";
import { SubmitButton } from "@/components/submit-button";
import { cardClass, inputClass, labelClass, secondaryButtonClass } from "@/components/ui";
import { createBuilding } from "../../actions";

export default function NewBuildingPage({
  searchParams,
}: {
  searchParams: { error?: string; message?: string };
}) {
  return (
    <>
      <PageHeader
        title="Add a building"
        description="You become its first manager. You can invite other managers afterwards."
        back={{ href: "/manage/buildings", label: "Buildings" }}
      />
      <Flash searchParams={searchParams} />
      <form action={createBuilding} className={`${cardClass} max-w-xl space-y-5 p-6`}>
        <div className="space-y-1.5">
          <label htmlFor="name" className={labelClass}>Building name</label>
          <input id="name" name="name" required placeholder="e.g. Taman Maju Condo" className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="address" className={labelClass}>Address</label>
          <input id="address" name="address" required placeholder="e.g. Jalan Maju 12, Petaling Jaya, Selangor" className={inputClass} />
        </div>
        <div className="flex gap-3 pt-2">
          <SubmitButton label="Add building" pendingLabel="Adding..." />
          <Link href="/manage/buildings" className={secondaryButtonClass}>
            Cancel
          </Link>
        </div>
      </form>
    </>
  );
}
