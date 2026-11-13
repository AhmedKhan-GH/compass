library ieee;
use ieee.std_logic_1164.all;
use std.env.all;
entity testbench is end entity;
architecture sim of testbench is
    signal clk, reset, load : std_logic := '0';
    signal d : std_logic_vector(7 downto 0) := (others => '0');
    signal q : std_logic_vector(7 downto 0);
    component dut is port (clk, reset, load : in std_logic; d : in std_logic_vector(7 downto 0); q : out std_logic_vector(7 downto 0)); end component;
begin
    clk <= not clk after 5 ns; dut_i: dut port map (clk, reset, load, d, q);
    process
        variable errors : natural := 0;
        procedure check_load(value : std_logic_vector(7 downto 0)) is
        begin
            wait until falling_edge(clk); d <= value; load <= '1';
            wait until rising_edge(clk); wait for 1 ns;
            if q /= value then errors := errors + 1; end if;
            wait until falling_edge(clk); load <= '0';
        end procedure;
    begin
        reset <= '1'; wait until rising_edge(clk); reset <= '0';
        check_load(x"A5"); check_load(x"FF");
        if errors = 0 then report "CHECK_PASS" severity note;
        else report "CHECK_FAIL errors=" & integer'image(errors) severity note; end if;
        finish; wait;
    end process;
end architecture;
