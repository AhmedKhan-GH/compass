library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
entity top_module is
    port (
        clk, reset, bit_in : in std_logic;
        match : out std_logic
    );
end entity;

architecture rtl of top_module is
begin
    match <= '0'; -- TODO: remember enough history to recognize overlapping patterns
end architecture;
