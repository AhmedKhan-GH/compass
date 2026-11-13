library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
entity top_module is
    port(clk,reset,valid:in std_logic;
    sample:in std_logic_vector(7 downto 0);
    out_valid:out std_logic;
    scaled:out std_logic_vector(7 downto 0));
end entity;
architecture rtl of top_module is
    signal valid_r:std_logic:='0';
    signal scaled_r:std_logic_vector(7 downto 0):=(others=>'0');
    begin
    out_valid<=valid_r;
    scaled<=scaled_r;
    process(clk)variable wide:unsigned(8 downto 0);
        begin if rising_edge(clk)then if reset='1'then valid_r<='0';
        scaled_r<=(others=>'0');
    else valid_r<=valid;
        if valid='1'then wide:=shift_left(resize(unsigned(sample),9),1);
            scaled_r<=std_logic_vector(wide(7 downto 0));
        end if;
    end if;
end if;
end process;
end architecture;
