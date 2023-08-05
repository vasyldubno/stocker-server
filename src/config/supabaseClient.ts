// import { createClient } from "@supabase/supabase-js";
const { createClient } = require("@supabase/supabase-js");
// import { Database } from "../types/supabase";
// import * as dotenv from "dotenv";
// dotenv.config();
require("dotenv").config();

export const supabaseClient = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_KEY as string
);
