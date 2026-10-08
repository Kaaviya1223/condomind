"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireManager } from "@/lib/auth";
import {
  fail,
  oneOf,
  optionalNumber,
  optionalText,
  succeed,
  text,
  uuidField,
} from "@/lib/form";
import { triageRequest as runTriage } from "@/lib/gemini";
import {
  CATEGORIES,
  PRIORITIES,
  REQUEST_STATUSES,
  UNIT_STATUSES,
} from "@/lib/labels";

const NO_ACCESS = "That record was not found or you do not manage it.";

// Buildings

export async function createBuilding(formData: FormData) {
  const { supabase } = await requireManager();
  const name = text(formData, "name");
  const address = text(formData, "address");

  if (!name || !address) {
    fail("/manage/buildings/new", "Name and address are required.");
  }

  const { data, error } = await supabase.rpc("create_building", {
    p_name: name,
    p_address: address,
  });

  if (error || !data) {
    fail("/manage/buildings/new", error?.message ?? "Could not create the building.");
  }

  revalidatePath("/manage", "layout");
  redirect(`/manage/buildings/${data}`);
}

export async function updateBuilding(formData: FormData) {
  const { supabase } = await requireManager();
  const id = uuidField(formData, "id");
  const name = text(formData, "name");
  const address = text(formData, "address");
  if (!id) fail("/manage/buildings", NO_ACCESS);

  const path = `/manage/buildings/${id}`;
  const tabPath = `${path}?tab=settings`;
  if (!name || !address) fail(tabPath, "Name and address are required.");

  const { data, error } = await supabase
    .from("buildings")
    .update({ name, address })
    .eq("id", id)
    .select("id");

  if (error) fail(tabPath, error.message);
  if (!data?.length) fail(tabPath, NO_ACCESS);

  revalidatePath(path);
  succeed(tabPath, "Building saved.");
}

export async function deleteBuilding(formData: FormData) {
  const { supabase } = await requireManager();
  const id = uuidField(formData, "id");
  if (!id) fail("/manage/buildings", NO_ACCESS);

  const { data, error } = await supabase
    .from("buildings")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) fail(`/manage/buildings/${id}?tab=settings`, error.message);
  if (!data?.length) fail("/manage/buildings", NO_ACCESS);

  revalidatePath("/manage", "layout");
  succeed("/manage/buildings", "Building deleted.");
}

// Units

function unitFields(formData: FormData) {
  return {
    unit_no: text(formData, "unit_no"),
    floor_area_sqft: optionalNumber(formData, "floor_area_sqft"),
    share_units: optionalNumber(formData, "share_units") ?? 1,
    status: oneOf(text(formData, "status"), UNIT_STATUSES) ?? "occupied",
  };
}

export async function createUnit(formData: FormData) {
  const { supabase } = await requireManager();
  const buildingId = uuidField(formData, "building_id");
  if (!buildingId) fail("/manage/buildings", NO_ACCESS);

  const path = `/manage/buildings/${buildingId}`;
  const fields = unitFields(formData);
  if (!fields.unit_no) fail(path, "Unit number is required.");

  const { error } = await supabase
    .from("units")
    .insert({ ...fields, building_id: buildingId });

  if (error) fail(path, error.message);

  revalidatePath(path);
  succeed(path, `Unit ${fields.unit_no} added.`);
}

export async function updateUnit(formData: FormData) {
  const { supabase } = await requireManager();
  const id = uuidField(formData, "id");
  if (!id) fail("/manage/buildings", NO_ACCESS);

  const path = `/manage/units/${id}`;
  const fields = unitFields(formData);
  if (!fields.unit_no) fail(path, "Unit number is required.");

  const { data, error } = await supabase
    .from("units")
    .update(fields)
    .eq("id", id)
    .select("id");

  if (error) fail(path, error.message);
  if (!data?.length) fail(path, NO_ACCESS);

  revalidatePath(path);
  succeed(path, "Unit saved.");
}

export async function deleteUnit(formData: FormData) {
  const { supabase } = await requireManager();
  const id = uuidField(formData, "id");
  const buildingId = uuidField(formData, "building_id");
  if (!id || !buildingId) fail("/manage/buildings", NO_ACCESS);

  const path = `/manage/buildings/${buildingId}`;
  const { data, error } = await supabase
    .from("units")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) fail(`/manage/units/${id}`, error.message);
  if (!data?.length) fail(path, NO_ACCESS);

  revalidatePath(path);
  succeed(path, "Unit deleted.");
}

// Owners and tenants

const RESIDENT_TABLES = ["owners", "tenants"] as const;

function residentFields(formData: FormData, table: (typeof RESIDENT_TABLES)[number]) {
  const base = {
    full_name: text(formData, "full_name"),
    ic_no: optionalText(formData, "ic_no"),
    email: optionalText(formData, "email")?.toLowerCase() ?? null,
    phone: optionalText(formData, "phone"),
  };
  if (table === "owners") return base;
  return {
    ...base,
    lease_start: optionalText(formData, "lease_start"),
    lease_end: optionalText(formData, "lease_end"),
  };
}

export async function saveResident(formData: FormData) {
  const { supabase } = await requireManager();
  const table = oneOf(text(formData, "table"), RESIDENT_TABLES);
  const unitId = uuidField(formData, "unit_id");
  const id = uuidField(formData, "id");
  if (!table || !unitId) fail("/manage/buildings", NO_ACCESS);

  const path = `/manage/units/${unitId}`;
  const fields = residentFields(formData, table);
  const kind = table === "owners" ? "Owner" : "Tenant";

  if (!fields.full_name) fail(path, "Full name is required.");

  if (id) {
    const { data, error } = await supabase
      .from(table)
      .update(fields)
      .eq("id", id)
      .eq("unit_id", unitId)
      .select("id");
    if (error) fail(path, error.message);
    if (!data?.length) fail(path, NO_ACCESS);
  } else {
    const { error } = await supabase
      .from(table)
      .insert({ ...fields, unit_id: unitId });
    if (error) fail(path, error.message);
  }

  revalidatePath(path);
  succeed(path, `${kind} ${id ? "saved" : "added"}.`);
}

export async function deleteResident(formData: FormData) {
  const { supabase } = await requireManager();
  const table = oneOf(text(formData, "table"), RESIDENT_TABLES);
  const unitId = uuidField(formData, "unit_id");
  const id = uuidField(formData, "id");
  if (!table || !unitId || !id) fail("/manage/buildings", NO_ACCESS);

  const path = `/manage/units/${unitId}`;
  const { data, error } = await supabase
    .from(table)
    .delete()
    .eq("id", id)
    .eq("unit_id", unitId)
    .select("id");

  if (error) fail(path, error.message);
  if (!data?.length) fail(path, NO_ACCESS);

  revalidatePath(path);
  succeed(path, `${table === "owners" ? "Owner" : "Tenant"} removed.`);
}

// Managers

export async function inviteManager(formData: FormData) {
  const { supabase } = await requireManager();
  const buildingId = uuidField(formData, "building_id");
  const email = text(formData, "email");
  if (!buildingId) fail("/manage/buildings", NO_ACCESS);

  const path = `/manage/buildings/${buildingId}`;
  const tabPath = `${path}?tab=managers`;
  if (!email) fail(tabPath, "Email is required.");

  const { error } = await supabase.rpc("invite_manager", {
    p_email: email,
    p_building_id: buildingId,
  });

  if (error) fail(tabPath, error.message);

  revalidatePath(path);
  succeed(tabPath, `${email} is now a manager of this building.`);
}

export async function removeManager(formData: FormData) {
  const { supabase, user } = await requireManager();
  const buildingId = uuidField(formData, "building_id");
  const userId = uuidField(formData, "user_id");
  if (!buildingId || !userId) fail("/manage/buildings", NO_ACCESS);

  const path = `/manage/buildings/${buildingId}`;
  const tabPath = `${path}?tab=managers`;
  const { error } = await supabase.rpc("remove_manager", {
    p_user_id: userId,
    p_building_id: buildingId,
  });

  if (error) fail(tabPath, error.message);

  if (userId === user.id) {
    revalidatePath("/manage", "layout");
    succeed("/manage/buildings", "You no longer manage that building.");
  }

  revalidatePath(path);
  succeed(tabPath, "Manager removed.");
}

// Maintenance requests

export async function updateRequest(formData: FormData) {
  const { supabase } = await requireManager();
  const id = uuidField(formData, "id");
  if (!id) fail("/manage/requests", NO_ACCESS);

  const path = `/manage/requests/${id}`;
  const status = oneOf(text(formData, "status"), REQUEST_STATUSES);
  const priority = oneOf(text(formData, "priority"), PRIORITIES);
  const categoryValue = text(formData, "category");
  const category = categoryValue ? oneOf(categoryValue, CATEGORIES) : null;
  const vendorValue = text(formData, "assigned_vendor_id");
  const vendorId = vendorValue ? uuidField(formData, "assigned_vendor_id") : null;

  if (!status || !priority || (categoryValue && !category) || (vendorValue && !vendorId)) {
    fail(path, "Please choose valid values.");
  }

  const { data, error } = await supabase
    .from("maintenance_requests")
    .update({ status, priority, category, assigned_vendor_id: vendorId })
    .eq("id", id)
    .select("id");

  if (error) fail(path, error.message);
  if (!data?.length) fail(path, NO_ACCESS);

  revalidatePath(path);
  revalidatePath("/manage/requests");
  succeed(path, "Request updated.");
}

export async function triageMaintenanceRequest(
  id: string
): Promise<{ error?: string }> {
  const { supabase } = await requireManager();

  const { data: request, error } = await supabase
    .from("maintenance_requests")
    .select("id, title, description, units(unit_no, buildings(name))")
    .eq("id", id)
    .maybeSingle();

  if (error || !request) {
    return { error: NO_ACCESS };
  }

  const unit = request.units as unknown as {
    unit_no: string;
    buildings: { name: string } | null;
  } | null;

  try {
    const triage = await runTriage({
      title: request.title,
      description: request.description,
      unitNo: unit?.unit_no ?? "unknown",
      buildingName: unit?.buildings?.name ?? "unknown",
    });

    const { error: updateError } = await supabase
      .from("maintenance_requests")
      .update({
        category: triage.category,
        priority: triage.priority,
        ai_notes: triage.notes,
      })
      .eq("id", id);

    if (updateError) {
      return { error: updateError.message };
    }
  } catch (err) {
    console.error("Triage failed", err);
    return { error: "Suggested triage is unavailable right now. Try again later." };
  }

  revalidatePath(`/manage/requests/${id}`);
  revalidatePath("/manage/requests");
  return {};
}
