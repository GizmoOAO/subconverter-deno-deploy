import { serve } from "https://deno.land/std@0.146.0/http/server.ts";
import { decode } from "https://deno.land/std@0.146.0/encoding/base64.ts";
import { ProfileData } from "./types.ts";
import data from "./dist/data.js";

serve((req: Request) => {
  const u = new URL(req.url);
  const profile = u.pathname.replace("/", "");
  if (!profile || profile === "")
    return new Response("Powered by subconverter ❤️");
  if (!Object.prototype.hasOwnProperty.call(data, profile))
    return new Response("profile not found");
  const key = u.searchParams.get("key");
  if (!key || key === "") return new Response("key error");
  //@ts-ignore 🙃
  const info = data[profile] as ProfileData;
  const k = Deno.env.get(info.key_env);
  if (!k || key !== k) return new Response("key error");
  return new Response(decode(info.data), {
    headers: { "Cache-Control": "no-cache" },
  });
});
