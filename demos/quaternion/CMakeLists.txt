# Quarantined GL 2.1 demo (PLATFORM.md §2, §7 I0). Deleted at the I3 GL
# modernization (§6.2, CD12); do not extend this code.
add_executable(quaternion_demo WIN32 main.cpp)
target_compile_definitions(quaternion_demo PRIVATE GLEW_STATIC)
target_link_libraries(quaternion_demo
    PRIVATE
        wxWidgets::wxWidgets
        ${OPENGL_LIBRARIES}
        GLEW::GLEW
        glm::glm
)
