A print workshop uses extraction equipment to draw dust away from its workbenches, with a request and a blocking switch at each bench. Because workshops have different numbers of benches, the control board needs to provide the same independent permission for however many are installed. You are building that repeated control structure together with a shared light that shows whether any bench has permission to run extraction.

Generic `LANES` is the number of benches and defaults to `4`. Inputs `request` and `inhibit`, and output `grant`, each have one bit per bench. Output `any_grant` is one bit. This lesson uses named generate structures to construct the copies; the request and inhibit inputs still change during operation.

Keep the supplied interface. **Run tests** checks every task; a completed task can pass while later tasks are still unfinished.

## 1. Generate independent permissions

Each workbench needs to control its own extraction request without affecting its neighbours. Build the repeated permission circuits so every bench has the same rule and responds only to its own controls.

For each workbench, the corresponding `grant` bit is high only while that bench requests extraction and its own inhibit bit is low. A different lane’s inputs must not affect it. Use a named generate loop to build the copies.

**Reason it through:** Which signals belong to one bench? Does the generate index change while the circuit runs?

**Check your reasoning:** For request=1011 and inhibit=0010, expect grant=1001. Change one inhibit bit and watch only its lane.

## 2. Select the summary structure

The workshop owner also wants one light that shows whether any bench is using extraction. Add this summary for both a single-bench workshop and a workshop with several independent benches.

any_grant is high when at least one lane is granted. Describe a generate-time choice for the one-lane case and the multiple-lane case; they must implement the same meaning.

**Reason it through:** What does the summary need to do for one bench? Can a changing request input choose a different generate branch?

**Check your reasoning:** Inspect the generated hierarchy and compare the summary with the visible grant bits. A one-lane configuration should still have a one-bit answer.
