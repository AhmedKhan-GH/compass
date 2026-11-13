library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
entity top_module is
    port(clk,reset,alarm,acknowledge:in std_logic;
    immediate_warning,stored_warning:out std_logic);
end entity;
architecture rtl -- Complete the TODOs in this starter.
    of top_module is
    signal active:std_logic:='0';
    begin
    immediate_warning<=alarm;
    stored_warning<=active;
    process(clk)begin if rising_edge(clk)then if reset='0'then active<='0';
    elsif acknowledge='1'then active<='0';
    elsif alarm='1'then active<='1';
    end if;
end if;
end process;
end architecture;
