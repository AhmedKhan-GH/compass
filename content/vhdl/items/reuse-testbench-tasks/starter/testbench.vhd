library ieee;
use ieee.std_logic_1164.all;
use std.env.all;

entity testbench is end entity;

architecture sim of testbench is
    signal clk, reset, load : std_logic := '0';
    signal d : std_logic_vector(7 downto 0) := (others => '0');
    signal q : std_logic_vector(7 downto 0);
    component dut is
        port (clk, reset, load : in std_logic; d : in std_logic_vector(7 downto 0); q : out std_logic_vector(7 downto 0));
    end component;
begin
    clk <= not clk after 5 ns;
    dut_i: dut port map (clk, reset, load, d, q);
    process
        variable errors : natural := 0;
        -- Task 1: declare and call a reusable load-and-hold checker.
        -- Task 2: check reset after a nonzero load and emit one verdict.
    begin
        reset <= '1'; wait until rising_edge(clk); wait for 1 ns; reset <= '0';
        report "CHECK_INCOMPLETE" severity note;
        finish; wait;
    end process;
end architecture;
