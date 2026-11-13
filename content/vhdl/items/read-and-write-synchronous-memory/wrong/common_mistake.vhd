library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
entity top_module is
    generic(WIDTH:positive:=8;
    DEPTH:positive:=5;
    ADDR_WIDTH:positive:=3);
    port(clk,reset,write_en:in std_logic;
    write_addr:in std_logic_vector(ADDR_WIDTH-1 downto 0);
    write_data:in std_logic_vector(WIDTH-1 downto 0);
    read_addr:in std_logic_vector(ADDR_WIDTH-1 downto 0);
    read_data:out std_logic_vector(WIDTH-1 downto 0));
end entity;
architecture rtl -- Complete the TODOs in this starter.
    of top_module is
    type mem_t is array(0 to DEPTH-1)of std_logic_vector(WIDTH-1 downto 0);
    signal mem:mem_t:=(others=>(others=>'0'));
    signal read_r:std_logic_vector(WIDTH-1 downto 0):=(others=>'0');
    begin
    read_data<=read_r;
    process(clk)variable wa,ra:natural;
        begin if rising_edge(clk)then wa:=to_integer(unsigned(write_addr));
        ra:=to_integer(unsigned(read_addr));
        if reset='0'then mem<=(others=>(others=>'0'));
            read_r<=(others=>'0');
        else if write_en='1'and wa<DEPTH then mem(wa)<=write_data;
        end if;
        if write_en='1'and wa=ra and wa<DEPTH then read_r<=write_data;
        elsif ra<DEPTH then read_r<=mem(ra);
        else read_r<=(others=>'0');
        end if;
    end if;
end if;
end process;
end architecture;
