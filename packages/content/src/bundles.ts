/** JSON solution bundles are data, never executable code. */
import { SolutionBundle, type ItemManifest } from "@compass/schema";

export function solutionBundle(text: string, manifest: ItemManifest): SolutionBundle {
  const bundle = SolutionBundle.parse(JSON.parse(text) as unknown);
  for (const name of Object.keys(bundle.sourceFiles)) {
    if (!manifest.design.editable.includes(name))
      throw new Error(`solution bundle replaces ${name}, which is not an editable support file`);
  }
  return bundle;
}
