import Image from "next/image";
import Link from "next/link";
import { Wordmark } from "@compass/ui";

/** The approved Compass mark, verified and copied unchanged by scripts/sync-assets.mjs. */
export const MARK_SRC = "/sternbild/marks/compass-icon.svg";

/** The mark and the wordmark at the start of the command bar, linking to the catalog. */
export function Brand() {
  return (
    <Link href="/" className="sb-wordmark-link brand">
      <Image src={MARK_SRC} alt="" width={32} height={32} unoptimized className="brand-mark" />
      <Wordmark>Compass</Wordmark>
    </Link>
  );
}
