// C2 — store-root classifier: own -> live, foreign -> checkpoint caveat.
#define DOCTEST_CONFIG_IMPLEMENT_WITH_MAIN
#include "doctest.h"

#include "compass/store_root.h"

using namespace compass;

TEST_CASE("unset or equal root is own (live), trailing slash ignored") {
    CHECK(ClassifyStoreRoot("", "/data/session") == StoreKind::kOwn);
    CHECK(ClassifyStoreRoot("/data/session", "/data/session") == StoreKind::kOwn);
    CHECK(ClassifyStoreRoot("/data/session/", "/data/session") == StoreKind::kOwn);
    CHECK_FALSE(NeedsCheckpointCaveat(StoreKind::kOwn));
}

TEST_CASE("a different root is foreign and flags the checkpoint caveat") {
    const StoreKind k = ClassifyStoreRoot("/caliper/root", "/data/session");
    CHECK(k == StoreKind::kForeign);
    CHECK(NeedsCheckpointCaveat(k));
}
