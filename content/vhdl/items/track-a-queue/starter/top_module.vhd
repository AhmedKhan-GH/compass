library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
entity top_module is
    generic(DEPTH:positive:=5;
    ADDR_WIDTH:positive:=3);
    port(clk,reset,push,pop:in std_logic;
    empty,full:out std_logic;
    count:out std_logic_vector(ADDR_WIDTH downto 0);
    write_ptr,read_ptr:out std_logic_vector(ADDR_WIDTH-1 downto 0));
end entity;
architecture rtl -- Complete the TODOs in this starter.
    of top_module is
    signal count_r:natural range 0 to DEPTH:=0;
    signal wp,rp:natural range 0 to DEPTH-1:=0;
    signal do_push,do_pop:std_logic;
    begin
    empty<='1'when count_r=0
else '0';
    full<='1'when count_r=DEPTH
else '0';
    count<=std_logic_vector(to_unsigned(count_r,count'length));
    write_ptr<=std_logic_vector(to_unsigned(wp,ADDR_WIDTH));
    read_ptr<=std_logic_vector(to_unsigned(rp,ADDR_WIDTH));
    do_push<='1'when push='1'and count_r<DEPTH
else '0';
    do_pop<='1'when pop='1'and count_r>0
else '0';
    process(clk)begin
        if rising_edge(clk)then
            if reset='0'then count_r<=0;
                wp<=0;
                rp<=0;
            else
                if do_push='1'then
                    if wp=DEPTH-1 then wp<=0;
                    else wp<=wp+1;
                    end if;
                end if;
                if do_pop='1'then
                    if rp=DEPTH-1 then rp<=0;
                    else rp<=rp+1;
                    end if;
                end if;
                if do_push='1'and do_pop='0'then count_r<=count_r+1;
                elsif do_push='0'and do_pop='1'then count_r<=count_r-1;
                end if;
            end if;
        end if;
    end process;
end architecture;
