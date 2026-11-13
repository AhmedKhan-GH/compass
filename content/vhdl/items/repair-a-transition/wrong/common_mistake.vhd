library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
entity top_module is
    port(clk,reset,advance:in std_logic;
    state:out std_logic_vector(1 downto 0));
end entity;
architecture rtl -- Complete the TODOs in this starter.
    of top_module is
    signal state_r:unsigned(1 downto 0):=(others=>'0');
    begin
    state<=std_logic_vector(state_r);
    process(clk)begin if rising_edge(clk)then if reset='0'then state_r<=(others=>'0');
    elsif advance='1'then case to_integer(state_r)is when 0=>state_r<=to_unsigned(1,2);
    when 1=>state_r<=to_unsigned(2,2);
    when others=>state_r<=(others=>'0');
    end case;
end if;
end if;
end process;
end architecture;
