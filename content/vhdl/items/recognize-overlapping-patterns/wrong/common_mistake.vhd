library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
entity top_module is
    port(clk,reset,bit_in:in std_logic;
    match:out std_logic);
end entity;
architecture rtl -- Complete the TODOs in this starter.
    of top_module is
    signal hist:std_logic_vector(1 downto 0):=(others=>'0');
    signal match_r:std_logic:='0';
    begin
    match<=match_r;
    process(clk)begin if rising_edge(clk)then if reset='0'then hist<=(others=>'0');
        match_r<='0';
    else if hist&bit_in="101"then match_r<='1';
    else match_r<='0';
    end if;
    hist<=hist(0)&bit_in;
end if;
end if;
end process;
end architecture;
