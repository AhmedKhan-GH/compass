library ieee;
use ieee.std_logic_1164.all;
use std.env.all;
entity testbench is
end entity;
architecture test of testbench is
    signal clk, reset : std_logic := '0';
    signal sample, recorded : std_logic_vector(7 downto 0) := (others => '0');
    component recorder is
        port (
            clk, reset : in std_logic;
            sample : in std_logic_vector(7 downto 0);
            recorded : out std_logic_vector(7 downto 0)
        );
    end component;
begin
    clk <= not clk after 5 ns;
    unit_under_test : recorder port map (clk, reset, sample, recorded);
    checker : process
        procedure step(constant value : in std_logic_vector(7 downto 0)) is
        begin
            wait until falling_edge(clk);
            sample <= value;
            -- TODO: sample the result after the next active edge and compare it
            -- with an independently retained expected history value.
        end procedure;
    begin
        reset <= '1';
        wait until rising_edge(clk);
        wait for 1 ns;
        reset <= '0';
        step(x"11");
        step(x"A2");
        step(x"3C");
        step(x"F0");
        report "CHECK_FAIL incomplete latency scoreboard" severity note;
        stop;
        wait;
    end process;
    watchdog : process
    begin
        wait for 100 ns;
        report "CHECK_FAIL timeout" severity failure;
    end process;
end architecture;
