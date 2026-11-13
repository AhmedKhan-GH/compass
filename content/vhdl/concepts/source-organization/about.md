# Packages and source order

A package declaration exposes shared types, constants, and subprogram signatures; a package body supplies deferred implementations. A `use` clause makes declarations visible. Analyze dependencies before the design units that use them, then elaborate the selected top entity.
