library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
entity level_compare is
    port (
    value : in std_logic_vector(7 downto 0);
    threshold : in std_logic_vector(7 downto 0);
    at_or_above : out std_logic
    );
end entity;
architecture rtl of level_compare is
    begin
    at_or_above <= '1'
when unsigned(value)>=unsigned(threshold)
else '0';
end architecture;
