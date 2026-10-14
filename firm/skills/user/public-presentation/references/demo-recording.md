# Producing a demo recording

Optional. Use only when the user wants a README hero GIF or similar recording produced, not when reviewing one.

The method is a scripted terminal recording with VHS (github.com/charmbracelet/vhs): a `.tape` file says what to type and how long to wait, and VHS records it in a hidden terminal. The same tape gives the same recording, so it can be re-run when the interface changes.

**Needs** (not shipped with the offices): `vhs`, `ttyd` and `ffmpeg` (`brew install vhs` brings all three), a model that can read images to check frames, and any real accounts the demo calls. Real model calls cost money and vary between takes.

## Steps
1. **Build a clean demo world.** Never record the user's real setup. Use a separate config directory (for Pi: `PI_CODING_AGENT_DIR=<demo>/agent`), demo settings without personal preferences, a prepared session or fixture that already shows the problem on the first frame, and a quiet start-up (for Pi: a placeholder model in `agent/models.json`, so no "no models" warning appears).
2. **Write the tape.** `Set Width 1280`, `Set Height 720`, `Set Theme "GitHub Dark"`; `Type "..."` then `Enter`; `Sleep` long enough to read a result; wrap set-up and slow waits in `Hide` … `Show`; `Screenshot` frames to check. Aim for 20–30 seconds and 2–3 scenes, and drop scenes that read as a wall of text.
3. **Record:** `vhs demo.tape`.
4. **Check frames before trusting it:** `ffmpeg -ss <seconds> -i demo.gif -frames:v 1 f.png` for several moments; look for warnings, errors, half-loaded screens and private paths. Re-shoot until clean.
5. **Ship it:** keep the GIF under about 1–2 MB; embed it with an absolute `raw.githubusercontent.com/.../main/...` URL so package pages show it too; keep the tape in the repository (for example `docs/tapes/`) with a header comment explaining how to rebuild the demo world.

Report what the recording shows, its length and size, which calls were real, and anything you could not check.
