/**
 * Files that belong to the pack and not to the old source. The converter never rewrites or removes them:
 * an item's icon survives a reconversion, and the icons at the pack root are never touched.
 */
export const PACK_OWN_ITEM_FILES: readonly string[] = ["icon.svg"];
export const PACK_OWN_ROOT_FILES: readonly string[] = ["icon.svg", "category-icon.svg"];
