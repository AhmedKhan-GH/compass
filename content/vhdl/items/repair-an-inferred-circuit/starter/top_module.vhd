library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
entity top_module is
    port(enable,select_input:in std_logic;
    a,b:in std_logic_vector(7 downto 0);
    y:out std_logic_vector(7 downto 0));
end entity;
architecture rtl -- Complete the TODOs in this starter.
    of top_module is
    begin
    y <= a
when enable='1' and select_input='1'
else a
when enable='1'
else (others=>'0');
end architecture;
