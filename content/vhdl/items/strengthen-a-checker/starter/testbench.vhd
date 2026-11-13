library ieee;
use ieee.std_logic_1164.all;
use std.env.all;

entity testbench is
end entity;

architecture test of testbench is
    signal clk, reset, load : std_logic := '0';
    signal d, q : std_logic_vector(7 downto 0) := (others => '0');
    component dut is
        port (
            clk, reset, load : in std_logic;
            d : in std_logic_vector(7 downto 0);
            q : out std_logic_vector(7 downto 0)
        );
    end component;
begin
    clk <= not clk after 5 ns;
    unit_under_test : dut port map (clk, reset, load, d, q);
    checker : process
        variable errors : natural := 0;
        procedure load_and_check(constant value : in std_logic_vector(7 downto 0)) is
        begin
            wait until falling_edge(clk);
            d <= value;
            load <= '1';
            wait until rising_edge(clk);
            wait for 1 ns;
            load <= '0';
            if q /= value then
                errors := errors + 1;
            end if;
        end procedure;
    begin
        reset <= '1';
        wait until rising_edge(clk);
        wait for 1 ns;
        reset <= '0';
        load_and_check(x"00");
        load_and_check(x"A5");
        load_and_check(x"FF");
        -- TODO: prove hold behavior and reset priority using nonzero state.
        if errors = 0 then
            report "CHECK_PASS" severity note;
        else
            report "CHECK_FAIL load checks" severity note;
        end if;
        stop;
        wait;
    end process;
end architecture;
