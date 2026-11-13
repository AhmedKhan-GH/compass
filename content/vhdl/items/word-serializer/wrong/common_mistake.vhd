library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
entity top_module is
    port (clk, reset, load : in std_logic;
    word : in std_logic_vector(7 downto 0);
    bit_out, busy : out std_logic);
end entity;
architecture rtl -- Complete the TODOs in this starter.
    of top_module is
    signal data:std_logic_vector(7 downto 0):=(others=>'0');
    signal left:unsigned(3 downto 0):=(others=>'0');
    signal bit_r,busy_r:std_logic:='0';
    begin
    bit_out<=bit_r;
    busy<=busy_r;
    process(clk)begin if rising_edge(clk)then if reset='0'then data<=(others=>'0');
        left<=(others=>'0');
        bit_r<='0';
        busy_r<='0';
    elsif load='1' and busy_r='0'then data<=word;
        left<=to_unsigned(8,4);
        bit_r<=word(7);
        busy_r<='1';
    elsif busy_r='1'then if left=1 then left<=(others=>'0');
        bit_r<='0';
        busy_r<='0';
    else data<=data(6 downto 0)&'0';
        bit_r<=data(6);
        left<=left-1;
    end if;
end if;
end if;
end process;
end architecture;
