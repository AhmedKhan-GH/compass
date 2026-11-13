library ieee;
use ieee.std_logic_1164.all;
entity dut is port(clk,reset,push,pop:in std_logic;
    din:in std_logic_vector(7 downto 0);
    dout:out std_logic_vector(7 downto 0);
    empty:out std_logic);
end;
architecture rtl of dut is type mem_t is array(0 to 7)of std_logic_vector(7 downto 0);
    signal mem:mem_t;
    signal wp,rp,n:integer range 0 to 8:=0;
    begin empty<='1'when n=0
else '0';
    dout<=mem(rp);
    process(clk)begin
        if rising_edge(clk)then
            if reset='1'then wp<=0;
                rp<=0;
                n<=0;
            else
                if push='1'then mem(wp)<=din;
                    wp<=(wp+1)mod 8;
                end if;
                if pop='1'and n>0 then rp<=(rp+1)mod 8;
                end if;
                if push='1'and pop='0'then n<=n+1;
                elsif pop='1'and push='0'and n>0 then n<=n-1;
                end if;
            end if;
        end if;
    end process;
end;
