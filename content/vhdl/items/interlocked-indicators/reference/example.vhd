library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
entity top_module is
    port(clk,reset,request_a,request_b:in std_logic;
    permit_a,permit_b:out std_logic);
end entity;
architecture rtl of top_module is
    type state_t is(idle,grant_a,grant_b);
    signal state:state_t:=idle;
    begin
    process(clk)begin if rising_edge(clk)then if reset='1'then state<=idle;
    else case state is when idle=>if request_a='1'then state<=grant_a;
    elsif request_b='1'then state<=grant_b;
    end if;
when grant_a=>if request_a='0'then state<=idle;
end if;
when grant_b=>if request_b='0'then state<=idle;
end if;
end case;
end if;
end if;
end process;
permit_a<='1'when state=grant_a else '0';
permit_b<='1'when state=grant_b else '0';
end architecture;
