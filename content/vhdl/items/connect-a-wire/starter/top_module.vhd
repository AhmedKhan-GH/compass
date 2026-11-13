library ieee;
use ieee.std_logic_1164.all;

entity top_module is
    port (
        -- Task 1: add a connection for the visitor's switch.
        output_signal : out std_logic
    );
end entity;

architecture rtl of top_module is
begin
    -- Task 2: make the lightbox respond to the switch.
    output_signal <= '1';
end architecture;
