library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
entity top_module is
    port (
        clk, reset, start_pulse : in std_logic;
        duration : in std_logic_vector(3 downto 0);
        lamp : out std_logic
    );
end entity;

architecture rtl of top_module is
begin
    lamp <= '0'; -- TODO: hold the lamp on for the requested duration
end architecture;
