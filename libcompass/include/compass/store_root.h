// Compass C2 — store-root classification (the honest-degradation register on
// data, spec §3 "Side-by-side comparison views / Live behavior").
//
// A run-comparison document names a metrics store root. Compass's ONE core is
// rooted at a single session data_dir (embed.h: data_dir is set at create, one
// core per process). Two cases follow, and the UI must tell them apart honestly:
//
//   Own    — the document's root is the running session's root (or unset). The
//            store is Compass's live connection: metrics.v1_1 reads see rows the
//            instant a same-process writer commits them, so the C1 UI-thread poll
//            keeps tables/plots current. No caveat.
//   Foreign — the document's root differs from the session root: it belongs to a
//            DIFFERENT process (e.g. a live Caliper session on Caliper's own
//            store). Per the C0b finding, a separate reader sees only rows the
//            writer has CHECKPOINTed — never faked as live. The view flags this.
//
// Pure + wx-free so it is unit-tested directly.

#ifndef COMPASS_STORE_ROOT_H
#define COMPASS_STORE_ROOT_H

#include <string>

namespace compass {

enum class StoreKind {
    kOwn,     // live poll; rows appear as they are written
    kForeign  // checkpoint-visibility caveat; rows appear as the writer checkpoints
};

// Classify a document's store root against the running core's session root.
// An empty doc_root means "Compass's own root" -> kOwn. Otherwise the two paths
// are compared after trailing-slash normalization; equal -> kOwn, else kForeign.
StoreKind ClassifyStoreRoot(const std::string& doc_root,
                            const std::string& session_root);

// True when the kind requires the checkpoint-visibility caveat surfaced in the UI.
inline bool NeedsCheckpointCaveat(StoreKind k) { return k == StoreKind::kForeign; }

}  // namespace compass

#endif  // COMPASS_STORE_ROOT_H
