library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use std.env.all;
entity testbench is
end entity;
architecture sim of testbench is
    signal a : std_logic_vector(3 downto 0);
    signal b : std_logic_vector(3 downto 0);
    signal y : std_logic_vector(3 downto 0);
    signal select_b : std_logic;
    begin
    dut: entity work.selector
    port map (a => a, b => b, select_b => select_b, y => y);
    process
        begin
        a <= x"3";
        b <= x"C";
        select_b <= '0';
        wait
        for 1 ns;
            report "CHECK_FAIL unfinished checker" severity note;
            finish;
            wait;
        end process;
    end architecture;
