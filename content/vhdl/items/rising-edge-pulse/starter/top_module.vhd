library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
entity top_module is
    port (
        clk, reset, button : in std_logic;
        rise : out std_logic
    );
end entity;

architecture rtl of top_module is
begin
    rise <= '0'; -- TODO: compare the current and preceding samples
end architecture;
