library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
entity top_module is
    port(clk,reset,in_valid:in std_logic;
    in_ready:out std_logic;
    in_data:in std_logic_vector(7 downto 0);
    out_valid:out std_logic;
    out_ready:in std_logic;
    out_data:out std_logic_vector(7 downto 0));
end entity;
architecture rtl of top_module is
    signal full:std_logic:='0';
    signal data:std_logic_vector(7 downto 0):=(others=>'0');
    signal ready_i:std_logic;
    begin
    ready_i<=(not full)or out_ready;
    in_ready<=ready_i;
    out_valid<=full;
    out_data<=data;
    process(clk)begin if rising_edge(clk)then if reset='1'then full<='0';
    elsif ready_i='1'then full<=in_valid;
        if in_valid='1'then data<=in_data;
        end if;
    end if;
end if;
end process;
end architecture;
