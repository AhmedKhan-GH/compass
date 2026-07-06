# Instrument Template — build definition.
#
# A hand-written executable wiring the three translation units against the two
# framework layers. At increment 3 this whole file collapses to a single call:
#
#     compass_add_instrument(instrument_template
#         SOURCES note_document.cpp note_frame.cpp main.cpp)
#
# ...once the compass_add_instrument() helper lands. Until then, spell it out.

add_executable(instrument_template WIN32
    note_document.cpp
    note_frame.cpp
    main.cpp
)

# Sources include each other by bare name (e.g. #include "note_frame.h").
target_include_directories(instrument_template PRIVATE ${CMAKE_CURRENT_SOURCE_DIR})

target_link_libraries(instrument_template
    PRIVATE
        compass_shell        # Layer 2: App / DocumentFrame implementation
        compass_framework    # Layer 1: Document + headers (INTERFACE lib)
        wxWidgets::wxWidgets # the GUI toolkit
)
