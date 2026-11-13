library ieee;
use ieee.std_logic_1164.all;
use std.env.all;
entity testbench is end entity;
architecture sim of testbench is
begin
    process
    begin
        report "CHECK_FAIL incomplete exposure worker" severity note;
        finish;
        wait;
    end process;
end architecture;
