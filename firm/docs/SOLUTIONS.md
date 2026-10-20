# Solution catalogue

Firm-maintained design knowledge: possible responses to particular anticipated or observed issues. **An entry is not an active instruction, approved requirement or implementation commitment.** Consider it when its issue matters; agree adoption and scope with the user before turning it into policy. Keep the catalogue selective, not a speculative feature backlog.

The organization owns its playbook (identity, source precedence and working rules); the firm supplies the kit and maintains reusable solution knowledge. This catalogue contains neither private consultant records nor shared operational state.

## Uncertain external writes outside the optional outbox

**Status:** deferred; not part of the initial design requirements for ordinary tool use.

**Anticipated issue:** a remote write times out after it may have succeeded. An immediate retry could duplicate a message/comment or repeat an action; dependent work could proceed on an unsupported assumption.

**Candidate response:** inspect the destination before retrying; pause dependent actions while unresolved; report an unknown outcome when evidence cannot establish what happened. Exact inspection/retry behavior depends on the connector and action, not a universal mechanism.

**Consider adoption when:** a concrete workflow or observed failure makes ambiguous writes consequential and ordinary tool behavior does not adequately address them. Establish the action's failure modes and available readback first. No automatic trigger or mandatory gate is approved.

**Existing boundary:** the optional outbox already has human reconciliation for unknown outcomes; this entry does not change it. Deferral is not permission to claim success without evidence.

## Sentence-level clarity method for agent-facing text (ASD-STE100)

**Status:** adopted into firm engineering practice (`firm/skills/engineering/asd-ste100/`).

**Issue:** tool descriptions, agent instructions, error/recovery text and runbooks can leave the actor, condition, scope or stop point ambiguous.

**Candidate response:** an optional STE method for B, limited to those text types. Modality and evidence state must be preserved. It is not a mandate for consultation replies or analytical reports.

## Shared scene-based composition (HyperFrames)

**Status:** adopted and implemented in `firm/skills/shared/composition/` for B, C and D.

**Issue:** VHS terminal recordings and diagram-design's short explanatory motion do not provide a general scene-based visual-explainer production pipeline.

**Response:** reuse HyperFrames' HTML-native composition engine and selected pinned technical references alongside a small local CLI runner (`scripts/composition.mjs`), separate from D's `public-presentation` skill. The CLI installs only on an explicit per-office setup step into gitignored `.hq/tools/`. See `firm/skills/shared/composition/SOURCE.md` for provenance, licences and qualification limits.
