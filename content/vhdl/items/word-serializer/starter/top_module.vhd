library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
entity top_module is
    port (
        clk, reset, load : in std_logic;
        word : in std_logic_vector(7 downto 0);
        bit_out, busy : out std_logic
    );
end entity;

architecture rtl of top_module is
begin
    bit_out <= '0';
    busy <= '0'; -- TODO: load and serialize the word
end architecture;
