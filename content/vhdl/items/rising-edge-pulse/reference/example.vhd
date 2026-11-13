library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
entity top_module is
    port (clk, reset, button : in std_logic;
    rise : out std_logic);
end entity;
architecture rtl of top_module is
    signal previous,rise_r:std_logic:='0';
    begin
    rise<=rise_r;
    process(clk)begin if rising_edge(clk)then if reset='1'then previous<='0';
        rise_r<='0';
    else rise_r<=button and not previous;
        previous<=button;
    end if;
end if;
end process;
end architecture;
