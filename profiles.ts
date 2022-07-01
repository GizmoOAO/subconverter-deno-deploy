import { Profile } from "./types.ts";

const profiles: Record<string, Profile> = {
  example: {
    target: "clash",
    key_env: "EXAMPLE_KEY",
    nodes: [
      "ss://Y2hhY2hhMjAtaWV0Zi1wb2x5MTMwNTpwYXNzd29yZA@www.example.com:1080#Example",
    ],
  },
};

export default profiles;
