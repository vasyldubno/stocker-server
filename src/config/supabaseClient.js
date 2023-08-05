// import { createClient } from "@supabase/supabase-js";
const { createClient } = require("@supabase/supabase-js");
// import { Database } from "../types/supabase";
// import * as dotenv from "dotenv";
// dotenv.config();
require("dotenv").config();

const supabaseClient = createClient(
  'https://cufytakzggluwlfdjqsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1Znl0YWt6Z2dsdXdsZmRqcXNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTAzNzAyMDcsImV4cCI6MjAwNTk0NjIwN30.IAvHQ2HBCWaPzq71nK3e9k_h3Cu7VYVMBzCghiaqDl4'
);

module.exports = {supabaseClient}