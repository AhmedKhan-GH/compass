library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
entity top_module is
    generic(WIDTH:positive:=8;
    DEPTH:positive:=5;
    ADDR_WIDTH:positive:=3);
    port(clk,reset,sample_valid:in std_logic;
    sample_data:in std_logic_vector(WIDTH-1 downto 0);
    age:in std_logic_vector(ADDR_WIDTH-1 downto 0);
    sample_out:out std_logic_vector(WIDTH-1 downto 0);
    count:out std_logic_vector(ADDR_WIDTH downto 0));
end entity;
architecture rtl -- Complete the TODOs in this starter.
    of top_module is
    type mem_t is array(0 to DEPTH-1)of std_logic_vector(WIDTH-1 downto 0);
    signal mem:mem_t:=(others=>(others=>'0'));
    signal wr:natural range 0 to DEPTH-1:=0;
    signal count_r:natural range 0 to DEPTH:=0;
    begin
    count<=std_logic_vector(to_unsigned(count_r,count'length));
    process(all)variable a,idx:natural;
        begin a:=to_integer(unsigned(age));
        if a<count_r then idx:=(wr+DEPTH-1-a)mod DEPTH;
            sample_out<=mem(idx);
        else sample_out<=(others=>'0');
        end if;
    end process;
    process(clk)begin if rising_edge(clk)then if reset='0'then wr<=0;
        count_r<=0;
    elsif sample_valid='1'then mem(wr)<=sample_data;
        if wr=DEPTH-1 then wr<=0;
        else wr<=wr+1;
        end if;
        if count_r<DEPTH then count_r<=count_r+1;
        end if;
    end if;
end if;
end process;
end architecture;
