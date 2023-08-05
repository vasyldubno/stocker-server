import { createClient } from "@supabase/supabase-js";
import { Database } from "../types/supabase";
import * as dotenv from "dotenv";
dotenv.config();

export const supabaseClient = createClient<Database>(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_KEY as string
);
