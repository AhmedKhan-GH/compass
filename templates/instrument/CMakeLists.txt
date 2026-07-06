# Instrument Template — build definition.
#
# The whole instrument is one call to the SDK entry point (§5.4). Copy this
# directory, rename the target, list your sources — that is the entire build.
compass_add_instrument(instrument_template
    SOURCES
        note_document.cpp
        note_frame.cpp
        main.cpp
    # LIBS compass::glm   # add catalog / project logic targets here as needed
)
