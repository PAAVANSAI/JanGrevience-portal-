"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addState(name: string, country: string = "India") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("states")
    .insert([{ name, country }])
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/admin/locations");
  revalidatePath("/grievances/new");
  return data;
}

export async function updateState(id: string, name: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("states")
    .update({ name })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/admin/locations");
  revalidatePath("/grievances/new");
  return data;
}

export async function deleteState(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("states")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/locations");
  revalidatePath("/grievances/new");
  return true;
}

export async function addDistrict(state_id: string, name: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("districts")
    .insert([{ state_id, name }])
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/admin/locations");
  revalidatePath("/grievances/new");
  return data;
}

export async function updateDistrict(id: string, name: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("districts")
    .update({ name })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/admin/locations");
  revalidatePath("/grievances/new");
  return data;
}

export async function deleteDistrict(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("districts")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/locations");
  revalidatePath("/grievances/new");
  return true;
}
