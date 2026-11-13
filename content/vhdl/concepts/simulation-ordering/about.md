# Delta cycles and observation

Signal assignments schedule updates, and dependent processes can react in later delta cycles at the same simulation time. A checker must observe the completed chain of updates rather than sample a stale value immediately after driving an input.
