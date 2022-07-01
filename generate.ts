import {
  copy,
  readerFromStreamReader,
} from "https://deno.land/std@0.146.0/streams/mod.ts";
import { copy as fsCopy } from "https://deno.land/std@0.146.0/fs/mod.ts";
import { encode } from "https://deno.land/std@0.146.0/encoding/base64.ts";
import * as path from "https://deno.land/std@0.146.0/path/mod.ts";
import { ProfileData } from "./types.ts";
import profiles from "./profiles.ts";

const filename = await download_subconverter();
await Deno.stat("subconverter").catch(
  async () => await eXtract_subconverter(filename)
);

await Promise.all([
  fsCopy("config", "subconverter/config", { overwrite: true }),
  fsCopy("rules", "subconverter/rules", { overwrite: true }),
]);

await generate();
await bundle();

function download_subconverter(): Promise<string> {
  const version = "v0.7.2";
  const os = Deno.build.os === "windows" ? "win" : Deno.build.os;
  const filename = `subconverter_${os}64.${os === "win" ? "7z" : "tar.gz"}`;
  return new Promise<string>((resolve, _) => {
    Deno.stat(filename)
      .then(() => resolve(filename))
      .catch(async () => {
        const downloadUrl = `https://github.com/tindy2013/subconverter/releases/download/${version}/${filename}`;
        const file = await Deno.open(filename, { create: true, write: true });
        const res = await fetch(downloadUrl);
        const reader = readerFromStreamReader(res.body!.getReader());
        await copy(reader, file);
        file.close();
        resolve(filename);
      });
  });
}

async function eXtract_subconverter(filename: string) {
  const cmd =
    filename.indexOf(".tar.gz") !== -1
      ? ["tar", "xzvf", filename]
      : ["7z", "x", filename, "-y"];
  const p = Deno.run({ cmd });
  await p.status();
  p.close();
}

async function generate() {
  await Deno.mkdir("dist", { recursive: true });
  let generate_file = "";
  for (const key in profiles) {
    if (Object.prototype.hasOwnProperty.call(profiles, key)) {
      const profile = profiles[key];

      const nodes = profile.nodes.join("\n");
      await Deno.writeFile(
        `subconverter/profiles/${key}_node.txt`,
        new TextEncoder().encode(nodes)
      );

      let profile_file = `[Profile]
target=${profile.target}
url=!!import:profiles/${key}_node.txt
config=config/MyConfig.ini
filename=${key}
`;
      if (Object.prototype.hasOwnProperty.call(profile, "emoji"))
        profile_file += `emoji=${profile.emoji}\n`;
      if (Object.prototype.hasOwnProperty.call(profile, "udp"))
        profile_file += `udp=${profile.udp}\n`;
      if (Object.prototype.hasOwnProperty.call(profile, "tfo"))
        profile_file += `tfo=${profile.tfo}\n`;
      if (Object.prototype.hasOwnProperty.call(profile, "exclude"))
        profile_file += `exclude=(${profile.exclude!.join("|")})\n`;
      await Deno.writeFile(
        `subconverter/profiles/${key}.ini`,
        new TextEncoder().encode(profile_file)
      );

      generate_file += `
[${key}]
path=../dist/${key}
profile=profiles/${key}.ini
`;
    }
  }

  await Deno.writeFile(
    `subconverter/generate.ini`,
    new TextEncoder().encode(generate_file)
  );

  const p = Deno.run({
    cmd: [path.resolve("subconverter/subconverter"), "-g"],
    cwd: path.resolve("subconverter"),
  });
  await p.status();
  p.close();
}

async function bundle() {
  const datas: Record<string, ProfileData> = {};
  for (const key in profiles) {
    if (Object.prototype.hasOwnProperty.call(profiles, key)) {
      const profile = profiles[key];
      const f = await Deno.readTextFile(`dist/${key}`);
      datas[key] = {
        key_env: profile.key_env,
        data: encode(f),
      };
      await Deno.remove(`dist/${key}`);
    }
  }

  const content = `export default ${JSON.stringify(datas)}`;
  await Deno.writeFile("dist/data.js", new TextEncoder().encode(content));

  const p = Deno.run({ cmd: ["deno", "bundle", "deploy.ts", "dist/index.js"] });
  await p.status();
  p.close();

  await Deno.remove(`dist/data.js`);
}
