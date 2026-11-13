library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use std.env.all;
entity testbench is
end entity;
architecture sim of testbench is
    signal left_signal : std_logic;
    signal right_signal : std_logic;
    signal enable : std_logic;
    signal lamp_a : std_logic;
    signal lamp_b : std_logic;
    begin
    dut: entity work.harness
    port map (
    left_signal => left_signal,
    right_signal => right_signal,
    enable => enable,
    lamp_a => lamp_a,
    lamp_b => lamp_b
    );
    process
        begin
        left_signal <= '0';
        right_signal <= '0';
        enable <= '0';
        wait
        for 1 ns;
            report "CHECK_FAIL unfinished checker" severity note;
            finish;
            wait;
        end process;
    end architecture;
