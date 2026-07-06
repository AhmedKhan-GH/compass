# Signal Workbench (Instrument #2) — the flagship, via the SDK entry point (§5.4).
# The second instrument built with compass_add_instrument(): proof the SDK makes
# instrument N+1 cheap. Links the signal logic lib + the GL catalog target.
compass_add_instrument(signal_workbench
    SOURCES
        main.cpp
        signal_frame.cpp
        waveform_canvas.cpp
    LIBS compass_signal compass::gl
)
