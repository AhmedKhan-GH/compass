library ieee;
use ieee.std_logic_1164.all;

entity top_module is
    port (
        output_signal : out std_logic
    );
end entity;

architecture rtl of top_module is
begin
    -- Task 1. Drive the output high: implement this requirement.
    output_signal <= '0';
end architecture;
