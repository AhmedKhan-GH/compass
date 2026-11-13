library ieee;
    use ieee.std_logic_1164.all; entity door_chime is
    port (
        contact : in    std_logic;
        chime   : out   std_logic;
        trace   : out   std_logic
    );
end entity door_chime;

architecture rtl of door_chime is begin chime <= reject 3 ns inertial contact after 5 ns; trace <= transport contact after 5 ns; end architecture rtl;
