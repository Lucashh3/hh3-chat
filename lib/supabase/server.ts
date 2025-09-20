import { cookies } from "next/headers";
import {
  createRouteHandlerClient,
  createServerComponentClient
} from "@supabase/auth-helpers-nextjs";

import type { Database } from "@/types/database";

export const createServerSupabaseClient = () =>
  createServerComponentClient<Database>({ cookies });

export const createSupabaseRouteHandlerClient = () => {
  const cookieStore = cookies();
  return createRouteHandlerClient<Database>({
    cookies: () => cookieStore
  });
};
