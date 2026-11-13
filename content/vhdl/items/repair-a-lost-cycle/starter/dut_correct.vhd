library ieee;
use ieee.std_logic_1164.all;
entity recorder is port(clk,reset:in std_logic;
    sample:in std_logic_vector(7 downto 0);
    recorded:out std_logic_vector(7 downto 0));
end;
architecture rtl of recorder is signal a,b,c:std_logic_vector(7 downto 0):=(others=>'0');
    begin recorded<=b;
    process(clk)begin
        if rising_edge(clk)then
            if reset='1'then a<=(others=>'0');
                b<=(others=>'0');
                c<=(others=>'0');
            else a<=sample;
                b<=a;
                c<=b;
            end if;
        end if;
    end process;
end;
