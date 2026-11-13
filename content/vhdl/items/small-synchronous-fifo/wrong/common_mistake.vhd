library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
entity top_module is
    generic(WIDTH:positive:=8;
    DEPTH:positive:=5;
    ADDR_WIDTH:positive:=3);
    port(clk,reset,in_valid:in std_logic;
    in_ready:out std_logic;
    in_data:in std_logic_vector(WIDTH-1 downto 0);
    out_valid:out std_logic;
    out_ready:in std_logic;
    out_data:out std_logic_vector(WIDTH-1 downto 0));
end entity;
architecture rtl -- Complete the TODOs in this starter.
    of top_module is
    type mem_t is array(0 to DEPTH-1)of std_logic_vector(WIDTH-1 downto 0);
    signal mem:mem_t:=(others=>(others=>'0'));
    signal wp,rp:natural range 0 to DEPTH-1:=0;
    signal n:natural range 0 to DEPTH:=0;
    signal push_i,pop_i:std_logic;
    begin
    in_ready<='1'when n<DEPTH else '0';
    out_valid<='1'when n>0 else '0';
    out_data<=mem(rp);
    push_i<='1'when in_valid='1'and n<DEPTH else '0';
    pop_i<='1'when out_ready='1'and n>0 else '0';
    process(clk)begin if rising_edge(clk)then if reset='0'then wp<=0;
        rp<=0;
        n<=0;
    else if push_i='1'then mem(wp)<=in_data;
        if wp=DEPTH-1 then wp<=0;
        else wp<=wp+1;
        end if;
    end if;
    if pop_i='1'then if rp=DEPTH-1 then rp<=0;
    else rp<=rp+1;
    end if;
end if;
if push_i='1'and pop_i='0'then n<=n+1;
elsif push_i='0'and pop_i='1'then n<=n-1;
end if;
end if;
end if;
end process;
end architecture;
