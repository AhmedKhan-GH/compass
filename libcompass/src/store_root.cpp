// Compass C2 — store-root classifier.

#include "compass/store_root.h"

namespace compass {
namespace {
// Drop trailing '/' so ".../c2" and ".../c2/" compare equal. Not a real path
// canonicalizer (no symlink/./.. resolution) — the roots Compass compares are
// the literal strings it handed the core and stored in the document.
std::string TrimSlash(std::string s) {
    while (s.size() > 1 && s.back() == '/') s.pop_back();
    return s;
}
}  // namespace

StoreKind ClassifyStoreRoot(const std::string& doc_root,
                            const std::string& session_root) {
    if (doc_root.empty()) return StoreKind::kOwn;
    return TrimSlash(doc_root) == TrimSlash(session_root) ? StoreKind::kOwn
                                                          : StoreKind::kForeign;
}

}  // namespace compass
