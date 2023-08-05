// import { createClient } from "@supabase/supabase-js";
const { createClient } = require("@supabase/supabase-js");
// import { Database } from "../types/supabase";
// import * as dotenv from "dotenv";
// dotenv.config();
require("dotenv").config();

const supabaseClient = createClient({});

module.exports = {supabaseClient}