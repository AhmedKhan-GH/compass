library ieee;
use ieee.std_logic_1164.all;
use std.env.all;
entity testbench is end entity;
architecture test of testbench is
    signal clk, reset, load : std_logic := '0';
    signal d, q : std_logic_vector(7 downto 0) := (others => '0');
    component dut is port (clk, reset, load : in std_logic; d : in std_logic_vector(7 downto 0); q : out std_logic_vector(7 downto 0)); end component;
begin
    clk <= not clk after 5 ns;
    unit_under_test : dut port map (clk, reset, load, d, q);
    checker : process
        variable errors : natural := 0;
        procedure edge is begin wait until rising_edge(clk); wait for 1 ns; end procedure;
    begin
        reset <= '1'; edge; reset <= '0';
        wait until falling_edge(clk); d <= x"A5"; load <= '1'; edge;
        if q /= x"A5" then errors := errors + 1; end if;
        wait until falling_edge(clk); d <= x"3C"; load <= '0'; edge;
        if q /= x"A5" then errors := errors + 1; end if;
        wait until falling_edge(clk); d <= x"FF"; load <= '1'; reset <= '1'; edge;
        if q /= x"00" then errors := errors + 1; end if;
        if errors = 0 then report "CHECK_PASS" severity note;
        else report "CHECK_FAIL register checks" severity note; end if;
        stop; wait;
    end process;
end architecture;
