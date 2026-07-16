# GL smoke test — first consumer of compass::Canvas2D. Links the framework shell
# (which brings compass::gl + wx). Verifies the GL 3.3-core pipeline at I3.
add_executable(gl_smoke WIN32 gl_smoke.cpp)
target_link_libraries(gl_smoke PRIVATE compass_shell wxWidgets::wxWidgets)
